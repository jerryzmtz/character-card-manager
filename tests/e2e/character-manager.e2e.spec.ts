import { expect, test } from '@playwright/test';

const pageUrl = 'http://127.0.0.1:5500/dist/角色卡管理器预览/index.html';
const scriptUrl = 'http://127.0.0.1:5500/dist/角色卡管理器/index.js';

test.beforeEach(async ({ page }) => {
  await page.route(/\/thumbnail\?/, route =>
    route.fulfill({
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="180" height="240"><rect width="180" height="240" fill="#223044"/></svg>',
    }),
  );
  await page.route(/\/characters\//, route =>
    route.fulfill({
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200"><rect width="900" height="1200" fill="#324766"/></svg>',
    }),
  );
  await page.addInitScript(() => {
    document.addEventListener('DOMContentLoaded', () => {
      const menu = document.createElement('div');
      menu.id = 'extensionsMenu';
      document.body.prepend(menu);
    });
    window.characters = [
      {
        avatar: '莉莉丝.png',
        name: '莉莉丝',
        fav: true,
        date_added: 1700000000000,
        date_last_chat: 1700000500000,
        data: {
          creator: '测试作者',
          description:
            '夜城里的观察者，负责验证中文 DOM。'.repeat(120) +
            '\n\n她会带着很长的角色说明，专门验证右侧详情栏使用内部滚动，而不是把整个面板撑高。',
          first_mes: '你好，旅行者。',
          character_book: { name: '夜城世界书', entries: [{ comment: '入口', content: '内容' }] },
          character_version: '1.0',
        },
      },
      {
        avatar: '空白卡.png',
        name: '空白卡',
        date_added: 1600000000000,
        data: {
          creator: '另一位作者',
          description: '缺少主开场白的测试卡。',
        },
      },
    ];
    window.__dangerousApiCalls = [];
    window.__saveSettingsCount = 0;
    window.__tavernContext = {
      characters: window.characters,
      tags: [
        { id: '整理', name: '待整理', color: '#5599ff' },
        { id: '日文', name: '日本語' },
      ],
      tagMap: { '莉莉丝.png': ['整理'], '空白卡.png': [] },
      getCharacters: async () => window.characters,
      selectCharacterById: async id => {
        window.this_chid = Number(id);
      },
      openCharacterChat: async chatfile => {
        window.__openedChat = chatfile;
      },
      saveSettingsDebounced: async () => {
        window.__saveSettingsCount += 1;
      },
    };
    window.SillyTavern = {
      getContext: () => window.__tavernContext,
    };
    window.getCharacters = async () => window.characters;
    window.getThumbnailUrl = (type, file) => `/thumbnail?type=${type}&file=${encodeURIComponent(file)}`;
    const nativeFetch = window.fetch.bind(window);
    window.__characterImageRequests = [];
    window.fetch = async (_url, options) => {
      if (String(_url).startsWith('/characters/')) {
        window.__characterImageRequests.push(String(_url));
        return nativeFetch(_url, options);
      }
      if (/\/api\/characters\/(?:delete|rename|edit)|\/api\/worldinfo\/edit/.test(String(_url))) {
        window.__dangerousApiCalls.push(String(_url));
      }
      const body = JSON.parse(String(options?.body || '{}'));
      if (String(_url) === '/api/characters/merge-attributes') {
        const target = window.characters.find(character => character.avatar === body.avatar);
        if (target) {
          if ('fav' in body) target.fav = body.fav;
          target.data = {
            ...target.data,
            ...(body.data || {}),
            extensions: { ...(target.data.extensions || {}), ...(body.data?.extensions || {}) },
          };
          if ('fav' in body) {
            target.data.fav = body.fav;
            target.data.extensions.fav = body.fav;
          }
        }
        return { ok: true, status: 200, text: async () => '' };
      }
      if (String(_url) === '/api/characters/rename') {
        const target = window.characters.find(character => character.avatar === body.avatar_url);
        if (target) {
          target.avatar = `${body.new_name}.png`;
          target.name = body.new_name;
          target.data = { ...target.data, name: body.new_name };
        }
        return { ok: true, status: 200, json: async () => ({ avatar: `${body.new_name}.png` }) };
      }
      if (String(_url) === '/api/characters/chats') {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            '莉莉丝 - 初次聊天.jsonl': { chat_items: 6, last_mes: 1700000600000 },
            '莉莉丝 - 夜城后续.jsonl': { chat_items: 12, last_mes: 1700000700000 },
          }),
        };
      }
      if (String(_url) === '/api/chats/get') {
        return {
          ok: true,
          status: 200,
          json: async () => [{ chat_metadata: { note_depth: 4 } }, { name: '莉莉丝', mes: `聊天内容：${body.chatfile}` }],
        };
      }
      if (String(_url) === '/api/chats/delete') {
        window.__deletedChats = [...(window.__deletedChats || []), body.chatfile];
        return { ok: true, status: 200, text: async () => '' };
      }
      if (String(_url) === '/api/worldinfo/delete') {
        window.__deletedWorldBooks = [...(window.__deletedWorldBooks || []), body.name];
        return { ok: true, status: 200, text: async () => '' };
      }
      if (String(_url) === '/api/characters/delete') {
        const index = window.characters.findIndex(character => character.avatar === body.avatar_url);
        if (index >= 0) window.characters.splice(index, 1);
        delete window.__tavernContext.tagMap[body.avatar_url];
        return { ok: true, status: 200, text: async () => '' };
      }
      const selected = window.characters.find(character => character.avatar === body.avatar_url);
      if (!selected) {
        return { ok: false, status: 404, json: async () => ({}) };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({
          tokens: 2048,
          data: {
            name: selected.name,
            creator: selected.data.creator,
            description: selected.data.description,
            first_mes: selected.data.first_mes || '',
            alternate_greetings:
              selected.name === '莉莉丝'
                ? [
                    '第二开场：你从夜色里推门进来，她抬头看向你。'.repeat(60),
                    '第三开场：雨声压过街道，她把终端屏幕转向你。'.repeat(60),
                    '第四开场：旧电梯停在顶楼，空气里全是未说出口的线索。'.repeat(60),
                  ]
                : [],
            character_book: selected.data.character_book || '',
            character_version: selected.data.character_version || '',
          },
        }),
      };
    };
  });
});

test('预览页不依赖外部 fflate CDN', async ({ request }) => {
  const response = await request.get(pageUrl);
  expect(response.ok()).toBeTruthy();
  const html = await response.text();
  expect(html).not.toContain('testingcf.jsdelivr.net/npm/fflate');
  expect(html).not.toContain('cdn.jsdelivr.net/npm/fflate');
});

test('打开后显示角色列表、搜索和详情预览，中文 DOM 正常', async ({ page }) => {
  await page.goto(pageUrl);

  await expect(page.getByRole('heading', { name: '角色卡管理器' })).toBeVisible();
  await expect(page.getByRole('button', { name: '莉莉丝', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '空白卡', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '全部 2' })).toBeVisible();
  await expect(page.getByRole('button', { name: '无标签 1' })).toBeVisible();
  await expect(page.getByRole('button', { name: '待整理 1' })).toBeVisible();
  await expect(page.getByRole('button', { name: '缺开场白 1' })).toHaveCount(0);
  await expect
    .poll(async () =>
      page.locator('.cm-thumb img').first().evaluate(element => {
        const rect = element.getBoundingClientRect();
        return Math.round((rect.height / rect.width) * 100);
      }),
    )
    .toBe(133);
  await expect(page.locator('.cm-card img').first()).toHaveAttribute('src', /^blob:/);
  await expect(page.evaluate(() => window.__characterImageRequests?.[0])).resolves.toContain('/characters/');
  await expect(page.locator('.cm-card').first()).not.toContainText('莉莉丝.png');
  await expect(page.locator('.cm-card-text').first()).toHaveText('莉莉丝');
  await expect(page.locator('.cm-card-text').first()).not.toContainText('待整理');
  await expect(page.locator('.cm-list-panel')).toHaveCSS('scrollbar-width', 'none');

  const bodyText = await page.locator('body').innerText();
  expect(bodyText).toContain('角色卡管理器');
  expect(bodyText).not.toContain('??');
  expect(bodyText).not.toContain('????');

  await page.getByPlaceholder('名称、作者、文件名、描述').fill('莉莉');
  await expect(page.getByRole('button', { name: '莉莉丝', exact: true })).toBeVisible();
  await expect(page.getByText('空白卡.png')).toHaveCount(0);
  await page.getByPlaceholder('名称、作者、文件名、描述').fill('待整理');
  await expect(page.getByRole('button', { name: '莉莉丝', exact: true })).toBeVisible();
  await page.getByPlaceholder('名称、作者、文件名、描述').fill('');

  await page.getByRole('button', { name: '莉莉丝', exact: true }).click();
  await expect(page.getByText('夜城里的观察者，负责验证中文 DOM。')).toBeVisible();
  await expect(page.locator('.cm-preview')).toContainText('夜城世界书');
  await expect(page.locator('.cm-preview')).toContainText('待整理');
  await expect(page.locator('.cm-preview')).toContainText('开场白');
  await expect(page.locator('.cm-greeting-tabs')).toHaveCount(0);
  await expect(page.locator('.cm-greeting-pager output')).toHaveText('1 / 4');
  await expect(page.getByLabel('上一条开场白')).toBeDisabled();
  await expect(page.getByLabel('下一条开场白')).toBeEnabled();
  await expect(page.getByLabel('跳转开场白')).toHaveCount(0);
  await expect(page.locator('.cm-greeting-body')).not.toContainText('开场白 1');
  await expect(page.locator('.cm-greeting-body')).toContainText('你好，旅行者。');
  await expect(page.locator('.cm-greeting-body')).not.toContainText('第三开场');
  await page.getByLabel('下一条开场白').click();
  await page.getByLabel('下一条开场白').click();
  await expect(page.locator('.cm-greeting-pager output')).toHaveText('3 / 4');
  await expect(page.locator('.cm-greeting-body')).toContainText('第三开场');
  await expect
    .poll(() =>
      page.locator('.cm-preview').evaluate(element => ({
        hasPanelScroll: element.scrollHeight > element.clientHeight,
        overflowY: getComputedStyle(element).overflowY,
        scrollbarWidth: getComputedStyle(element).scrollbarWidth,
      })),
    )
    .toEqual({ hasPanelScroll: true, overflowY: 'auto', scrollbarWidth: 'none' });
  await expect(page.locator('.cm-greeting-body')).toHaveCSS('overflow-y', 'visible');
  await expect(page.locator('.cm-alt-greeting-list')).toHaveCount(0);
  await page.locator('.cm-detail-tags button', { hasText: '待整理' }).click();
  await expect(page.getByText('1 个匹配项')).toBeVisible();
  await expect(page.getByRole('button', { name: '待整理 1' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.cm-detail-tags button', { hasText: '待整理' })).toHaveAttribute('aria-pressed', 'true');
  await expect
    .poll(() =>
      page.locator('.cm-preview').evaluate(element => {
        const previewHeight = Math.round(element.getBoundingClientRect().height);
        const workspaceHeight = Math.round(element.closest('.cm-workspace')?.getBoundingClientRect().height || 0);
        return {
          fitsWorkspace: previewHeight > 0 && workspaceHeight > 0 && previewHeight <= workspaceHeight,
          overflowY: getComputedStyle(element).overflowY,
          scrollbarWidth: getComputedStyle(element).scrollbarWidth,
        };
      }),
    )
    .toEqual({ fitsWorkspace: true, overflowY: 'auto', scrollbarWidth: 'none' });
  await expect(page.getByText('关联世界书：夜城世界书')).toHaveCount(0);
  await expect(page.locator('.cm-preview-head')).not.toContainText('莉莉丝.png');
});

test('批量选择会先预览再写入酒馆标签且不调用危险接口', async ({ page }) => {
  await page.goto(pageUrl);

  await page.getByRole('button', { name: '选择' }).click();
  await page.getByRole('button', { name: '全选当前' }).click();
  await expect(page.getByText('2 已选')).toBeVisible();
  await expect(page.getByRole('heading', { name: '2 个已选角色' })).toBeVisible();

  await page.getByRole('button', { name: '预览变更' }).click();
  await expect(page.getByText('变更预览')).toBeVisible();
  await expect(page.getByText(/会更新 1 个角色/)).toBeVisible();
  await expect(page.evaluate(() => window.__saveSettingsCount)).resolves.toBe(0);

  await page.getByRole('button', { name: '确认写入酒馆标签' }).click();
  await expect.poll(() => page.evaluate(() => window.__saveSettingsCount)).toBe(1);
  await expect(page.evaluate(() => window.__tavernContext.tagMap['空白卡.png'])).resolves.toEqual(['整理']);
  await expect(page.evaluate(() => window.__dangerousApiCalls)).resolves.toEqual([]);
});

test('批量删除必须先预览确认，可选删除聊天和内嵌世界书', async ({ page }) => {
  await page.goto(pageUrl);

  await page.getByRole('button', { name: '选择' }).click();
  await page.getByRole('button', { name: '全选当前' }).click();
  await expect(page.getByRole('heading', { name: '2 个已选角色' })).toBeVisible();
  await expect(page.getByLabel('批量删除')).toContainText('删除导入的内嵌世界书');

  await page.getByLabel('批量删除').getByLabel('同时删除聊天记录').check();
  await page.getByRole('button', { name: '预览删除' }).click();
  await expect(page.locator('.cm-delete-preview')).toContainText(/夜城世界书\s*，将删除/);
  await expect(page.locator('.cm-delete-preview')).toContainText('聊天：2 条，将删除');
  await expect(page.getByRole('button', { name: '确认删除 2 项' })).toBeDisabled();

  await page.getByLabel('输入 DELETE 确认批量删除').fill('DELETE');
  await page.getByRole('button', { name: '确认删除 2 项' }).click();

  await expect(page.getByText('删除完成：成功 2 项。')).toBeVisible();
  await expect(page.getByRole('button', { name: '莉莉丝', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: '空白卡', exact: true })).toHaveCount(0);
  await expect(page.evaluate(() => window.__deletedWorldBooks)).resolves.toEqual(['夜城世界书']);
  await expect(page.evaluate(() => window.__deletedChats)).resolves.toEqual([
    '莉莉丝 - 夜城后续.jsonl',
    '莉莉丝 - 初次聊天.jsonl',
    '莉莉丝 - 夜城后续.jsonl',
    '莉莉丝 - 初次聊天.jsonl',
  ]);
});

test('卡片收藏即时写入，右侧名称输入后迁移标签', async ({ page }) => {
  await page.goto(pageUrl);

  await page.getByRole('button', { name: '收藏 空白卡' }).click();
  await expect(page.getByRole('button', { name: '取消收藏 空白卡' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.evaluate(() => window.characters.find(character => character.avatar === '空白卡.png')?.fav)).resolves.toBe(true);

  await page.locator('.cm-card', { hasText: '莉莉丝' }).click();
  await expect(page.locator('.cm-preview')).toContainText('夜城里的观察者');
  await page.getByLabel('角色名称').fill('新莉莉丝');
  await page.getByLabel('角色名称').press('Enter');

  await expect(page.getByRole('button', { name: '新莉莉丝', exact: true })).toBeVisible();
  await expect(page.evaluate(() => window.__tavernContext.tagMap['新莉莉丝.png'])).resolves.toEqual(['整理']);
  await expect(page.evaluate(() => window.__tavernContext.tagMap['莉莉丝.png'])).resolves.toBeUndefined();
  await expect.poll(() => page.evaluate(() => window.__saveSettingsCount)).toBe(1);
});

test('聊天记录行支持查看、改名、单条下载、打开和删除', async ({ page }) => {
  await page.goto(pageUrl);

  await page.locator('.cm-card', { hasText: '莉莉丝' }).click();
  await page.getByLabel('聊天记录').getByRole('button', { name: '查看' }).click();
  await expect(page.getByLabel(/聊天名称 夜城后续/)).toBeVisible();

  await page.getByLabel(/聊天名称 夜城后续/).fill('重命名聊天');
  await page.getByLabel(/聊天名称 夜城后续/).press('Enter');
  await expect(page.getByLabel('聊天名称 重命名聊天')).toBeVisible();

  await page.getByLabel('查看正文 重命名聊天').click();
  await expect(page.locator('.cm-chat-content')).toContainText('聊天内容：莉莉丝 - 夜城后续.jsonl');
  await expect(page.locator('.cm-chat-content')).not.toContainText('chat_metadata');
  await page.getByLabel('下载聊天 重命名聊天').click();
  await expect(page.locator('.cm-preview')).not.toContainText('已准备下载');
  await page.getByLabel('启动聊天 重命名聊天').click();
  await expect.poll(() => page.evaluate(() => window.__openedChat)).toBe('莉莉丝 - 夜城后续.jsonl');

  page.once('dialog', dialog => dialog.accept());
  await page.getByLabel('删除聊天 重命名聊天').click();
  await expect(page.getByLabel('聊天名称 重命名聊天')).toHaveCount(0);
  await expect(page.evaluate(() => window.__deletedChats)).resolves.toEqual(['莉莉丝 - 夜城后续.jsonl']);
});

test('右侧详情提供删除入口并进入删除预览', async ({ page }) => {
  await page.goto(pageUrl);

  await page.locator('.cm-card', { hasText: '莉莉丝' }).click();
  await page.locator('.cm-preview-head').getByRole('button', { name: '删除' }).click();

  await expect(page.getByRole('heading', { name: '1 个已选角色' })).toBeVisible();
  await expect(page.locator('.cm-delete-preview')).toContainText('莉莉丝');
  await expect(page.getByRole('button', { name: '确认删除 1 项' })).toBeEnabled();
});

test('标签筛选支持多选切换，并可在设置里切换或且逻辑', async ({ page }) => {
  await page.goto(pageUrl);

  await expect(page.locator('.cm-controls')).not.toContainText('排序');
  await expect(page.locator('.cm-list-panel')).toContainText('排序');
  await expect(page.locator('.cm-list-panel .cm-filter-list')).toHaveCount(0);
  await expect(page.locator('.cm-tag-filter i')).toHaveCount(0);
  await expect(page.getByTitle('清空已选标签')).toBeDisabled();

  await page.getByRole('button', { name: '待整理 1' }).click();
  await expect(page.getByText('1 个匹配项')).toBeVisible();
  await expect(page.getByTitle('清空已选标签')).toBeEnabled();
  await page.getByTitle('清空已选标签').click();
  await expect(page.getByText('2 个匹配项')).toBeVisible();
  await expect(page.getByTitle('清空已选标签')).toBeDisabled();

  await page.getByRole('button', { name: '待整理 1' }).click();
  await expect(page.getByText('1 个匹配项')).toBeVisible();

  await page.getByRole('button', { name: '日本語 0' }).click();
  await expect(page.getByText('0 个匹配项')).toBeVisible();

  await page.getByTitle('设置').click();
  await expect(page.getByRole('dialog', { name: '设置' })).toBeVisible();
  await expect(page.getByRole('radio', { name: '单选' })).toBeChecked();
  await page.getByRole('radio', { name: '或' }).click();
  await page.getByTitle('关闭设置').click();
  await page.getByRole('button', { name: '待整理 1' }).click();
  await expect(page.getByText('1 个匹配项')).toBeVisible();

  await page.getByTitle('设置').click();
  await page.getByRole('radio', { name: '且' }).click();
  await page.getByTitle('关闭设置').click();
  await expect(page.getByText('0 个匹配项')).toBeVisible();

  await page.getByRole('button', { name: '日本語 0' }).click();
  await expect(page.getByText('1 个匹配项')).toBeVisible();
});

test('移动端宽度下保持单列可读', async ({ page }) => {
  test.skip(test.info().project.name !== 'mobile', '单列布局只在移动端项目验证');
  await page.goto(pageUrl);

  const workspaceColumns = await page.locator('.cm-workspace').evaluate(element => getComputedStyle(element).gridTemplateColumns);
  expect(workspaceColumns.split(' ').length).toBe(1);
  await expect(page.getByText('角色卡管理器')).toBeVisible();
  await expect(page.getByRole('button', { name: '莉莉丝', exact: true })).toBeVisible();
});

test('左右栏可以收起展开，中间缩略图区域随之扩大', async ({ page }) => {
  test.skip(test.info().project.name !== 'desktop', '中栏宽度扩展只在桌面三栏布局验证');
  await page.goto(pageUrl);

  const firstWidth = await page.locator('.cm-list-panel').evaluate(element => Math.round(element.getBoundingClientRect().width));
  const firstCardWidth = await page.locator('.cm-card').first().evaluate(element => Math.round(element.getBoundingClientRect().width));
  await page.locator('.cm-card-grid').dispatchEvent('wheel', { deltaY: -100, ctrlKey: true, bubbles: true, cancelable: true });
  await expect
    .poll(() => page.locator('.cm-card').first().evaluate(element => Math.round(element.getBoundingClientRect().width)))
    .toBeGreaterThan(firstCardWidth);
  await page.locator('.cm-card-grid').dispatchEvent('wheel', { deltaY: 100, ctrlKey: true, bubbles: true, cancelable: true });
  await expect
    .poll(() => page.locator('.cm-card').first().evaluate(element => Math.round(element.getBoundingClientRect().width)))
    .toBe(firstCardWidth);

  await page.getByTitle('放大卡片').click();
  await expect
    .poll(() => page.locator('.cm-card').first().evaluate(element => Math.round(element.getBoundingClientRect().width)))
    .toBeGreaterThan(firstCardWidth);
  const largeCardWidth = await page.locator('.cm-card').first().evaluate(element => Math.round(element.getBoundingClientRect().width));
  await page.getByTitle('缩小卡片').click();
  await page.getByTitle('缩小卡片').click();
  await expect
    .poll(() => page.locator('.cm-card').first().evaluate(element => Math.round(element.getBoundingClientRect().width)))
    .toBeLessThan(largeCardWidth);

  await page.getByTitle('收起左栏').click();
  await page.getByTitle('收起右栏').click();
  await expect(page.locator('.cm-workspace')).toHaveClass(/left-collapsed/);
  await expect(page.locator('.cm-workspace')).toHaveClass(/right-collapsed/);
  await expect
    .poll(() => page.locator('.cm-list-panel').evaluate(element => Math.round(element.getBoundingClientRect().width)))
    .toBeGreaterThan(firstWidth);
  await page.getByTitle('展开左栏').click();
  await page.getByTitle('展开右栏').click();
  await expect(page.locator('.cm-workspace')).not.toHaveClass(/left-collapsed/);
  await expect(page.locator('.cm-workspace')).not.toHaveClass(/right-collapsed/);
});

test('只注册酒馆助手脚本按钮入口，并通过按钮打开隔离面板', async ({ page }) => {
  await page.goto('about:blank');
  await page.goto(pageUrl);
  await page.setContent(`
    <!doctype html>
    <html lang="zh-CN">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>角色卡管理器测试宿主</title>
      </head>
      <body>
        <div id="extensionsMenu"></div>
      </body>
    </html>
  `);
  await page.evaluate(() => {
    window.replaceScriptButtons = buttons => {
      window.__scriptButtons = buttons;
    };
    window.getButtonEvent = name => `button:${name}`;
    window.eventOn = (event, handler) => {
      window.__buttonHandlers = { ...(window.__buttonHandlers || {}), [event]: handler };
    };
  });
  await page.addScriptTag({ type: 'module', url: scriptUrl });

  await expect(page.locator('#character-card-manager-entry')).toHaveCount(0);
  await expect(page.locator('#character-card-manager-floating-entry')).toHaveCount(0);
  await expect(page.evaluate(() => typeof window.openCharacterCardManager)).resolves.toBe('function');
  await expect(page.evaluate(() => window.__scriptButtons?.some(button => button.name === '角色卡管理器'))).resolves.toBe(true);
  await expect(page.evaluate(() => typeof window.__buttonHandlers?.['button:角色卡管理器'])).resolves.toBe('function');

  await page.evaluate(() => window.__buttonHandlers?.['button:角色卡管理器']?.());
  await expect(page.locator('#character-card-manager-host-root')).toBeVisible();
  const managerFrame = page.frameLocator('iframe[title="角色卡管理器面板"]');
  await expect
    .poll(() =>
      page.locator('iframe[title="角色卡管理器面板"]').evaluate(element => {
        const url = new URL((element as HTMLIFrameElement).src);
        return {
          path: decodeURIComponent(url.pathname),
          hasCacheBust: /^\d+-\d+$/.test(url.searchParams.get('t') || ''),
        };
      }),
    )
    .toEqual({ path: '/dist/角色卡管理器预览/index.html', hasCacheBust: true });
  await expect(page.getByTitle('关闭角色卡管理器')).toHaveCount(0);
  const viewportSize = await page.evaluate(() => ({
    height: window.innerHeight,
    width: window.innerWidth,
  }));
  await expect
    .poll(() =>
      page.locator('#character-card-manager-host-root').evaluate(element => {
        const rect = element.getBoundingClientRect();
        return {
          height: Math.round(rect.height),
          width: Math.round(rect.width),
          x: Math.round(rect.x),
          y: Math.round(rect.y),
        };
      }),
    )
    .toEqual({ ...viewportSize, x: 0, y: 0 });
  await expect
    .poll(() =>
      page.locator('iframe[title="角色卡管理器面板"]').evaluate(element => {
        const rect = element.getBoundingClientRect();
        return {
          height: Math.round(rect.height),
          width: Math.round(rect.width),
        };
      }),
    )
    .toEqual(viewportSize);
  await expect(managerFrame.getByRole('heading', { name: '角色卡管理器' })).toBeVisible();
  await expect
    .poll(async () =>
      managerFrame.locator('.cm-thumb img').first().evaluate(element => {
        const rect = element.getBoundingClientRect();
        return Math.round((rect.height / rect.width) * 100);
      }),
    )
    .toBe(133);

  await managerFrame.getByTitle('关闭面板').click();
  await expect(page.locator('#character-card-manager-host-root')).toHaveCount(0);

  await page.evaluate(() => window.__buttonHandlers?.['button:角色卡管理器']?.());
  const firstSrc = await page.locator('iframe[title="角色卡管理器面板"]').getAttribute('src');
  await page.evaluate(() =>
    window.dispatchEvent(new MessageEvent('message', { data: { source: 'character-card-manager', type: 'close' } })),
  );
  await expect(page.locator('#character-card-manager-host-root')).toHaveCount(0);
  await page.evaluate(() => window.__buttonHandlers?.['button:角色卡管理器']?.());
  await expect
    .poll(async () => page.locator('iframe[title="角色卡管理器面板"]').getAttribute('src'))
    .not.toBe(firstSrc);
});

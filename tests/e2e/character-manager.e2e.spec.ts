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
          description: '夜城里的观察者，负责验证中文 DOM。',
          first_mes: '你好，旅行者。',
          character_book: '夜城世界书',
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
    window.getCharacters = async () => window.characters;
    window.getThumbnailUrl = (type, file) => `/thumbnail?type=${type}&file=${encodeURIComponent(file)}`;
    const nativeFetch = window.fetch.bind(window);
    window.__characterImageRequests = [];
    window.fetch = async (_url, options) => {
      if (String(_url).startsWith('/characters/')) {
        window.__characterImageRequests.push(String(_url));
        return nativeFetch(_url, options);
      }
      const body = JSON.parse(String(options?.body || '{}'));
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
            alternate_greetings: selected.name === '莉莉丝' ? ['第二开场'] : [],
            character_book: selected.data.character_book || '',
            character_version: selected.data.character_version || '',
          },
        }),
      };
    };
  });
});

test('打开后显示角色列表、搜索和详情预览，中文 DOM 正常', async ({ page }) => {
  await page.goto(pageUrl);

  await expect(page.getByRole('heading', { name: '角色卡管理器' })).toBeVisible();
  await expect(page.getByRole('button', { name: '莉莉丝' })).toBeVisible();
  await expect(page.getByRole('button', { name: '空白卡' })).toBeVisible();
  await expect(page.getByRole('button', { name: '缺开场白 1' })).toBeVisible();
  await expect
    .poll(async () =>
      page.locator('.cm-thumb').first().evaluate(element => {
        const rect = element.getBoundingClientRect();
        return Math.round((rect.height / rect.width) * 100);
      }),
    )
    .toBe(133);
  await expect(page.locator('.cm-card img').first()).toHaveAttribute('src', /^blob:/);
  await expect(page.evaluate(() => window.__characterImageRequests?.[0])).resolves.toContain('/characters/');
  await expect(page.locator('.cm-card').first()).not.toContainText('莉莉丝.png');
  await expect(page.locator('.cm-list-panel')).toHaveCSS('scrollbar-width', 'none');

  const bodyText = await page.locator('body').innerText();
  expect(bodyText).toContain('角色卡管理器');
  expect(bodyText).not.toContain('??');
  expect(bodyText).not.toContain('????');

  await page.getByPlaceholder('名称、作者、文件名、描述').fill('莉莉');
  await expect(page.getByRole('button', { name: '莉莉丝' })).toBeVisible();
  await expect(page.getByText('空白卡.png')).toHaveCount(0);

  await page.getByRole('button', { name: '莉莉丝' }).click();
  await expect(page.getByText('夜城里的观察者，负责验证中文 DOM。')).toBeVisible();
  await expect(page.getByText('关联世界书：夜城世界书')).toBeVisible();
});

test('移动端宽度下保持单列可读', async ({ page }) => {
  test.skip(test.info().project.name !== 'mobile', '单列布局只在移动端项目验证');
  await page.goto(pageUrl);

  const workspaceColumns = await page.locator('.cm-workspace').evaluate(element => getComputedStyle(element).gridTemplateColumns);
  expect(workspaceColumns.split(' ').length).toBe(1);
  await expect(page.getByText('角色卡管理器')).toBeVisible();
  await expect(page.getByRole('button', { name: '莉莉丝' })).toBeVisible();
});

test('左右栏可以收起展开，中间缩略图区域随之扩大', async ({ page }) => {
  test.skip(test.info().project.name !== 'desktop', '中栏宽度扩展只在桌面三栏布局验证');
  await page.goto(pageUrl);

  const firstWidth = await page.locator('.cm-list-panel').evaluate(element => Math.round(element.getBoundingClientRect().width));
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
  await expect(page.locator('iframe[title="角色卡管理器面板"]')).toHaveAttribute('src', pageUrl);
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
      managerFrame.locator('.cm-thumb').first().evaluate(element => {
        const rect = element.getBoundingClientRect();
        return Math.round((rect.height / rect.width) * 100);
      }),
    )
    .toBe(133);

  await managerFrame.getByTitle('关闭面板').click();
  await expect(page.locator('#character-card-manager-host-root')).toBeHidden();
});

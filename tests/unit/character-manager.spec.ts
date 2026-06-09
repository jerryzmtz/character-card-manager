import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import App from '../../src/角色卡管理器/App.vue';
import { filterCharacters, getFilterCounts, sortCharacters } from '../../src/角色卡管理器/filters';
import {
  applyTagMutation,
  loadCharacterOriginalImage,
  normalizeSummary,
  readCharacterDetail,
  readCharacterList,
  readTavernTags,
} from '../../src/角色卡管理器/host';
import { previewTagMutation } from '../../src/角色卡管理器/tags';
import type { CharacterSummary, CharacterTag } from '../../src/角色卡管理器/types';

function makeCharacter(patch: Partial<CharacterSummary> = {}): CharacterSummary {
  return {
    fileName: '莉莉丝.png',
    name: '莉莉丝',
    avatarUrl: '/characters/%E8%8E%89%E8%8E%89%E4%B8%9D.png',
    avatarFallbackUrls: ['/characters/%E8%8E%89%E8%8E%89%E4%B8%9D.png'],
    fav: false,
    tagIds: [],
    tags: [],
    date_added: 100,
    date_last_chat: 20,
    creator: '测试作者',
    character_version: '1.0',
    character_book: '',
    firstMes: '你好，旅行者。',
    altGreetingCount: 0,
    tokens: 1200,
    desc: '一张用于测试的中文角色卡。',
    issues: [],
    detailLoaded: false,
    ...patch,
  };
}

describe('角色卡数据读取与归一化', () => {
  it('归一化中文、日文名称和世界书信息', () => {
    const summary = normalizeSummary({
      avatar: '雪乃.webp',
      name: '雪乃',
      fav: true,
      date_added: '1700000000000',
      data: {
        creator: '作者A',
        first_mes: 'こんにちは',
        alternate_greetings: ['早安', 'こんばんは'],
        character_book: { name: '雪国世界书' },
        character_version: '2.1',
      },
    });

    expect(summary.name).toBe('雪乃');
    expect(summary.fav).toBe(true);
    expect(summary.character_book).toBe('雪国世界书');
    expect(summary.altGreetingCount).toBe(2);
    expect(summary.issues.map(issue => issue.message).join('\n')).toContain('关联世界书');
  });

  it('优先使用角色原图并保留酒馆缩略图兜底', () => {
    const host = {
      getThumbnailUrl: vi.fn((type: string, file: string) => `/thumbnail/${type}/${encodeURIComponent(file)}`),
    } as unknown as Window & typeof globalThis;
    const summary = normalizeSummary({ avatar: '雪乃.webp', name: '雪乃' }, host);

    expect(summary.avatarUrl).toBe('/characters/%E9%9B%AA%E4%B9%83.webp');
    expect(summary.avatarFallbackUrls).toContain('/thumbnail/avatar/%E9%9B%AA%E4%B9%83.webp');
  });

  it('通过宿主 fetch 读取角色原图为 blob URL', async () => {
    const createObjectUrl = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:角色原图');
    const host = {
      fetch: vi.fn().mockResolvedValue({
        ok: true,
        blob: async () => new Blob(['image-bytes'], { type: 'image/png' }),
      }),
    } as unknown as Window & typeof globalThis;

    const url = await loadCharacterOriginalImage('雪乃.webp', host);

    expect(host.fetch).toHaveBeenCalledWith('/characters/%E9%9B%AA%E4%B9%83.webp');
    expect(url).toBe('blob:角色原图');
    createObjectUrl.mockRestore();
  });

  it('宿主 API 缺失时返回可见错误', async () => {
    const result = await readCharacterList({} as Window & typeof globalThis);

    expect(result.characters).toHaveLength(0);
    expect(result.issues[0].message).toContain('无法读取 SillyTavern 角色列表');
  });

  it('详情读取失败时保留基础信息并给出错误提示', async () => {
    const host = {
      fetch: vi.fn().mockRejectedValue(new Error('网络不可用')),
    } as unknown as Window & typeof globalThis;

    const detail = await readCharacterDetail('莉莉丝.png', makeCharacter(), host);

    expect(detail.name).toBe('莉莉丝');
    expect(detail.detailLoaded).toBe(false);
    expect(detail.issues.some(issue => issue.message.includes('详情读取失败'))).toBe(true);
  });

  it('读取酒馆标签并按角色文件名绑定，兼容中文和日文标签', async () => {
    const host = {
      SillyTavern: {
        getContext: () => ({
          characters: [{ avatar: '雪乃.webp', name: '雪乃', data: { first_mes: 'こんにちは' } }],
          tags: [
            { id: '整理', name: '待整理', color: '#5599ff' },
            { id: 'jp', name: '日本語' },
          ],
          tagMap: { '雪乃.webp': ['整理', 'jp'] },
        }),
      },
    } as unknown as Window & typeof globalThis;

    const tags = readTavernTags(host);
    const result = await readCharacterList(host);

    expect(tags.tags.map(tag => tag.name)).toEqual(['待整理', '日本語']);
    expect(result.characters[0].tags.map(tag => tag.name)).toEqual(['待整理', '日本語']);
  });

  it('标签上下文缺失和未知标签 id 会给出可见提示', () => {
    const missing = readTavernTags({} as Window & typeof globalThis);
    const unknown = readTavernTags({
      SillyTavern: {
        getContext: () => ({ tags: [{ id: 'known', name: '已知' }], tagMap: { '空白卡.png': ['ghost'] } }),
      },
    } as unknown as Window & typeof globalThis);

    expect(missing.issues[0].message).toContain('标签上下文');
    expect(unknown.issues[0].message).toContain('未知标签绑定');
  });
});

describe('搜索、排序和筛选', () => {
  const tag: CharacterTag = { id: '整理', name: '待整理' };
  const jpTag: CharacterTag = { id: '日文', name: '日本語' };
  const characters = [
    makeCharacter({ name: '莉莉丝', fav: true, date_added: 300, character_book: '夜城世界书', tagIds: ['整理', '日文'], tags: [tag, jpTag] }),
    makeCharacter({ fileName: '明日香.png', name: '明日香', date_added: 200, tagIds: ['日文'], tags: [jpTag], firstMes: '', issues: [{ level: 'warning', message: '缺少主开场白，导入或游玩前建议检查。' }] }),
    makeCharacter({ fileName: 'NoName.png', name: 'NoName', date_added: 100, readError: '失败', issues: [{ level: 'error', message: '详情读取失败：HTTP 500' }] }),
  ];

  it('支持中文关键词搜索', () => {
    expect(filterCharacters(characters, '明日', 'all').map(character => character.name)).toEqual(['明日香']);
    expect(filterCharacters(characters, '待整理', 'all').map(character => character.name)).toEqual(['莉莉丝']);
  });

  it('支持收藏、世界书、缺开场白、未打标签和异常筛选', () => {
    expect(filterCharacters(characters, '', 'favorite')).toHaveLength(1);
    expect(filterCharacters(characters, '', 'worldBook')).toHaveLength(1);
    expect(filterCharacters(characters, '', 'missingGreeting')).toHaveLength(1);
    expect(filterCharacters(characters, '', 'untagged')).toHaveLength(1);
    expect(filterCharacters(characters, '', 'error')).toHaveLength(1);
    expect(filterCharacters(characters, '', 'all', ['整理'])).toHaveLength(1);
    expect(filterCharacters(characters, '', 'all', ['整理', '日文'])).toHaveLength(1);
    expect(filterCharacters(characters, '', 'all', ['整理', '日文'], 'or')).toHaveLength(2);
    expect(filterCharacters(characters, '', 'all', ['整理', '日文'], 'and')).toHaveLength(1);
  });

  it('一次性统计各筛选项数量', () => {
    expect(getFilterCounts(characters)).toEqual({
      all: 3,
      favorite: 1,
      worldBook: 1,
      missingGreeting: 1,
      untagged: 1,
      error: 1,
    });
  });

  it('按导入时间倒序，按名称正序', () => {
    expect(sortCharacters(characters, 'date_added')[0].name).toBe('莉莉丝');
    expect(sortCharacters(characters, 'name').map(character => character.name)).toEqual(['莉莉丝', '明日香', 'NoName']);
  });
});

describe('标签批量预览与写入', () => {
  const tags: CharacterTag[] = [{ id: '整理', name: '待整理' }];
  const tagMap = { '莉莉丝.png': ['整理'], '空白卡.png': [] };

  it('预览添加、移除、新建标签和空选择错误', () => {
    const addPreview = previewTagMutation(tags, tagMap, {
      action: 'add',
      tagId: '整理',
      fileNames: ['莉莉丝.png', '空白卡.png'],
    });
    const removePreview = previewTagMutation(tags, tagMap, {
      action: 'remove',
      tagId: '整理',
      fileNames: ['莉莉丝.png', '空白卡.png'],
    });
    const createPreview = previewTagMutation(tags, tagMap, {
      action: 'create',
      tagName: '中文新标签',
      fileNames: ['空白卡.png'],
    });
    const emptyPreview = previewTagMutation(tags, tagMap, { action: 'add', tagId: '整理', fileNames: [] });

    expect(addPreview.changedFileNames).toEqual(['空白卡.png']);
    expect(addPreview.unchangedFileNames).toEqual(['莉莉丝.png']);
    expect(removePreview.changedFileNames).toEqual(['莉莉丝.png']);
    expect(createPreview.createsTag).toBe(true);
    expect(emptyPreview.errors.join(' ')).toContain('没有选择角色');
  });

  it('确认写入时只修改 tags/tagMap 并调用酒馆保存函数', async () => {
    const context = {
      tags: [{ id: '整理', name: '待整理' }],
      tagMap: { '莉莉丝.png': ['整理'], '空白卡.png': [] },
      saveSettingsDebounced: vi.fn(),
    };
    const host = {
      SillyTavern: {
        getContext: () => context,
      },
    } as unknown as Window & typeof globalThis;

    const result = await applyTagMutation({ action: 'add', tagId: '整理', fileNames: ['空白卡.png'] }, host);

    expect(result.success).toBe(true);
    expect(context.tagMap['空白卡.png']).toEqual(['整理']);
    expect(context.saveSettingsDebounced).toHaveBeenCalledTimes(1);
  });

  it('保存失败时返回错误且不静默吞掉', async () => {
    const context = {
      tags: [{ id: '整理', name: '待整理' }],
      tagMap: { '空白卡.png': [] },
      saveSettingsDebounced: vi.fn().mockRejectedValue(new Error('磁盘不可写')),
    };
    const host = {
      SillyTavern: {
        getContext: () => context,
      },
    } as unknown as Window & typeof globalThis;

    const result = await applyTagMutation({ action: 'add', tagId: '整理', fileNames: ['空白卡.png'] }, host);

    expect(result.success).toBe(false);
    expect(result.message).toContain('磁盘不可写');
  });
});

describe('角色卡管理器组件', () => {
  it('渲染列表、中文详情和缺字段提示', async () => {
    const host = window as Window &
      typeof globalThis & {
        characters?: unknown[];
        getCharacters?: () => void;
        SillyTavern?: unknown;
      };
    host.characters = [
      {
        avatar: '莉莉丝.png',
        name: '莉莉丝',
        fav: true,
        date_added: 1700000000000,
        data: {
          creator: '测试作者',
          first_mes: '你好，旅行者。',
          character_book: '夜城世界书',
        },
      },
      {
        avatar: '空白卡.png',
        name: '空白卡',
        data: {},
      },
    ];
    host.SillyTavern = {
      getContext: () => ({
        characters: host.characters,
        getCharacters: host.getCharacters,
        tags: [{ id: '整理', name: '待整理' }],
        tagMap: { '莉莉丝.png': ['整理'] },
      }),
    };
    host.getCharacters = vi.fn();
    host.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        tokens: 2048,
        data: {
          name: '莉莉丝',
          creator: '测试作者',
          description: '她负责验证详情预览。',
          first_mes: '你好，旅行者。',
          alternate_greetings: ['第二开场', '第三开场', '第四开场', '第五开场', '第六开场'],
          character_book: '夜城世界书',
          character_version: '1.2',
        },
      }),
    } as Response);

    const wrapper = mount(App);
    await vi.waitFor(() => expect(wrapper.text()).toContain('莉莉丝'));

    expect(wrapper.text()).toContain('空白卡');
    expect(wrapper.text()).toContain('无标签');
    expect(wrapper.findAll('.cm-card-text')[0].text()).toBe('莉莉丝');
    expect(wrapper.findAll('.cm-card-text')[0].text()).not.toContain('待整理');

    await wrapper.get('.cm-card').trigger('click');
    await vi.waitFor(() => expect(wrapper.text()).toContain('她负责验证详情预览。'));

    expect(wrapper.text()).toContain('夜城世界书');
    expect(wrapper.text()).toContain('待整理');
    expect(wrapper.text()).toContain('开场白');
    expect(wrapper.find('.cm-greeting-tabs').exists()).toBe(false);
    expect(wrapper.find('.cm-greeting-pager output').text()).toBe('1 / 6');
    expect(wrapper.find('.cm-greeting-pager select').exists()).toBe(true);
    expect(wrapper.get('.cm-greeting-body').text()).not.toContain('开场白 1');
    expect(wrapper.get('.cm-greeting-body').text()).toContain('你好，旅行者。');
    expect(wrapper.text()).not.toContain('第三开场');
    await wrapper.findAll('.cm-greeting-pager button')[1].trigger('click');
    await wrapper.findAll('.cm-greeting-pager button')[1].trigger('click');
    expect(wrapper.find('.cm-greeting-pager output').text()).toBe('3 / 6');
    expect(wrapper.get('.cm-greeting-body').text()).toContain('第三开场');
    await wrapper.find('.cm-greeting-pager select').setValue('5');
    expect(wrapper.find('.cm-greeting-pager output').text()).toBe('6 / 6');
    expect(wrapper.get('.cm-greeting-body').text()).toContain('第六开场');
    expect(wrapper.text()).not.toContain('??');

    await wrapper.get('.cm-detail-tags button').trigger('click');
    expect(wrapper.text()).toContain('1 个匹配项');
    expect(wrapper.findAll('.cm-tag-filter > button')[2].attributes('aria-pressed')).toBe('true');
    expect(wrapper.get('.cm-detail-tags button').classes()).toContain('active');
  });

  it('支持选择模式、全选当前结果、清空和标签写入预览', async () => {
    const context = {
      characters: [
        { avatar: '莉莉丝.png', name: '莉莉丝', data: { first_mes: '你好。' } },
        { avatar: '空白卡.png', name: '空白卡', data: { first_mes: '你好。' } },
      ],
      tags: [{ id: '整理', name: '待整理' }],
      tagMap: { '莉莉丝.png': ['整理'], '空白卡.png': [] },
      saveSettingsDebounced: vi.fn(),
    };
    const host = window as Window &
      typeof globalThis & {
        SillyTavern?: unknown;
        characters?: unknown[];
      };
    host.SillyTavern = { getContext: () => context };
    host.characters = context.characters;

    const wrapper = mount(App);
    await vi.waitFor(() => expect(wrapper.text()).toContain('莉莉丝'));

    await wrapper.get('button[aria-pressed="false"].cm-selection-toggle').trigger('click');
    await wrapper.findAll('.cm-list-tools button')[1].trigger('click');
    expect(wrapper.text()).toContain('2 已选');
    expect(wrapper.text()).toContain('2 个已选角色');

    await wrapper.find('.cm-tag-editor .cm-primary-action').trigger('click');
    expect(wrapper.text()).toContain('变更预览');
    expect(wrapper.text()).toContain('会更新 1 个角色');

    await wrapper.findAll('.cm-tag-editor .cm-primary-action')[1].trigger('click');
    await vi.waitFor(() => expect(context.saveSettingsDebounced).toHaveBeenCalledTimes(1));
    expect(context.tagMap['空白卡.png']).toEqual(['整理']);

    await wrapper.findAll('.cm-list-tools button')[2].trigger('click');
    expect(wrapper.text()).toContain('0 已选');
  });

  it('默认单选标签，并支持在设置中切换或/且逻辑', async () => {
    const context = {
      characters: [
        { avatar: '开放.png', name: '开放角色', data: { first_mes: '你好。' } },
        { avatar: '日本.png', name: '日本角色', data: { first_mes: '你好。' } },
        { avatar: '重叠.png', name: '重叠角色', data: { first_mes: '你好。' } },
      ],
      tags: [
        { id: '开放', name: '开放世界' },
        { id: '日本', name: '日本' },
      ],
      tagMap: { '开放.png': ['开放'], '日本.png': ['日本'], '重叠.png': ['开放', '日本'] },
    };
    const host = window as Window &
      typeof globalThis & {
        SillyTavern?: unknown;
        characters?: unknown[];
      };
    localStorage.clear();
    host.SillyTavern = { getContext: () => context };
    host.characters = context.characters;

    const wrapper = mount(App);
    await vi.waitFor(() => expect(wrapper.text()).toContain('开放角色'));

    expect(wrapper.get('button[title="清空已选标签"]').attributes('disabled')).toBeDefined();
    const tagButtons = () => wrapper.findAll('.cm-tag-filter > button');
    await tagButtons()[2].trigger('click');
    expect(wrapper.text()).toContain('2 个匹配项');
    expect(wrapper.get('button[title="清空已选标签"]').attributes('disabled')).toBeUndefined();
    await tagButtons()[3].trigger('click');
    expect(wrapper.text()).toContain('2 个匹配项');
    await wrapper.get('button[title="清空已选标签"]').trigger('click');
    expect(wrapper.text()).toContain('3 个匹配项');
    expect(wrapper.get('button[title="清空已选标签"]').attributes('disabled')).toBeDefined();

    await tagButtons()[3].trigger('click');

    await wrapper.get('button[title="设置"]').trigger('click');
    expect(wrapper.text()).toContain('标签过滤逻辑');
    await wrapper.findAll('.cm-segmented button')[1].trigger('click');
    await tagButtons()[2].trigger('click');
    expect(wrapper.text()).toContain('3 个匹配项');
    await wrapper.findAll('.cm-segmented button')[2].trigger('click');
    expect(wrapper.text()).toContain('1 个匹配项');

    await tagButtons()[3].trigger('click');
    expect(wrapper.text()).toContain('2 个匹配项');
  });

  it('把全部和无标签并入左侧标签栏，中栏只保留一行工具', async () => {
    const context = {
      characters: [
        { avatar: '莉莉丝.png', name: '莉莉丝', date_added: 100, data: { first_mes: '你好。' } },
        { avatar: '空白卡.png', name: '空白卡', date_added: 200, data: { first_mes: '你好。' } },
      ],
      tags: [{ id: '整理', name: '待整理', color: '#5599ff' }],
      tagMap: { '莉莉丝.png': ['整理'], '空白卡.png': [] },
    };
    const host = window as Window &
      typeof globalThis & {
        SillyTavern?: unknown;
        characters?: unknown[];
      };
    host.SillyTavern = { getContext: () => context };
    host.characters = context.characters;

    const wrapper = mount(App);
    await vi.waitFor(() => expect(wrapper.text()).toContain('莉莉丝'));

    expect(wrapper.find('.cm-controls select').exists()).toBe(false);
    expect(wrapper.find('.cm-list-panel select').exists()).toBe(true);
    expect(wrapper.find('.cm-list-panel .cm-filter-list').exists()).toBe(false);
    expect(wrapper.find('.cm-tag-filter').text()).toContain('全部');
    expect(wrapper.find('.cm-tag-filter').text()).toContain('无标签');
    expect(wrapper.find('.cm-tag-filter').text()).toContain('待整理');
    expect(wrapper.find('.cm-tag-filter i').exists()).toBe(false);

    const tagButtons = () => wrapper.findAll('.cm-tag-filter > button');
    await tagButtons()[1].trigger('click');
    expect(wrapper.text()).toContain('1 个匹配项');
    await tagButtons()[2].trigger('click');
    expect(wrapper.text()).toContain('1 个匹配项');
  });

  it('切换角色时保留旧详情直到新详情返回，并忽略过期响应', async () => {
    const resolvers: Record<string, (value: Response) => void> = {};
    const host = window as Window &
      typeof globalThis & {
        SillyTavern?: unknown;
        fetch?: typeof fetch;
      };
    host.SillyTavern = {
      getContext: () => ({
        characters: [
          { avatar: '慢卡.png', name: '慢卡', data: { first_mes: '你好。' } },
          { avatar: '快卡.png', name: '快卡', data: { first_mes: '你好。' } },
        ],
        tags: [],
        tagMap: {},
      }),
    };
    host.fetch = vi.fn((_url, options) => {
      const body = JSON.parse(String((options as RequestInit)?.body || '{}'));
      return new Promise<Response>(resolve => {
        resolvers[body.avatar_url] = resolve;
      });
    }) as typeof fetch;

    const wrapper = mount(App);
    await vi.waitFor(() => expect(wrapper.text()).toContain('慢卡'));

    await wrapper.findAll('.cm-card')[0].trigger('click');
    expect(wrapper.text()).not.toContain('正在读取详情');
    resolvers['慢卡.png']({
      ok: true,
      json: async () => ({ data: { name: '慢卡', description: '旧的详情', first_mes: '你好。' } }),
    } as Response);
    await vi.waitFor(() => expect(wrapper.text()).toContain('旧的详情'));

    await wrapper.findAll('.cm-card')[1].trigger('click');
    expect(wrapper.text()).toContain('快卡');
    expect(wrapper.text()).toContain('旧的详情');
    expect(wrapper.text()).not.toContain('无内容');

    resolvers['快卡.png']({
      ok: true,
      json: async () => ({ data: { name: '快卡', description: '新的详情', first_mes: '你好。' } }),
    } as Response);
    await vi.waitFor(() => expect(wrapper.text()).toContain('新的详情'));

    expect(wrapper.text()).toContain('新的详情');
    expect(wrapper.text()).not.toContain('旧的详情');
  });

  it('支持左右栏折叠和面板内关闭消息', async () => {
    const host = window as Window &
      typeof globalThis & {
        characters?: unknown[];
        getCharacters?: () => void;
        SillyTavern?: unknown;
      };
    delete host.SillyTavern;
    host.characters = [{ avatar: '莉莉丝.png', name: '莉莉丝', data: { first_mes: '你好。' } }];
    host.getCharacters = vi.fn();
    const postMessage = vi.spyOn(window.parent, 'postMessage').mockImplementation(() => undefined);

    const wrapper = mount(App);
    await vi.waitFor(() => expect(wrapper.text()).toContain('莉莉丝'));

    await wrapper.get('button[title="收起左栏"]').trigger('click');
    expect(wrapper.find('.cm-workspace').classes()).toContain('left-collapsed');
    await wrapper.get('button[title="收起右栏"]').trigger('click');
    expect(wrapper.find('.cm-workspace').classes()).toContain('right-collapsed');
    await wrapper.get('button[title="关闭面板"]').trigger('click');

    expect(postMessage).toHaveBeenCalledWith({ source: 'character-card-manager', type: 'close' }, '*');
    postMessage.mockRestore();
  });
});

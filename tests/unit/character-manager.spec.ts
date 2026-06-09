import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import App from '../../src/角色卡管理器/App.vue';
import { filterCharacters, sortCharacters } from '../../src/角色卡管理器/filters';
import { normalizeSummary, readCharacterDetail, readCharacterList } from '../../src/角色卡管理器/host';
import type { CharacterSummary } from '../../src/角色卡管理器/types';

function makeCharacter(patch: Partial<CharacterSummary> = {}): CharacterSummary {
  return {
    fileName: '莉莉丝.png',
    name: '莉莉丝',
    avatarUrl: '/characters/%E8%8E%89%E8%8E%89%E4%B8%9D.png',
    fav: false,
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
});

describe('搜索、排序和筛选', () => {
  const characters = [
    makeCharacter({ name: '莉莉丝', fav: true, date_added: 300, character_book: '夜城世界书' }),
    makeCharacter({ fileName: '明日香.png', name: '明日香', date_added: 200, firstMes: '', issues: [{ level: 'warning', message: '缺少主开场白，导入或游玩前建议检查。' }] }),
    makeCharacter({ fileName: 'NoName.png', name: 'NoName', date_added: 100, readError: '失败', issues: [{ level: 'error', message: '详情读取失败：HTTP 500' }] }),
  ];

  it('支持中文关键词搜索', () => {
    expect(filterCharacters(characters, '明日', 'all').map(character => character.name)).toEqual(['明日香']);
  });

  it('支持收藏、世界书、缺开场白和异常筛选', () => {
    expect(filterCharacters(characters, '', 'favorite')).toHaveLength(1);
    expect(filterCharacters(characters, '', 'worldBook')).toHaveLength(1);
    expect(filterCharacters(characters, '', 'missingGreeting')).toHaveLength(1);
    expect(filterCharacters(characters, '', 'error')).toHaveLength(1);
  });

  it('按导入时间倒序，按名称正序', () => {
    expect(sortCharacters(characters, 'date_added')[0].name).toBe('莉莉丝');
    expect(sortCharacters(characters, 'name').map(character => character.name)).toEqual(['莉莉丝', '明日香', 'NoName']);
  });
});

describe('角色卡管理器组件', () => {
  it('渲染列表、中文详情和缺字段提示', async () => {
    const host = window as Window &
      typeof globalThis & {
        characters?: unknown[];
        getCharacters?: () => void;
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
          alternate_greetings: ['第二开场'],
          character_book: '夜城世界书',
          character_version: '1.2',
        },
      }),
    } as Response);

    const wrapper = mount(App);
    await vi.waitFor(() => expect(wrapper.text()).toContain('莉莉丝'));

    expect(wrapper.text()).toContain('空白卡');
    expect(wrapper.text()).toContain('缺开场白');

    await wrapper.get('button.cm-row').trigger('click');
    await vi.waitFor(() => expect(wrapper.text()).toContain('她负责验证详情预览。'));

    expect(wrapper.text()).toContain('夜城世界书');
    expect(wrapper.text()).not.toContain('??');
  });
});

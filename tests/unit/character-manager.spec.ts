import { mount } from '@vue/test-utils';
import { unzipSync, zipSync } from 'fflate';
import { describe, expect, it, vi } from 'vitest';
import App from '../../src/角色卡管理器/App.vue';
import { filterCharacters, getFilterCounts, sortCharacters } from '../../src/角色卡管理器/filters';
import {
  applyCharacterImport,
  applyCharacterDeletion,
  applyCharacterCoverMutation,
  applyCharacterRename,
  applyFavoriteMutation,
  applySourceUrlMutation,
  applyTagMutation,
  deleteCharacterChat,
  downloadCharacterChats,
  downloadCharacterFile,
  exportCharactersZip,
  loadCharacterOriginalImage,
  normalizeSummary,
  openCharacterChat,
  previewCharacterDeletion,
  previewCharacterRename,
  readCharacterChatContent,
  readCharacterChats,
  readCharacterDetail,
  readCharacterList,
  readTavernTags,
} from '../../src/角色卡管理器/host';
import {
  buildImportCandidate,
  encodePngTextChunkForTest,
  expandImportSources,
  fetchImportSource,
  parseImportSource,
} from '../../src/角色卡管理器/imports';
import { getTagCounts, previewTagMutation } from '../../src/角色卡管理器/tags';
import type { CharacterDetail, CharacterSummary, CharacterTag } from '../../src/角色卡管理器/types';

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
    worldBookEmbedded: false,
    sourceUrl: '',
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
        extensions: { source_url: 'https://discord.com/channels/123/456/789' },
      },
    });

    expect(summary.name).toBe('雪乃');
    expect(summary.fav).toBe(true);
    expect(summary.character_book).toBe('雪国世界书');
    expect(summary.sourceUrl).toBe('https://discord.com/channels/123/456/789');
    expect(summary.altGreetingCount).toBe(2);
    expect(summary.issues.map(issue => issue.message).join('\n')).toContain('关联世界书');
  });

  it('兼容参考脚本缓存里的 source_url，并优先于卡内来源字段', () => {
    const summary = normalizeSummary(
      {
        avatar: '雪乃.webp',
        name: '雪乃',
        data: {
          extensions: { source_url: 'https://card.example/source' },
        },
      },
      undefined,
      { source_url: 'https://legacy.example/source' },
    );

    expect(summary.sourceUrl).toBe('https://legacy.example/source');
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

describe('角色卡导入解析与预览', () => {
  const existing = makeCharacter({
    fileName: '莉莉丝.png',
    name: '莉莉丝',
    fav: true,
    creator: '旧作者',
    character_version: '1.0',
    desc: '旧描述',
    tagIds: ['整理'],
    tags: [{ id: '整理', name: '待整理' }],
  });
  const existingDetail: CharacterDetail = {
    ...existing,
    description: '旧描述',
    personality: '旧性格',
    scenario: '旧场景',
    first_mes: '旧开场',
    alternate_greetings: ['旧备选'],
    mes_example: '',
    system_prompt: '',
    creator_notes: '旧备注',
    post_history_instructions: '',
    detailLoaded: true,
  };

  it('解析 JSON 角色卡并按文件名生成更新预览', async () => {
    const blob = new Blob(
      [
        JSON.stringify({
          spec: 'chara_card_v2',
          data: {
            name: '莉莉丝',
            description: '新描述',
            first_mes: '新开场',
            alternate_greetings: ['新备选 1', '新备选 2'],
            character_book: { name: '雪国世界书', entries: [{ comment: '入口', content: '内容' }] },
            creator: '新作者',
            extensions: { source_url: 'https://new.example/card', depth_prompt: { prompt: '', depth: 4, role: 'system' } },
          },
        }),
      ],
      { type: 'application/json' },
    );

    const candidate = await buildImportCandidate(
      { sourceKind: 'file', sourceName: '莉莉丝.png', blob, contentType: 'application/json' },
      [existing],
      [{ id: '整理', name: '待整理' }],
      { '莉莉丝.png': ['整理'] },
      vi.fn().mockResolvedValue(existingDetail),
    );

    expect(candidate.action).toBe('update');
    expect(candidate.status).toBe('ready');
    expect(candidate.diff.find(group => group.id === 'gameplay')?.rows.find(row => row.label === '描述')?.finalValue).toBe('新描述');
    expect(candidate.diff.find(group => group.id === 'gameplay')?.rows.find(row => row.label === '世界书')?.finalValue).toBe('雪国世界书（1 条）');
    expect(candidate.diff.find(group => group.id === 'metadata')?.rows.find(row => row.label === '标签')?.finalValue).toBe('待整理');
    expect(candidate.diff.find(group => group.id === 'metadata')?.rows.some(row => row.label === '深度提示')).toBe(false);
  });

  it('更新时新卡缺少来源 URL 会保留旧卡来源 URL 到最终导入数据', async () => {
    const existingWithSource = makeCharacter({
      fileName: '莉莉丝.png',
      name: '莉莉丝',
      sourceUrl: 'https://discord.com/channels/old/source',
    });
    const detailWithSource: CharacterDetail = {
      ...existingDetail,
      sourceUrl: 'https://discord.com/channels/old/source',
    };
    const blob = new Blob([JSON.stringify({ data: { name: '莉莉丝', description: '新描述', first_mes: '新开场' } })], {
      type: 'application/json',
    });

    const candidate = await buildImportCandidate(
      { sourceKind: 'file', sourceName: '莉莉丝.png', blob, contentType: 'application/json' },
      [existingWithSource],
      [],
      {},
      vi.fn().mockResolvedValue(detailWithSource),
    );
    const mergedRaw = JSON.parse(await candidate.importBlob.text());
    const extensions = mergedRaw.data.extensions;

    expect(extensions.source_url).toBe('https://discord.com/channels/old/source');
    expect(extensions.source_link).toBe('https://discord.com/channels/old/source');
    expect(candidate.diff.find(group => group.id === 'metadata')?.rows.find(row => row.label === '来源 URL')?.finalValue).toBe(
      'https://discord.com/channels/old/source',
    );
  });

  it('同名但文件名不同默认新增并警告', async () => {
    const blob = new Blob([JSON.stringify({ name: '莉莉丝', description: '另一张卡', first_mes: '你好' })], {
      type: 'application/json',
    });

    const candidate = await buildImportCandidate(
      { sourceKind: 'file', sourceName: '另一张莉莉丝.json', blob, contentType: 'application/json' },
      [existing],
      [],
      {},
      vi.fn(),
    );

    expect(candidate.action).toBe('create');
    expect(candidate.nameConflict?.fileName).toBe('莉莉丝.png');
    expect(candidate.issues[0].message).toContain('同名角色');
  });

  it('解析 PNG tEXt chara 数据', async () => {
    const raw = { data: { name: 'PNG 角色', description: '来自图片', first_mes: '开场' } };
    const encoded = btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(raw))));
    const png = new Blob([encodePngTextChunkForTest('chara', encoded)], { type: 'image/png' });

    const parsed = await parseImportSource({ sourceKind: 'file', sourceName: 'PNG角色.png', blob: png, contentType: 'image/png' });

    expect(parsed.format).toBe('png');
    expect(parsed.card.name).toBe('PNG 角色');
  });

  it('展开 ZIP 中的 JSON 和 PNG 角色卡，忽略其他文件', async () => {
    const jsonBytes = new TextEncoder().encode(JSON.stringify({ data: { name: '压缩包角色', first_mes: '你好' } }));
    const raw = { data: { name: '压缩包图片角色', description: '来自图片', first_mes: '开场' } };
    const encoded = btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(raw))));
    const pngBytes = encodePngTextChunkForTest('chara', encoded);
    const zipBytes = zipSync({
      'cards/压缩包角色.json': jsonBytes,
      'cards/压缩包图片角色.png': pngBytes,
      'readme.txt': new TextEncoder().encode('忽略我'),
    });
    const zip = new Blob([zipBytes], { type: 'application/zip' });

    const sources = await expandImportSources({ sourceKind: 'file', sourceName: '角色合集.zip', blob: zip, contentType: 'application/zip' });

    expect(sources.map(source => source.sourceName)).toEqual([
      '角色合集.zip / cards/压缩包角色.json',
      '角色合集.zip / cards/压缩包图片角色.png',
    ]);
    await expect(parseImportSource(sources[0])).resolves.toMatchObject({ format: 'json' });
    await expect(parseImportSource(sources[1])).resolves.toMatchObject({ format: 'png' });
  });

  it('空 ZIP 会给出可见错误', async () => {
    const zip = new Blob([zipSync({ 'readme.txt': new TextEncoder().encode('没有角色卡') })], { type: 'application/zip' });

    await expect(expandImportSources({ sourceKind: 'file', sourceName: '空包.zip', blob: zip, contentType: 'application/zip' })).rejects.toThrow(
      '没有找到',
    );
  });

  it('URL 读取失败会暴露 HTTP 错误，成功时保留响应文件名', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: async () => new Blob([JSON.stringify({ name: '远程卡', first_mes: '你好' })], { type: 'application/json' }),
      headers: {
        get: (name: string) =>
          name.toLowerCase() === 'content-disposition'
            ? "attachment; filename*=UTF-8''%E8%BF%9C%E7%A8%8B%E5%8D%A1.json"
            : name.toLowerCase() === 'content-type'
              ? 'application/json'
              : '',
      },
    }) as typeof fetch;

    const source = await fetchImportSource('https://example.test/cards/remote');

    expect(source.sourceName).toBe('远程卡.json');
    expect(source.sourceKind).toBe('url');
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 404 }) as typeof fetch;
    await expect(fetchImportSource('https://example.test/missing.json')).rejects.toThrow('HTTP 404');
    globalThis.fetch = originalFetch;
  });

  it('确认前不写入，确认后才调用 importRawCharacter 并继续处理失败项', async () => {
    const blob = new Blob([JSON.stringify({ name: '新卡', first_mes: '你好' })], { type: 'application/json' });
    const candidate = await buildImportCandidate(
      { sourceKind: 'file', sourceName: '新卡.json', blob, contentType: 'application/json' },
      [],
      [],
      {},
      vi.fn(),
    );
    const importRawCharacter = vi
      .fn()
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: false, status: 500 });
    const host = { importRawCharacter } as unknown as Window & typeof globalThis;

    expect(importRawCharacter).not.toHaveBeenCalled();
    const results = await applyCharacterImport([candidate, { ...candidate, id: '失败项', fileName: '失败.json' }], host);

    expect(importRawCharacter).toHaveBeenCalledTimes(2);
    expect(results.map(result => result.success)).toEqual([true, false]);
  });

  it('更新已有角色时优先使用 TavernHelper 暴露的角色卡导入接口', async () => {
    const blob = new Blob([JSON.stringify({ data: { name: '助手导入', first_mes: '你好' } })], { type: 'application/json' });
    const existingCharacter = makeCharacter({ fileName: '助手导入.json', name: '助手导入' });
    const candidate = await buildImportCandidate(
      { sourceKind: 'file', sourceName: '助手导入.json', blob, contentType: 'application/json' },
      [existingCharacter],
      [],
      {},
      vi.fn().mockResolvedValue({
        ...existingCharacter,
        description: '',
        personality: '',
        scenario: '',
        first_mes: '你好',
        alternate_greetings: [],
        mes_example: '',
        system_prompt: '',
        creator_notes: '',
        post_history_instructions: '',
        detailLoaded: true,
      } satisfies CharacterDetail),
    );
    const importRawCharacter = vi.fn().mockResolvedValue({ ok: true });
    const host = {
      TavernHelper: { importRawCharacter },
    } as unknown as Window & typeof globalThis;

    const results = await applyCharacterImport([candidate], host);

    expect(candidate.action).toBe('update');
    expect(importRawCharacter).toHaveBeenCalledWith('助手导入.json', candidate.importBlob);
    expect(results[0].success).toBe(true);
  });

  it('助手导入接口缺失时退回酒馆原生文件输入', async () => {
    const blob = new Blob([JSON.stringify({ name: '原生导入', first_mes: '你好' })], { type: 'application/json' });
    const candidate = await buildImportCandidate(
      { sourceKind: 'file', sourceName: '原生导入.json', blob, contentType: 'application/json' },
      [],
      [],
      {},
      vi.fn(),
    );
    class FakeDataTransfer {
      files: File[] = [];
      items = {
        add: (file: File) => {
          this.files = [file];
        },
      };
    }
    const input = {
      files: null,
      dispatchEvent: vi.fn(() => {
        host.characters = [{ avatar: '原生导入.json', name: '原生导入', data: { first_mes: '你好' } }];
        return true;
      }),
    };
    const host = {
      characters: [],
      document: { getElementById: vi.fn(() => input) },
      DataTransfer: FakeDataTransfer,
      File,
      Event,
      setTimeout,
    } as unknown as Window & typeof globalThis;

    const results = await applyCharacterImport([candidate], host);

    expect(input.files).toHaveLength(1);
    expect(input.dispatchEvent).toHaveBeenCalledTimes(1);
    expect(results[0].success).toBe(true);
  });

  it('替换角色卡时世界书迁移接口不可用会保守降级，不删除旧世界书', async () => {
    const existingWithBook = makeCharacter({
      fileName: '旧角色.png',
      name: '旧角色',
      character_book: '旧世界书',
      worldBookEmbedded: true,
    });
    const existingDetailWithBook: CharacterDetail = {
      ...existingDetail,
      fileName: '旧角色.png',
      name: '旧角色',
      character_book: '旧世界书',
      worldBookEmbedded: true,
    };
    const blob = new Blob(
      [
        JSON.stringify({
          data: {
            name: '新角色',
            first_mes: '新开场',
            character_book: { name: '新世界书', entries: [{ comment: '入口', content: '内容' }] },
          },
        }),
      ],
      { type: 'application/json' },
    );
    const candidate = await buildImportCandidate(
      { sourceKind: 'file', sourceName: '新角色.png', blob, contentType: 'application/json' },
      [existingWithBook],
      [],
      {},
      vi.fn().mockResolvedValue(existingDetailWithBook),
      existingWithBook,
    );
    const importRawCharacter = vi.fn().mockResolvedValue({ ok: true });
    const deleteWorldbook = vi.fn().mockResolvedValue(true);
    const host = {
      TavernHelper: { importRawCharacter, deleteWorldbook },
    } as unknown as Window & typeof globalThis;

    const [result] = await applyCharacterImport([candidate], host);

    expect(result.success).toBe(true);
    expect(importRawCharacter).toHaveBeenCalledWith('旧角色.png', candidate.importBlob);
    expect(deleteWorldbook).not.toHaveBeenCalled();
    expect(result.message).toContain('未能自动导入，需手动处理');
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
      archived: 0,
      worldBook: 1,
      missingGreeting: 1,
      untagged: 1,
      error: 1,
    });
  });

  it('归档角色只参与归档筛选和归档计数', () => {
    const archiveTag: CharacterTag = { id: 'archive', name: '归档' };
    const sharedTag: CharacterTag = { id: '整理', name: '待整理' };
    const visible = makeCharacter({ name: '普通卡', fav: true, tagIds: ['整理'], tags: [sharedTag] });
    const archived = makeCharacter({
      fileName: '归档卡.png',
      name: '归档卡',
      fav: true,
      tagIds: ['整理', 'archive'],
      tags: [sharedTag, archiveTag],
    });
    const list = [visible, archived, makeCharacter({ fileName: '无标签.png', name: '无标签' })];

    expect(filterCharacters(list, '', 'all').map(character => character.name)).toEqual(['普通卡', '无标签']);
    expect(filterCharacters(list, '', 'favorite').map(character => character.name)).toEqual(['普通卡']);
    expect(filterCharacters(list, '', 'all', ['整理']).map(character => character.name)).toEqual(['普通卡']);
    expect(filterCharacters(list, '归档', 'archived').map(character => character.name)).toEqual(['归档卡']);
    expect(getFilterCounts(list)).toMatchObject({ all: 2, favorite: 1, archived: 1, untagged: 1 });
    expect(getTagCounts(list)).toEqual({ 整理: 1 });

    const restored = { ...archived, tagIds: ['整理'], tags: [sharedTag] };
    expect(filterCharacters([visible, restored], '', 'all').map(character => character.name)).toEqual(['普通卡', '归档卡']);
    expect(getTagCounts([visible, restored])).toEqual({ 整理: 2 });
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

describe('写入型角色管理', () => {
  it('收藏切换成功会写入 merge-attributes 并更新宿主内存', async () => {
    const hostCharacter = { avatar: '莉莉丝.png', name: '莉莉丝', fav: false, data: { extensions: {} } };
    const host = {
      characters: [hostCharacter],
      fetch: vi.fn().mockResolvedValue({ ok: true, text: async () => '' }),
    } as unknown as Window & typeof globalThis;

    const result = await applyFavoriteMutation('莉莉丝.png', true, host);

    expect(result.success).toBe(true);
    expect(host.fetch).toHaveBeenCalledWith(
      '/api/characters/merge-attributes',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          avatar: '莉莉丝.png',
          fav: true,
          data: { extensions: { fav: true } },
        }),
      }),
    );
    expect(hostCharacter.fav).toBe(true);
    expect(hostCharacter.data.fav).toBe(true);
    expect(hostCharacter.data.extensions.fav).toBe(true);
  });

  it('来源 URL 保存会写入扩展元数据，失败时回滚宿主内存', async () => {
    const hostCharacter = {
      avatar: '莉莉丝.png',
      name: '莉莉丝',
      data: { extensions: { source_url: 'https://old.example/card' } },
    };
    const host = {
      characters: [hostCharacter],
      fetch: vi.fn().mockResolvedValue({ ok: true, text: async () => '' }),
    } as unknown as Window & typeof globalThis;

    const result = await applySourceUrlMutation('莉莉丝.png', ' https://discord.com/channels/1/2/3 ', host);

    expect(result.success).toBe(true);
    expect(result.sourceUrl).toBe('https://discord.com/channels/1/2/3');
    expect(host.fetch).toHaveBeenCalledWith(
      '/api/characters/merge-attributes',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          avatar: '莉莉丝.png',
          data: {
            source_url: 'https://discord.com/channels/1/2/3',
            extensions: {
              source_url: 'https://discord.com/channels/1/2/3',
              source_link: 'https://discord.com/channels/1/2/3',
            },
          },
        }),
      }),
    );
    expect(hostCharacter.data.extensions.source_url).toBe('https://discord.com/channels/1/2/3');

    host.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500, text: async () => '磁盘不可写' }) as typeof fetch;
    const failed = await applySourceUrlMutation('莉莉丝.png', 'https://new.example/card', host);

    expect(failed.success).toBe(false);
    expect(failed.message).toContain('来源 URL 保存失败');
    expect(hostCharacter.data.extensions.source_url).toBe('https://discord.com/channels/1/2/3');
  });

  it('收藏切换失败会回滚宿主内存并返回中文错误', async () => {
    const hostCharacter = { avatar: '莉莉丝.png', name: '莉莉丝', fav: true, data: { fav: true, extensions: { fav: true } } };
    const host = {
      characters: [hostCharacter],
      fetch: vi.fn().mockResolvedValue({ ok: false, status: 500, text: async () => '磁盘不可写' }),
    } as unknown as Window & typeof globalThis;

    const result = await applyFavoriteMutation('莉莉丝.png', false, host);

    expect(result.success).toBe(false);
    expect(result.message).toContain('收藏写入失败');
    expect(hostCharacter.fav).toBe(true);
    expect(hostCharacter.data.fav).toBe(true);
    expect(hostCharacter.data.extensions.fav).toBe(true);
  });

  it('重命名预览会校验空名称、非法字符、无变化和文件名冲突', () => {
    const current = makeCharacter({ fileName: '莉莉丝.png', name: '莉莉丝', tagIds: ['整理'] });
    const existing = [current, makeCharacter({ fileName: '已存在.png', name: '已存在' })];

    expect(previewCharacterRename(current, '   ', existing).errors.join(' ')).toContain('请输入新名称');
    expect(previewCharacterRename(current, '<>:"/\\|?*', existing).errors.join(' ')).toContain('名称不能只包含非法字符');
    expect(previewCharacterRename(current, '莉莉丝', existing).errors.join(' ')).toContain('名称没有变化');
    expect(previewCharacterRename(current, '已存在', existing).errors.join(' ')).toContain('已存在文件名');

    const sanitized = previewCharacterRename(current, '新:名?', existing);
    expect(sanitized.targetFileName).toBe('新名.png');
    expect(sanitized.warnings.join(' ')).toContain('不安全字符');
    expect(sanitized.tagIdsToMove).toEqual(['整理']);
  });

  it('重命名成功会迁移 tagMap、保存标签设置并更新宿主角色', async () => {
    const hostCharacter = { avatar: '莉莉丝.png', name: '莉莉丝', data: { name: '莉莉丝' } };
    const context = {
      characters: [hostCharacter],
      tags: [{ id: '整理', name: '待整理' }],
      tagMap: { '莉莉丝.png': ['整理'] },
      saveSettingsDebounced: vi.fn(),
    };
    const host = {
      characters: context.characters,
      SillyTavern: { getContext: () => context },
      fetch: vi.fn().mockResolvedValue({ ok: true, json: async () => ({ avatar: '新莉莉丝.png' }) }),
    } as unknown as Window & typeof globalThis;
    const preview = previewCharacterRename(makeCharacter({ tagIds: ['整理'] }), '新莉莉丝', [
      makeCharacter({ tagIds: ['整理'] }),
    ]);

    const result = await applyCharacterRename(preview, host);

    expect(result.success).toBe(true);
    expect(host.fetch).toHaveBeenCalledWith('/api/characters/rename', expect.objectContaining({ method: 'POST' }));
    expect(context.tagMap['新莉莉丝.png']).toEqual(['整理']);
    expect(context.tagMap['莉莉丝.png']).toBeUndefined();
    expect(context.saveSettingsDebounced).toHaveBeenCalledTimes(1);
    expect(hostCharacter.avatar).toBe('新莉莉丝.png');
    expect(hostCharacter.name).toBe('新莉莉丝');
    expect(hostCharacter.data.name).toBe('新莉莉丝');
  });

  it('单卡下载会读取原角色文件并用原文件名触发下载', async () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    const createObjectUrl = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:download');
    const revokeObjectUrl = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const host = {
      document,
      setTimeout: (callback: TimerHandler) => {
        if (typeof callback === 'function') callback();
        return 0;
      },
      fetch: vi.fn().mockResolvedValue({
        ok: true,
        blob: async () => new Blob(['card-bytes'], { type: 'image/png' }),
      }),
    } as unknown as Window & typeof globalThis;

    const result = await downloadCharacterFile('莉莉丝.png', host);

    expect(result.success).toBe(true);
    expect(host.fetch).toHaveBeenCalledWith('/characters/%E8%8E%89%E8%8E%89%E4%B8%9D.png');
    expect(click).toHaveBeenCalledTimes(1);
    click.mockRestore();
    createObjectUrl.mockRestore();
    revokeObjectUrl.mockRestore();
  });

  it('封面更新会复用原角色数据并通过原生编辑接口写入头像', async () => {
    const host = {
      document,
      fetch: vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: {
              name: '莉莉丝',
              description: '旧描述',
              first_mes: '旧开场',
              alternate_greetings: ['备选'],
              extensions: { source_url: 'https://example.com/card', fav: true },
              chat: [{ mes: '不应提交' }],
            },
            chat: [{ mes: '也不应提交' }],
          }),
        } as Response)
        .mockResolvedValueOnce({ ok: true, text: async () => '' } as Response),
    } as unknown as Window & typeof globalThis;

    const result = await applyCharacterCoverMutation(
      '莉莉丝.png',
      new Blob(['cover-bytes'], { type: 'image/webp' }),
      '新封面.webp',
      host,
    );

    expect(result.success).toBe(true);
    expect(host.fetch).toHaveBeenNthCalledWith(
      1,
      '/api/characters/get',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(host.fetch).toHaveBeenNthCalledWith(
      2,
      '/api/characters/edit',
      expect.objectContaining({ method: 'POST', body: expect.any(FormData) }),
    );
    const formData = (host.fetch as ReturnType<typeof vi.fn>).mock.calls[1][1].body as FormData;
    expect(formData.get('avatar_url')).toBe('莉莉丝.png');
    expect(formData.get('ch_name')).toBe('莉莉丝');
    expect(formData.get('description')).toBe('旧描述');
    expect(formData.get('first_mes')).toBe('旧开场');
    expect(formData.getAll('alternate_greetings')).toEqual(['备选']);
    expect(formData.get('fav')).toBe('true');
    expect(String(formData.get('json_data'))).not.toContain('"chat"');
    expect(formData.get('avatar')).toBeInstanceOf(Blob);
  });

  it('批量 ZIP 导出会包含成功读取的角色文件并跳过失败项', async () => {
    let downloadedBlob: Blob | undefined;
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    const createObjectUrl = vi.spyOn(URL, 'createObjectURL').mockImplementation(blob => {
      downloadedBlob = blob;
      return 'blob:zip';
    });
    const revokeObjectUrl = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const host = {
      document,
      setTimeout: (callback: TimerHandler) => {
        if (typeof callback === 'function') callback();
        return 0;
      },
      fetch: vi.fn((url: string) =>
        url.includes('%E5%A4%B1%E8%B4%A5')
          ? Promise.resolve({ ok: false, status: 404, text: async () => 'not found' })
          : Promise.resolve({ ok: true, blob: async () => new Blob([`bytes:${url}`], { type: 'image/png' }) }),
      ),
    } as unknown as Window & typeof globalThis;

    const result = await exportCharactersZip(['莉莉丝.png', '失败.png'], host);

    expect(result.success).toBe(false);
    expect(result.exportedFileNames).toEqual(['莉莉丝.png']);
    expect(result.failedFileNames).toEqual(['失败.png']);
    expect(result.zipFileName).toMatch(/^character-cards-\d{4}-\d{2}-\d{2}\.zip$/);
    expect(downloadedBlob).toBeInstanceOf(Blob);
    const files = unzipSync(new Uint8Array(await downloadedBlob!.arrayBuffer()));
    expect(new TextDecoder().decode(files['莉莉丝.png'])).toContain('/characters/');
    expect(files['失败.png']).toBeUndefined();
    expect(click).toHaveBeenCalledTimes(1);
    click.mockRestore();
    createObjectUrl.mockRestore();
    revokeObjectUrl.mockRestore();
  });

  it('聊天记录按酒馆 chatfile 读取内容，并支持单条和批量下载', async () => {
    let downloadedBlob: Blob | undefined;
    let downloadedName = '';
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    const createObjectUrl = vi.spyOn(URL, 'createObjectURL').mockImplementation(blob => {
      downloadedBlob = blob;
      return 'blob:chat-download';
    });
    const revokeObjectUrl = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const host = {
      document: {
        createElement: () => ({
          set href(_value: string) {},
          set download(value: string) {
            downloadedName = value;
          },
          click,
          remove: vi.fn(),
        }),
        body: { appendChild: vi.fn((link: HTMLAnchorElement) => link) },
      },
      setTimeout: (callback: TimerHandler) => {
        if (typeof callback === 'function') callback();
        return 0;
      },
      fetch: vi.fn((url: string, options?: RequestInit) => {
        const body = JSON.parse(String(options?.body || '{}'));
        if (url === '/api/characters/chats') {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              '莉莉丝 - 初次聊天.jsonl': { chat_items: 3, last_mes: 1000 },
              '莉莉丝 - 后续.jsonl': { chat_items: 5, last_mes: 2000 },
            }),
          });
        }
        if (url === '/api/chats/get') {
          expect(body.chatfile).toContain('莉莉丝 - ');
          return Promise.resolve({ ok: true, json: async () => [{ mes: `内容 ${body.chatfile}` }] });
        }
        return Promise.resolve({ ok: false, status: 404, text: async () => 'missing' });
      }),
    } as unknown as Window & typeof globalThis;

    const chats = await readCharacterChats('莉莉丝.png', host);
    const content = await readCharacterChatContent('莉莉丝.png', chats[0], host);
    expect(chats.map(chat => chat.title)).toEqual(['后续', '初次聊天']);
    expect(content.fileName).toBe('莉莉丝 - 后续.jsonl');

    const single = await downloadCharacterChats('莉莉丝.png', [chats[0].id], host);
    expect(single.success).toBe(true);
    expect(single.message).toBe('');
    expect(downloadedName).toBe('莉莉丝 - 后续.jsonl');

    const all = await downloadCharacterChats('莉莉丝.png', [], host);
    expect(all.success).toBe(true);
    expect(downloadedName).toBe('莉莉丝-chats.zip');
    const files = unzipSync(new Uint8Array(await downloadedBlob!.arrayBuffer()));
    expect(Object.keys(files)).toContain('莉莉丝 - 初次聊天.jsonl');
    click.mockRestore();
    createObjectUrl.mockRestore();
    revokeObjectUrl.mockRestore();
  });

  it('启动聊天记录会按酒馆助手签名先选角色再打开 chatfile', async () => {
    const calls: string[] = [];
    const context = {
      characters: [{ avatar: '莉莉丝.png', name: '莉莉丝', data: {} }],
      selectCharacterById: vi.fn(async id => {
        calls.push(`select:${id}`);
      }),
      openCharacterChat: vi.fn(async chatfile => {
        calls.push(`open:${chatfile}`);
      }),
    };
    const host = {
      SillyTavern: { getContext: () => context },
      setTimeout: (callback: TimerHandler) => {
        if (typeof callback === 'function') callback();
        return 0;
      },
    } as unknown as Window & typeof globalThis;

    const result = await openCharacterChat('莉莉丝.png', '莉莉丝 - 后续.jsonl', host);

    expect(result.success).toBe(true);
    expect(calls).toEqual(['select:0', 'open:莉莉丝 - 后续.jsonl']);
  });

  it('启动角色但不指定聊天时只选中角色', async () => {
    const calls: string[] = [];
    const context = {
      characters: [{ avatar: '莉莉丝.png', name: '莉莉丝', data: {} }],
      selectCharacterById: vi.fn(async id => {
        calls.push(`select:${id}`);
      }),
      openCharacterChat: vi.fn(async chatfile => {
        calls.push(`open:${chatfile}`);
      }),
    };
    const host = {
      SillyTavern: { getContext: () => context },
      setTimeout: (callback: TimerHandler) => {
        if (typeof callback === 'function') callback();
        return 0;
      },
    } as unknown as Window & typeof globalThis;

    const result = await openCharacterChat('莉莉丝.png', '', host);

    expect(result.success).toBe(true);
    expect(calls).toEqual(['select:0']);
  });

  it('单条删除聊天记录会调用酒馆 chatfile 删除接口', async () => {
    const host = {
      fetch: vi.fn((url: string, options?: RequestInit) => {
        const body = JSON.parse(String(options?.body || '{}'));
        expect(url).toBe('/api/chats/delete');
        expect(body).toEqual({ avatar_url: '莉莉丝.png', chatfile: '莉莉丝 - 后续.jsonl' });
        return Promise.resolve({ ok: true, text: async () => '' });
      }),
    } as unknown as Window & typeof globalThis;

    const result = await deleteCharacterChat('莉莉丝.png', {
      id: '莉莉丝 - 后续.jsonl',
      fileName: '莉莉丝 - 后续.jsonl',
      title: '后续',
      messageCount: 5,
      updatedAt: 2000,
    }, host);

    expect(result.success).toBe(true);
  });

  it('删除预览默认备份并默认删除可确认的内嵌世界书，但跳过共享世界书', async () => {
    const characters = [
      makeCharacter({ fileName: '莉莉丝.png', name: '莉莉丝', character_book: '莉莉丝世界书', worldBookEmbedded: true, sourceUrl: 'https://source.test' }),
      makeCharacter({ fileName: '共享A.png', name: '共享A', character_book: '共享世界书', worldBookEmbedded: true }),
      makeCharacter({ fileName: '共享B.png', name: '共享B', character_book: '共享世界书', worldBookEmbedded: true }),
    ];
    const host = {
      fetch: vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ '莉莉丝 - 初次聊天.jsonl': { chat_items: 3, last_mes: 1000 } }),
      }),
    } as unknown as Window & typeof globalThis;

    const preview = await previewCharacterDeletion(['莉莉丝.png', '共享A.png'], {}, characters, host);

    expect(preview.options.backupCharacters).toBe(true);
    expect(preview.options.deleteChats).toBe(false);
    expect(preview.options.deleteWorldBooks).toBe(true);
    expect(preview.requiresDeleteText).toBe(true);
    expect(preview.targets[0].willDeleteWorldBook).toBe(true);
    expect(preview.targets[0].chats[0].title).toBe('初次聊天');
    expect(preview.targets[1].willDeleteWorldBook).toBe(false);
    expect(preview.targets[1].worldBook.reason).toContain('被其他角色使用');
  });

  it('确认删除会先备份，再删除聊天、内嵌世界书和角色，并清理 tagMap', async () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    const createObjectUrl = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:delete-backup');
    const revokeObjectUrl = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const hostCharacter = { avatar: '莉莉丝.png', name: '莉莉丝', data: { character_book: { name: '莉莉丝世界书', entries: [] } } };
    const context = {
      characters: [hostCharacter],
      tags: [{ id: '整理', name: '待整理' }],
      tagMap: { '莉莉丝.png': ['整理'] },
      saveSettingsDebounced: vi.fn(),
      getCharacters: vi.fn(),
    };
    const calls: string[] = [];
    const host = {
      document,
      characters: context.characters,
      SillyTavern: { getContext: () => context },
      setTimeout: (callback: TimerHandler) => {
        if (typeof callback === 'function') callback();
        return 0;
      },
      fetch: vi.fn((url: string, options?: RequestInit) => {
        calls.push(url);
        if (url.startsWith('/characters/')) {
          return Promise.resolve({ ok: true, blob: async () => new Blob(['card'], { type: 'image/png' }) });
        }
        const body = JSON.parse(String(options?.body || '{}'));
        if (url === '/api/characters/chats') {
          return Promise.resolve({ ok: true, json: async () => ({ '莉莉丝 - 初次聊天.jsonl': { chat_items: 1 } }) });
        }
        if (url === '/api/chats/delete') {
          expect(body.chatfile).toBe('莉莉丝 - 初次聊天.jsonl');
          return Promise.resolve({ ok: true, text: async () => '' });
        }
        if (url === '/api/worldinfo/delete') {
          expect(body.name).toBe('莉莉丝世界书');
          return Promise.resolve({ ok: true, text: async () => '' });
        }
        if (url === '/api/characters/delete') {
          expect(body.avatar_url).toBe('莉莉丝.png');
          return Promise.resolve({ ok: true, text: async () => '' });
        }
        return Promise.resolve({ ok: false, status: 404, text: async () => 'missing' });
      }),
    } as unknown as Window & typeof globalThis;

    const preview = await previewCharacterDeletion(
      ['莉莉丝.png'],
      { deleteChats: true },
      [makeCharacter({ character_book: '莉莉丝世界书', worldBookEmbedded: true })],
      host,
    );
    const results = await applyCharacterDeletion(preview, host);

    expect(results[0]).toMatchObject({ success: true, deletedChats: 1, deletedWorldBook: true });
    expect(calls.indexOf('/characters/%E8%8E%89%E8%8E%89%E4%B8%9D.png')).toBeLessThan(calls.indexOf('/api/characters/delete'));
    expect(context.tagMap['莉莉丝.png']).toBeUndefined();
    expect(context.characters).toHaveLength(0);
    expect(context.saveSettingsDebounced).toHaveBeenCalled();
    click.mockRestore();
    createObjectUrl.mockRestore();
    revokeObjectUrl.mockRestore();
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
    expect(wrapper.findAll('.cm-tag-filter > button').find(button => button.text().includes('待整理'))?.attributes('aria-pressed')).toBe('true');
    expect(wrapper.get('.cm-detail-tag-chip').classes()).toContain('active');
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

    await wrapper.findAll('.cm-list-tools button').find(button => button.text() === '选择')?.trigger('click');
    await wrapper.findAll('.cm-list-tools button').find(button => button.text() === '全选当前')?.trigger('click');
    expect(wrapper.text()).toContain('2 已选');
    expect(wrapper.text()).toContain('2 个已选角色');

    await wrapper.find('.cm-tag-editor .cm-primary-action').trigger('click');
    expect(wrapper.text()).toContain('变更预览');
    expect(wrapper.text()).toContain('会更新 1 个角色');

    await wrapper.findAll('.cm-tag-editor .cm-primary-action')[1].trigger('click');
    await vi.waitFor(() => expect(context.saveSettingsDebounced).toHaveBeenCalledTimes(1));
    expect(context.tagMap['空白卡.png']).toEqual(['整理']);

    await wrapper.findAll('.cm-list-tools button').find(button => button.text() === '清空')?.trigger('click');
    expect(wrapper.text()).toContain('0 已选');
  });

  it('卡片快捷操作支持收藏、下载入口和右侧重命名写入', async () => {
    const context = {
      characters: [
        { avatar: '莉莉丝.png', name: '莉莉丝', fav: true, data: { name: '莉莉丝', first_mes: '你好。' } },
        { avatar: '空白卡.png', name: '空白卡', fav: false, data: { name: '空白卡', first_mes: '你好。' } },
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
    host.fetch = vi.fn(async (url: RequestInfo | URL, options?: RequestInit) => {
      const textUrl = String(url);
      if (textUrl.startsWith('/characters/')) {
        return { ok: true, blob: async () => new Blob(['image-bytes'], { type: 'image/png' }) } as Response;
      }
      const body = JSON.parse(String(options?.body || '{}'));
      if (textUrl === '/api/characters/merge-attributes') {
        const target = context.characters.find(character => character.avatar === body.avatar);
        if (target) {
          if ('fav' in body) target.fav = body.fav;
          target.data = {
            ...target.data,
            ...(body.data || {}),
            extensions: {
              ...(target.data.extensions || {}),
              ...(body.data?.extensions || {}),
            },
          };
          if ('fav' in body) {
            target.data.fav = body.fav;
            target.data.extensions.fav = body.fav;
          }
        }
        return { ok: true, text: async () => '' } as Response;
      }
      if (textUrl === '/api/characters/rename') {
        const target = context.characters.find(character => character.avatar === body.avatar_url);
        if (target) {
          target.avatar = `${body.new_name}.png`;
          target.name = body.new_name;
          target.data = { ...target.data, name: body.new_name };
        }
        return { ok: true, json: async () => ({ avatar: `${body.new_name}.png` }) } as Response;
      }
      const selected = context.characters.find(character => character.avatar === body.avatar_url);
      return {
        ok: true,
        json: async () => ({
          data: {
            name: selected?.name || '',
            first_mes: selected?.data.first_mes || '',
            description: '详情内容',
          },
        }),
      } as Response;
    }) as typeof fetch;

    const wrapper = mount(App);
    await vi.waitFor(() => expect(wrapper.text()).toContain('空白卡'));

    await wrapper.get('button[aria-label="收藏 空白卡"]').trigger('click');
    await vi.waitFor(() => expect(host.fetch).toHaveBeenCalledWith('/api/characters/merge-attributes', expect.anything()));
    expect(context.characters[1].fav).toBe(true);
    expect(wrapper.text()).not.toContain('详情内容');
    expect(wrapper.find('button[aria-label="下载 空白卡"]').exists()).toBe(true);

    await wrapper.findAll('.cm-card')[0].trigger('click');
    await vi.waitFor(() => expect(wrapper.text()).toContain('详情内容'));
    await wrapper.get('input[placeholder="Discord / 发布页 URL"]').setValue('https://discord.com/channels/1/2/3');
    await wrapper.get('input[placeholder="Discord / 发布页 URL"]').trigger('keydown.enter');
    await vi.waitFor(() => expect(context.characters[0].data.extensions.source_url).toBe('https://discord.com/channels/1/2/3'));
    await vi.waitFor(() => expect(wrapper.get('input[placeholder="Discord / 发布页 URL"]').attributes('disabled')).toBeUndefined());
    expect(wrapper.text()).toContain('详情内容');
    expect(wrapper.text()).not.toContain('无内容');
    await wrapper.get('input[aria-label="角色名称"]').setValue('新莉莉丝');
    await wrapper.get('input[aria-label="角色名称"]').trigger('keydown.enter');

    await vi.waitFor(() => expect(context.tagMap['新莉莉丝.png']).toEqual(['整理']));
    expect(context.tagMap['莉莉丝.png']).toBeUndefined();
    expect(context.saveSettingsDebounced).toHaveBeenCalledTimes(1);
    await vi.waitFor(() => expect(wrapper.find('button[aria-label="从 新莉莉丝 移除标签 待整理"]').exists()).toBe(true));

    await wrapper.get('button[aria-label="从 新莉莉丝 移除标签 待整理"]').trigger('click');
    await vi.waitFor(() => expect(context.tagMap['新莉莉丝.png']).toEqual([]));
    expect(context.saveSettingsDebounced).toHaveBeenCalledTimes(2);

    await wrapper.get('button[aria-label="添加标签"]').trigger('click');
    expect(wrapper.text()).toContain('添加标签');
    expect(wrapper.find('.cm-tag-dialog select').exists()).toBe(false);
    expect(wrapper.find('.cm-tag-choice-grid button').text()).toBe('待整理');
    expect(wrapper.get('.cm-tag-choice-grid button').attributes('aria-pressed')).toBe('false');
    await vi.waitFor(() => expect(wrapper.get('.cm-tag-choice-grid button').attributes('disabled')).toBeUndefined());
    await wrapper.get('.cm-tag-choice-grid button').trigger('click');
    await vi.waitFor(() => expect(context.tagMap['新莉莉丝.png']).toEqual(['整理']));
    await vi.waitFor(() => expect(wrapper.get('.cm-tag-choice-grid button').attributes('aria-pressed')).toBe('true'));
    await vi.waitFor(() => expect(wrapper.get('.cm-tag-choice-grid button').attributes('disabled')).toBeUndefined());
    expect(context.saveSettingsDebounced).toHaveBeenCalledTimes(3);
    await wrapper.get('.cm-tag-choice-grid button').trigger('click');
    await vi.waitFor(() => expect(context.tagMap['新莉莉丝.png']).toEqual([]));
    expect(context.saveSettingsDebounced).toHaveBeenCalledTimes(4);
    await wrapper.get('.cm-tag-dialog input').setValue('自定义');
    await wrapper.get('.cm-tag-dialog input').trigger('keydown.enter');
    await vi.waitFor(() => expect(context.tags.some(tag => tag.name === '自定义')).toBe(true));
    expect(context.tagMap['新莉莉丝.png']).toContain(context.tags.find(tag => tag.name === '自定义')?.id);
    expect(context.saveSettingsDebounced).toHaveBeenCalledTimes(5);
  });

  it('导入弹窗会先解析预览，确认后才写入角色卡', async () => {
    const context = {
      characters: [{ avatar: '莉莉丝.png', name: '莉莉丝', data: { first_mes: '你好。', description: '旧描述' } }],
      tags: [{ id: '整理', name: '待整理' }],
      tagMap: { '莉莉丝.png': ['整理'] },
    };
    const host = window as Window &
      typeof globalThis & {
        SillyTavern?: unknown;
        characters?: unknown[];
        importRawCharacter?: (filename: string, content: Blob) => Promise<Response>;
      };
    host.SillyTavern = { getContext: () => context };
    host.characters = context.characters;
    host.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          name: '莉莉丝',
          description: '旧描述',
          first_mes: '你好。',
        },
      }),
    } as Response);
    host.importRawCharacter = vi.fn().mockResolvedValue({ ok: true } as Response);

    const wrapper = mount(App);
    await vi.waitFor(() => expect(wrapper.text()).toContain('莉莉丝'));
    expect(wrapper.text()).not.toContain('角色库');

    await wrapper.get('.cm-header-primary').trigger('click');
    expect(wrapper.find('.cm-import-dialog').exists()).toBe(true);
    expect(wrapper.find('.cm-search-field').exists()).toBe(true);
    expect(wrapper.find('.cm-sort-field').exists()).toBe(true);
    expect(wrapper.find('.cm-gallery-tools').exists()).toBe(true);
    expect(wrapper.classes()).not.toContain('left-collapsed');
    expect(wrapper.get('.cm-workspace').classes()).not.toContain('left-collapsed');
    expect(wrapper.text()).toContain('选择文件');
    expect(wrapper.text()).toContain('暂无候选项');
    const file = new File(
      [JSON.stringify({ data: { name: '莉莉丝', description: '新描述', first_mes: '新开场' } })],
      '莉莉丝.png',
      { type: 'application/json' },
    );
    Object.defineProperty(wrapper.get('.cm-file-button input').element, 'files', {
      value: [file],
      configurable: true,
    });
    await wrapper.get('.cm-file-button input').trigger('change');

    await vi.waitFor(() => expect(wrapper.findAll('.cm-import-card')).toHaveLength(1));
    expect(wrapper.text()).toContain('更新');
    expect(wrapper.text()).toContain('世界书');
    expect(wrapper.text()).toContain('待整理');
    expect(wrapper.get('.cm-import-dialog').text()).not.toContain('结果：无');
    expect(host.importRawCharacter).not.toHaveBeenCalled();

    await wrapper.get('.cm-import-dialog footer .cm-primary-action').trigger('click');
    await vi.waitFor(() => expect(host.importRawCharacter).toHaveBeenCalledTimes(1));
    await vi.waitFor(() => expect(wrapper.find('.cm-import-dialog').exists()).toBe(false));
    expect(wrapper.get('.cm-workspace').classes()).not.toContain('left-collapsed');
    expect(wrapper.find('.cm-search-field').exists()).toBe(true);
  });

  it('右侧替换入口会锁定当前角色文件名，并在确认前不写入', async () => {
    const context = {
      characters: [{ avatar: '旧角色.png', name: '旧角色', data: { first_mes: '旧开场', description: '旧描述' } }],
      tags: [],
      tagMap: {},
    };
    const host = window as Window &
      typeof globalThis & {
        SillyTavern?: unknown;
        characters?: unknown[];
        importRawCharacter?: (filename: string, content: Blob) => Promise<Response>;
      };
    host.SillyTavern = { getContext: () => context };
    host.characters = context.characters;
    host.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          name: '旧角色',
          description: '旧描述',
          first_mes: '旧开场',
        },
      }),
    } as Response);
    host.importRawCharacter = vi.fn().mockResolvedValue({ ok: true } as Response);

    const wrapper = mount(App);
    await vi.waitFor(() => expect(wrapper.text()).toContain('旧角色'));

    await wrapper.get('button[aria-label="替换或更新当前角色卡"]').trigger('click');
    expect(wrapper.get('.cm-import-dialog').text()).toContain('替换角色卡');
    expect(wrapper.get('.cm-import-dialog').text()).toContain('将替换当前角色：旧角色');
    expect(wrapper.find('.cm-import-url').exists()).toBe(false);

    const file = new File(
      [
        JSON.stringify({
          data: {
            name: '新卡标题',
            description: '新描述',
            first_mes: '新开场',
            character_book: { name: '新世界书', entries: [{ comment: '入口', content: '内容' }] },
          },
        }),
      ],
      '完全不同的文件名.json',
      { type: 'application/json' },
    );
    Object.defineProperty(wrapper.get('.cm-file-button input').element, 'files', {
      value: [file],
      configurable: true,
    });
    await wrapper.get('.cm-file-button input').trigger('change');

    await vi.waitFor(() => expect(wrapper.findAll('.cm-import-card')).toHaveLength(1));
    expect(wrapper.get('.cm-import-dialog').text()).toContain('替换');
    expect(wrapper.get('.cm-import-dialog').text()).toContain('旧角色.png');
    expect(wrapper.get('.cm-import-dialog').text()).toContain('新世界书');
    expect(host.importRawCharacter).not.toHaveBeenCalled();

    await wrapper.get('.cm-import-dialog footer .cm-primary-action').trigger('click');
    await vi.waitFor(() => expect(host.importRawCharacter).toHaveBeenCalledWith('旧角色.png', expect.any(Blob)));
  });

  it('右侧头像选择普通图片会更新封面而不是打开导入候选', async () => {
    const context = {
      characters: [{ avatar: '莉莉丝.png', name: '莉莉丝', data: { first_mes: '你好。', description: '旧描述' } }],
      tags: [],
      tagMap: {},
    };
    const host = window as Window &
      typeof globalThis & {
        SillyTavern?: unknown;
        characters?: unknown[];
      };
    const createObjectUrl = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:new-cover');
    const revokeObjectUrl = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    host.SillyTavern = { getContext: () => context };
    host.characters = context.characters;
    host.fetch = vi.fn((url: string) => {
      if (url.startsWith('/characters/')) {
        return Promise.resolve({ ok: true, blob: async () => new Blob(['old-cover'], { type: 'image/png' }) });
      }
      if (url === '/api/characters/get') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            data: {
              name: '莉莉丝',
              description: '旧描述',
              first_mes: '你好。',
            },
          }),
        });
      }
      if (url === '/api/characters/edit') {
        return Promise.resolve({ ok: true, text: async () => '' });
      }
      return Promise.resolve({ ok: true, json: async () => ({ data: {} }) });
    }) as typeof fetch;

    const wrapper = mount(App);
    await vi.waitFor(() => expect(wrapper.text()).toContain('莉莉丝'));

    const file = new File(['new-cover'], '新封面.webp', { type: 'image/webp' });
    Object.defineProperty(wrapper.get('.cm-visually-hidden-file').element, 'files', {
      value: [file],
      configurable: true,
    });
    await wrapper.get('.cm-visually-hidden-file').trigger('change');

    await vi.waitFor(() =>
      expect(host.fetch).toHaveBeenCalledWith('/api/characters/edit', expect.objectContaining({ method: 'POST', body: expect.any(FormData) })),
    );
    expect(wrapper.find('.cm-import-dialog').exists()).toBe(false);
    const editCall = (host.fetch as ReturnType<typeof vi.fn>).mock.calls.find(call => call[0] === '/api/characters/edit');
    expect((editCall?.[1] as RequestInit).body).toBeInstanceOf(FormData);
    createObjectUrl.mockRestore();
    revokeObjectUrl.mockRestore();
  });

  it('URL 解析失败时队列和右侧预览都显示中文错误', async () => {
    const context = {
      characters: [],
      tags: [],
      tagMap: {},
    };
    const host = window as Window &
      typeof globalThis & {
        SillyTavern?: unknown;
        characters?: unknown[];
      };
    host.SillyTavern = { getContext: () => context };
    host.characters = context.characters;
    host.fetch = vi.fn().mockResolvedValue({ ok: false, status: 404 } as Response);

    const wrapper = mount(App);
    await vi.waitFor(() => expect(wrapper.text()).toContain('0 个匹配项'));

    await wrapper.get('.cm-header-primary').trigger('click');
    await wrapper.get('.cm-import-url input').setValue('https://example.com/missing.png');
    await wrapper.get('.cm-import-url').trigger('submit');

    await vi.waitFor(() => expect(wrapper.findAll('.cm-import-card')).toHaveLength(1));
    expect(wrapper.text()).toContain('解析失败');
    expect(wrapper.text()).toContain('URL 读取失败：HTTP 404');
    expect(wrapper.get('.cm-import-dialog').text()).toContain('URL 读取失败：HTTP 404');
  });

  it('导入弹窗支持 ZIP 批量生成多个候选项', async () => {
    const context = {
      characters: [],
      tags: [],
      tagMap: {},
    };
    const host = window as Window &
      typeof globalThis & {
        SillyTavern?: unknown;
        characters?: unknown[];
      };
    host.SillyTavern = { getContext: () => context };
    host.characters = context.characters;

    const wrapper = mount(App);
    await vi.waitFor(() => expect(wrapper.text()).toContain('0 个匹配项'));

    await wrapper.get('.cm-header-primary').trigger('click');
    const zipBytes = zipSync({
      '角色A.json': new TextEncoder().encode(JSON.stringify({ data: { name: '角色A', first_mes: '你好 A' } })),
      'nested/角色B.json': new TextEncoder().encode(JSON.stringify({ data: { name: '角色B', first_mes: '你好 B' } })),
      'note.md': new TextEncoder().encode('忽略'),
    });
    const file = new File([zipBytes], '合集.zip', { type: 'application/zip' });
    Object.defineProperty(wrapper.get('.cm-file-button input').element, 'files', {
      value: [file],
      configurable: true,
    });
    await wrapper.get('.cm-file-button input').trigger('change');

    await vi.waitFor(() => expect(wrapper.findAll('.cm-import-card')).toHaveLength(2));
    expect(wrapper.text()).toContain('角色A');
    expect(wrapper.text()).toContain('角色B');
    expect(wrapper.text()).not.toContain('note.md');
    expect(wrapper.get('.cm-import-dialog').text()).toContain('新增');
    expect(wrapper.get('.cm-import-dialog').text()).not.toContain('结果：角色B');
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
    await tagButtons().find(button => button.text().includes('开放世界'))?.trigger('click');
    expect(wrapper.text()).toContain('2 个匹配项');
    expect(wrapper.get('button[title="清空已选标签"]').attributes('disabled')).toBeUndefined();
    await tagButtons().find(button => button.text().includes('日本'))?.trigger('click');
    expect(wrapper.text()).toContain('2 个匹配项');
    await wrapper.get('button[title="清空已选标签"]').trigger('click');
    expect(wrapper.text()).toContain('3 个匹配项');
    expect(wrapper.get('button[title="清空已选标签"]').attributes('disabled')).toBeDefined();

    await tagButtons().find(button => button.text().includes('日本'))?.trigger('click');

    await wrapper.get('button[title="设置"]').trigger('click');
    expect(wrapper.text()).toContain('标签过滤逻辑');
    await wrapper.findAll('.cm-segmented button')[1].trigger('click');
    await tagButtons().find(button => button.text().includes('开放世界'))?.trigger('click');
    expect(wrapper.text()).toContain('3 个匹配项');
    await wrapper.findAll('.cm-segmented button')[2].trigger('click');
    expect(wrapper.text()).toContain('1 个匹配项');

    await tagButtons().find(button => button.text().includes('日本'))?.trigger('click');
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
    expect(wrapper.find('.cm-tag-filter').text()).toContain('收藏');
    expect(wrapper.find('.cm-tag-filter').text()).toContain('无标签');
    expect(wrapper.find('.cm-tag-filter').text()).toContain('待整理');
    expect(wrapper.find('.cm-tag-filter i').exists()).toBe(false);

    const tagButtons = () => wrapper.findAll('.cm-tag-filter > button');
    await tagButtons().find(button => button.text().includes('无标签'))?.trigger('click');
    expect(wrapper.text()).toContain('1 个匹配项');
    await tagButtons().find(button => button.text().includes('待整理'))?.trigger('click');
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

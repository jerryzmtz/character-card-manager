import {
  attachTagsToCharacters,
  buildUpdatedTagState,
  getUnknownTagIds,
  normalizeTagMap,
  normalizeTavernTags,
  previewTagMutation,
} from './tags';
import type {
  CharacterDetail,
  CharacterIssue,
  CharacterListState,
  CharacterSummary,
  CharacterTag,
  TagMutationDraft,
  TagMutationResult,
} from './types';

type HostWindow = Window &
  typeof globalThis & {
    SillyTavern?: {
      getContext?: () => TavernContext;
    };
    characters?: TavernCharacter[];
    getCharacters?: () => Promise<unknown> | unknown;
    getThumbnailUrl?: (type: string, file: string) => string;
  };

interface TavernContext {
  characters?: TavernCharacter[];
  getCharacters?: () => Promise<unknown> | unknown;
  tags?: unknown[];
  tagMap?: Record<string, string[]>;
  saveSettingsDebounced?: () => Promise<unknown> | unknown;
}

interface TavernCharacter {
  avatar?: string;
  file_name?: string;
  fileName?: string;
  name?: string;
  fav?: boolean;
  date_added?: number | string;
  create_date?: number | string;
  date_last_chat?: number | string;
  last_chat?: number | string;
  creator?: string;
  desc?: string;
  firstMes?: string;
  altGreetings?: string[];
  tokens?: number;
  data?: Record<string, any>;
  character_book?: string | { name?: string };
  character_version?: string;
  tags?: string[];
}

interface CharacterApiResponse {
  data?: Record<string, any>;
  tokens?: number;
  character_book?: string | { name?: string };
}

export function getHostWindow(): HostWindow {
  try {
    if (window.parent && window.parent !== window) {
      return window.parent as HostWindow;
    }
  } catch {
    return window as HostWindow;
  }
  return window as HostWindow;
}

export async function readCharacterList(host: HostWindow = getHostWindow()): Promise<CharacterListState> {
  const issues: CharacterIssue[] = [];
  const context = getContext(host);
  const tagState = readTavernTags(host);

  try {
    const refresh = context?.getCharacters || host.getCharacters;
    if (typeof refresh === 'function') {
      await refresh.call(context || host);
    }
  } catch (error) {
    issues.push({ level: 'warning', message: `刷新角色列表失败：${formatError(error)}` });
  }

  const source = context?.characters || host.characters;
  if (!Array.isArray(source)) {
    return {
      characters: [],
      tags: tagState.tags,
      tagMap: tagState.tagMap,
      issues: [{ level: 'error', message: '无法读取 SillyTavern 角色列表，请确认酒馆已加载完成。' }, ...issues],
    };
  }

  const characters = source.map(character => normalizeSummary(character, host)).filter(Boolean);
  return {
    characters: attachTagsToCharacters(characters, tagState.tags, tagState.tagMap),
    tags: tagState.tags,
    tagMap: tagState.tagMap,
    issues: [...issues, ...tagState.issues],
  };
}

export function readTavernTags(host: HostWindow = getHostWindow()): {
  tags: CharacterTag[];
  tagMap: Record<string, string[]>;
  issues: CharacterIssue[];
} {
  const issues: CharacterIssue[] = [];
  const context = getContext(host);
  if (!context) {
    return { tags: [], tagMap: {}, issues: [{ level: 'warning', message: '无法读取酒馆标签上下文，标签功能暂不可用。' }] };
  }

  if (!Array.isArray(context.tags)) {
    issues.push({ level: 'warning', message: '无法读取酒馆标签列表，标签筛选和写入暂不可用。' });
  }
  if (!context.tagMap || typeof context.tagMap !== 'object') {
    issues.push({ level: 'warning', message: '无法读取酒馆标签绑定，标签筛选和写入暂不可用。' });
  }

  const tags = normalizeTavernTags(context.tags);
  const tagMap = normalizeTagMap(context.tagMap);
  const unknownTagIds = getUnknownTagIds(tags, tagMap);
  if (unknownTagIds.length > 0) {
    issues.push({ level: 'warning', message: `发现 ${unknownTagIds.length} 个未知标签绑定，已在列表中忽略。` });
  }

  return { tags, tagMap, issues };
}

export async function applyTagMutation(
  draft: TagMutationDraft,
  host: HostWindow = getHostWindow(),
): Promise<TagMutationResult> {
  const context = getContext(host);
  const current = readTavernTags(host);
  const preview = previewTagMutation(current.tags, current.tagMap, draft);

  if (!context || !Array.isArray(context.tags) || !context.tagMap || typeof context.tagMap !== 'object') {
    return {
      success: false,
      message: '酒馆标签上下文不可用，无法保存标签变更。',
      preview,
      tags: current.tags,
      tagMap: current.tagMap,
    };
  }

  if (preview.errors.length > 0) {
    return {
      success: false,
      message: preview.errors.join(' '),
      preview,
      tags: current.tags,
      tagMap: current.tagMap,
    };
  }

  const updated = buildUpdatedTagState(current.tags, current.tagMap, preview);
  context.tags.splice(0, context.tags.length, ...updated.tags);
  Object.keys(context.tagMap).forEach(fileName => {
    delete context.tagMap![fileName];
  });
  Object.entries(updated.tagMap).forEach(([fileName, ids]) => {
    context.tagMap![fileName] = ids;
  });

  try {
    await context.saveSettingsDebounced?.();
  } catch (error) {
    return {
      success: false,
      message: `标签保存失败：${formatError(error)}`,
      preview,
      tags: updated.tags,
      tagMap: updated.tagMap,
    };
  }

  return {
    success: true,
    message: `已更新 ${preview.changedFileNames.length} 个角色的标签。`,
    preview,
    tags: updated.tags,
    tagMap: updated.tagMap,
  };
}

export async function readCharacterDetail(
  fileName: string,
  base?: CharacterSummary,
  host: HostWindow = getHostWindow(),
): Promise<CharacterDetail> {
  try {
    const response = await host.fetch('/api/characters/get', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatar_url: fileName }),
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = (await response.json()) as CharacterApiResponse;
    const data = payload.data || payload;
    return normalizeDetail(fileName, data, payload, base, host);
  } catch (error) {
    return {
      ...(base || normalizeSummary({ avatar: fileName }, host)),
      description: '',
      personality: '',
      scenario: '',
      first_mes: '',
      alternate_greetings: [],
      mes_example: '',
      system_prompt: '',
      creator_notes: '',
      post_history_instructions: '',
      detailLoaded: false,
      readError: formatError(error),
      issues: [...(base?.issues || []), { level: 'error', message: `详情读取失败：${formatError(error)}` }],
    };
  }
}

export async function loadCharacterOriginalImage(fileName: string, host: HostWindow = getHostWindow()): Promise<string> {
  if (!fileName || /^(?:https?:|data:|blob:|\/)/i.test(fileName)) return fileName;

  const response = await host.fetch(`/characters/${encodeURIComponent(fileName)}`);
  if (!response.ok) {
    throw new Error(`头像原图读取失败：HTTP ${response.status}`);
  }

  return URL.createObjectURL(await response.blob());
}

export function normalizeSummary(raw: TavernCharacter, host: HostWindow = getHostWindow()): CharacterSummary {
  const fileName = raw.avatar || raw.file_name || raw.fileName || '';
  const data = raw.data || {};
  const firstMes = stringValue(raw.firstMes || data.first_mes);
  const altGreetings = arrayValue(raw.altGreetings || data.alternate_greetings);
  const characterBook = getBookName(data.character_book || raw.character_book);
  const avatarFallbackUrls = buildAvatarUrls(fileName, host);
  const summary: CharacterSummary = {
    fileName,
    name: stringValue(raw.name || data.name || stripExtension(fileName) || '未命名角色'),
    avatarUrl: avatarFallbackUrls[0] || '',
    avatarFallbackUrls,
    fav: Boolean(raw.fav || data.fav || data.extensions?.fav),
    tagIds: [],
    tags: [],
    date_added: numberValue(raw.date_added || raw.create_date || data.create_date),
    date_last_chat: numberValue(raw.date_last_chat || raw.last_chat),
    creator: stringValue(raw.creator || data.creator),
    character_version: stringValue(raw.character_version || data.character_version),
    character_book: characterBook,
    firstMes,
    altGreetingCount: altGreetings.length,
    tokens: numberValue(raw.tokens),
    desc: stringValue(raw.desc || data.description),
    issues: [],
    detailLoaded: false,
  };
  summary.issues = buildIssues(summary);
  return summary;
}

export function normalizeDetail(
  fileName: string,
  data: Record<string, any>,
  payload: CharacterApiResponse = {},
  base?: CharacterSummary,
  host: HostWindow = getHostWindow(),
): CharacterDetail {
  const summary = normalizeSummary(
    {
      avatar: fileName,
      name: data.name || base?.name,
      fav: base?.fav || data.fav,
      date_added: base?.date_added || data.create_date,
      date_last_chat: base?.date_last_chat,
      creator: data.creator || base?.creator,
      tokens: payload.tokens || data.tokens || base?.tokens,
      data,
      character_book: data.character_book || payload.character_book || base?.character_book,
      character_version: data.character_version || base?.character_version,
    },
    host,
  );
  const detail: CharacterDetail = {
    ...summary,
    tagIds: base?.tagIds || summary.tagIds,
    tags: base?.tags || summary.tags,
    description: stringValue(data.description),
    personality: stringValue(data.personality),
    scenario: stringValue(data.scenario),
    first_mes: stringValue(data.first_mes),
    alternate_greetings: arrayValue(data.alternate_greetings),
    mes_example: stringValue(data.mes_example),
    system_prompt: stringValue(data.system_prompt || data.extensions?.system_prompt),
    creator_notes: stringValue(data.creator_notes || data.creatorcomment),
    post_history_instructions: stringValue(data.post_history_instructions || data.extensions?.post_history_instructions),
    detailLoaded: true,
  };
  detail.issues = buildIssues(detail);
  return detail;
}

export function buildIssues(character: Pick<CharacterSummary, 'firstMes' | 'character_book' | 'fileName'>): CharacterIssue[] {
  const issues: CharacterIssue[] = [];
  if (!character.fileName) {
    issues.push({ level: 'error', message: '缺少角色卡文件名，无法定位头像和详情。' });
  }
  if (!character.firstMes) {
    issues.push({ level: 'warning', message: '缺少主开场白，导入或游玩前建议检查。' });
  }
  if (character.character_book) {
    issues.push({ level: 'info', message: `关联世界书：${character.character_book}` });
  }
  return issues;
}

function getContext(host: HostWindow): TavernContext | undefined {
  try {
    return host.SillyTavern?.getContext?.();
  } catch {
    return undefined;
  }
}

function getBookName(book: unknown): string {
  if (!book) return '';
  if (typeof book === 'string') return book;
  if (typeof book === 'object' && 'name' in book) {
    return stringValue((book as { name?: string }).name);
  }
  return '';
}

function stripExtension(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, '');
}

function buildAvatarUrls(fileName: string, host: HostWindow): string[] {
  if (!fileName) return [];
  if (/^(?:https?:|data:|blob:|\/)/i.test(fileName)) return [fileName];

  const urls = [
    `/characters/${encodeURIComponent(fileName)}`,
    getThumbnailUrl(host, 'avatar', fileName),
    getThumbnailUrl(host, 'character', fileName),
    `/thumbnail?type=avatar&file=${encodeURIComponent(fileName)}`,
    `/thumbnail?type=character&file=${encodeURIComponent(fileName)}`,
  ].filter((url): url is string => Boolean(url));

  return Array.from(new Set(urls));
}

function getThumbnailUrl(host: HostWindow, type: string, fileName: string): string {
  try {
    return stringValue(host.getThumbnailUrl?.(type, fileName));
  } catch {
    return '';
  }
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function numberValue(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function arrayValue(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error || '未知错误');
}

import type { CharacterDetail, CharacterIssue, CharacterListState, CharacterSummary } from './types';

type HostWindow = Window &
  typeof globalThis & {
    SillyTavern?: {
      getContext?: () => TavernContext;
    };
    characters?: TavernCharacter[];
    getCharacters?: () => Promise<unknown> | unknown;
  };

interface TavernContext {
  characters?: TavernCharacter[];
  getCharacters?: () => Promise<unknown> | unknown;
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
      issues: [{ level: 'error', message: '无法读取 SillyTavern 角色列表，请确认酒馆已加载完成。' }, ...issues],
    };
  }

  return {
    characters: source.map(normalizeSummary).filter(Boolean),
    issues,
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
    return normalizeDetail(fileName, data, payload, base);
  } catch (error) {
    return {
      ...(base || normalizeSummary({ avatar: fileName })),
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

export function normalizeSummary(raw: TavernCharacter): CharacterSummary {
  const fileName = raw.avatar || raw.file_name || raw.fileName || '';
  const data = raw.data || {};
  const firstMes = stringValue(raw.firstMes || data.first_mes);
  const altGreetings = arrayValue(raw.altGreetings || data.alternate_greetings);
  const characterBook = getBookName(data.character_book || raw.character_book);
  const summary: CharacterSummary = {
    fileName,
    name: stringValue(raw.name || data.name || stripExtension(fileName) || '未命名角色'),
    avatarUrl: fileName ? `/characters/${encodeURIComponent(fileName)}` : '',
    fav: Boolean(raw.fav || data.fav || data.extensions?.fav),
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
): CharacterDetail {
  const summary = normalizeSummary({
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
  });
  const detail: CharacterDetail = {
    ...summary,
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

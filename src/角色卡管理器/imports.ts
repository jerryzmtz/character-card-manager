import { unzipSync } from 'fflate';
import { normalizeSummary } from './host';
import type {
  CharacterDetail,
  CharacterImportCandidate,
  CharacterImportDiffGroup,
  CharacterImportDiffRow,
  CharacterImportFormat,
  CharacterImportParseInput,
  CharacterImportSourceFormat,
  CharacterIssue,
  CharacterSummary,
  CharacterTag,
} from './types';

const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];
const TEXT_DECODER = new TextDecoder('utf-8');
const TEXT_ENCODER = new TextEncoder();
const CARD_TEXT_KEYS = new Set(['chara', 'ccv2', 'ccv3']);

const GAMEPLAY_FIELDS = [
  ['description', '描述'],
  ['personality', '性格'],
  ['scenario', '场景'],
  ['first_mes', '开场白'],
  ['alternate_greetings', '备选开场'],
  ['mes_example', '示例对话'],
  ['system_prompt', '系统提示'],
  ['post_history_instructions', '历史后指令'],
  ['character_book', '世界书'],
] as const;

const META_FIELDS = [
  ['creator', '作者'],
  ['character_version', '版本'],
  ['creator_notes', '作者备注'],
] as const;

const PRESERVED_EXTENSION_KEYS = ['source', 'source_url', 'url', 'fav', 'talkativeness', 'depth_prompt'];
const EXTENSION_FIELD_LABELS: Record<string, string> = {
  source: '来源',
  source_url: '来源 URL',
  url: '来源 URL',
  fav: '收藏状态',
  talkativeness: '发言倾向',
  depth_prompt: '深度提示',
};

interface ParsedCard {
  format: CharacterImportFormat;
  raw: Record<string, any>;
  card: Record<string, any>;
}

export async function fetchImportSource(url: string): Promise<CharacterImportParseInput> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`URL 读取失败：HTTP ${response.status}`);
  }

  const blob = await response.blob();
  return {
    sourceKind: 'url',
    sourceName: getFileNameFromResponse(response, url),
    blob,
    contentType: response.headers.get('content-type') || blob.type,
  };
}

export async function expandImportSources(input: CharacterImportParseInput): Promise<CharacterImportParseInput[]> {
  const format = inferSourceFormatSafe(input.sourceName, input.contentType || input.blob.type);
  if (format !== 'zip') return [input];

  const files = unzipSync(new Uint8Array(await input.blob.arrayBuffer()));
  const sources = Object.entries(files)
    .filter(([name]) => /\.(?:json|png)$/i.test(name))
    .map(([name, bytes]) => ({
      sourceKind: input.sourceKind,
      sourceName: `${input.sourceName} / ${name}`,
      blob: new Blob([bytes], { type: inferContentType(name) }),
      contentType: inferContentType(name),
    }));
  if (sources.length === 0) {
    throw new Error('ZIP 中没有找到 JSON 或 PNG 角色卡。');
  }
  return sources;
}

export async function parseImportSource(input: CharacterImportParseInput): Promise<ParsedCard> {
  const format = inferFormat(input.sourceName, input.contentType || input.blob.type);
  if (format === 'json') {
    return parseJsonCard(input.blob);
  }
  return parsePngCard(input.blob);
}

export async function buildImportCandidate(
  input: CharacterImportParseInput,
  characters: CharacterSummary[],
  tags: CharacterTag[],
  tagMap: Record<string, string[]>,
  readExistingDetail: (fileName: string, base?: CharacterSummary) => Promise<CharacterDetail>,
): Promise<CharacterImportCandidate> {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  try {
    const parsed = await parseImportSource(input);
    const sourceFileName = ensureCharacterFileName(input.sourceName, parsed.format);
    const summary = normalizeSummary({ avatar: sourceFileName, name: stringValue(parsed.card.name), data: parsed.card });
    const match = characters.find(character => character.fileName === sourceFileName);
    const nameConflict = match
      ? undefined
      : characters.find(character => normalizeName(character.name) === normalizeName(summary.name));
    const existingDetail = match ? await readExistingDetail(match.fileName, match) : undefined;
    const mergedRaw = mergeImportRaw(parsed.raw, existingDetail, match, tagMap);
    const importBlob = buildImportBlob(mergedRaw, input.blob, parsed.format);
    const issues: CharacterIssue[] = [];

    if (nameConflict) {
      issues.push({
        level: 'warning',
        message: `已有同名角色“${nameConflict.name}”，但文件名不同，将按新增处理。`,
      });
    }

    const candidate: CharacterImportCandidate = {
      id,
      sourceKind: input.sourceKind,
      sourceName: input.sourceName,
      fileName: sourceFileName,
      format: parsed.format,
      blob: input.blob,
      raw: parsed.raw,
      card: parsed.card,
      summary: {
        ...summary,
        tagIds: match?.tagIds || [],
        tags: match?.tags || [],
      },
      action: match ? 'update' : 'create',
      status: 'ready',
      issues,
      nameConflict,
      match,
      existingDetail,
      mergedRaw,
      importBlob,
      diff: buildImportDiff(parsed.card, mergedRaw, existingDetail, match, tags, tagMap),
    };

    return candidate;
  } catch (error) {
    return buildErrorCandidate(id, input, formatError(error));
  }
}

export function canApplyImport(candidates: CharacterImportCandidate[]): boolean {
  return candidates.length > 0 && candidates.every(candidate => candidate.status !== 'error');
}

export function buildImportDiff(
  newCard: Record<string, any>,
  mergedRaw: Record<string, any>,
  existingDetail: CharacterDetail | undefined,
  match: CharacterSummary | undefined,
  tags: CharacterTag[],
  tagMap: Record<string, string[]>,
): CharacterImportDiffGroup[] {
  const mergedCard = getCardData(mergedRaw);
  const identityRows: CharacterImportDiffRow[] = [
    diffRow('名称', existingDetail?.name || match?.name, newCard.name, mergedCard.name),
    diffRow('文件名', match?.fileName, match?.fileName || '', match?.fileName || ''),
    diffRow('作者', existingDetail?.creator || match?.creator, newCard.creator, mergedCard.creator),
    diffRow('版本', existingDetail?.character_version || match?.character_version, newCard.character_version, mergedCard.character_version),
  ];
  const gameplayRows = GAMEPLAY_FIELDS.map(([key, label]) =>
    diffRow(label, getCardField(existingDetail, key), newCard[key], mergedCard[key]),
  );
  const metaRows = META_FIELDS.map(([key, label]) =>
    diffRow(label, getCardField(existingDetail, key), newCard[key], mergedCard[key]),
  );
  const extensionRows = PRESERVED_EXTENSION_KEYS.map(key =>
    diffRow(
      EXTENSION_FIELD_LABELS[key] || `扩展：${key}`,
      existingDetail ? getExtensionValue(existingDetail, key) : '',
      getExtensionValue(newCard, key),
      getExtensionValue(mergedCard, key),
      true,
    ),
  ).filter(row => row.oldValue || row.newValue || row.finalValue);
  const preservedTags = match ? getPreservedTagNames(match.fileName, tags, tagMap) : '';

  return [
    { id: 'identity', title: '身份', rows: identityRows },
    { id: 'gameplay', title: '游玩内容', rows: gameplayRows },
    {
      id: 'metadata',
      title: '元数据与保留项',
      rows: [
        ...metaRows,
        ...extensionRows,
        diffRow('标签', preservedTags, match ? preservedTags : '', match ? preservedTags || '无' : '新增卡不继承标签', Boolean(match)),
      ],
    },
  ];
}

function parseJsonCard(blob: Blob): Promise<ParsedCard> {
  return blob.text().then(text => {
    const raw = JSON.parse(text) as Record<string, any>;
    return { format: 'json', raw, card: getCardData(raw) };
  });
}

async function parsePngCard(blob: Blob): Promise<ParsedCard> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  if (!PNG_SIGNATURE.every((byte, index) => bytes[index] === byte)) {
    throw new Error('PNG 文件头无效。');
  }

  let offset = PNG_SIGNATURE.length;
  while (offset + 12 <= bytes.length) {
    const length = readUint32(bytes, offset);
    const type = TEXT_DECODER.decode(bytes.slice(offset + 4, offset + 8));
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    if (dataEnd > bytes.length) break;

    const text = readPngText(type, bytes.slice(dataStart, dataEnd));
    if (text) {
      const separator = text.indexOf('\0');
      const key = (separator >= 0 ? text.slice(0, separator) : '').toLowerCase();
      const value = separator >= 0 ? text.slice(separator + 1) : text;
      if (CARD_TEXT_KEYS.has(key)) {
        const raw = JSON.parse(decodeBase64Utf8(value)) as Record<string, any>;
        return { format: 'png', raw, card: getCardData(raw) };
      }
    }

    offset = dataEnd + 4;
  }

  throw new Error('没有在 PNG 中找到角色卡数据。');
}

function readPngText(type: string, data: Uint8Array): string {
  if (type === 'tEXt') return TEXT_DECODER.decode(data);
  if (type !== 'iTXt') return '';

  const keywordEnd = data.indexOf(0);
  if (keywordEnd < 0 || keywordEnd + 5 >= data.length) return '';
  const compressionFlag = data[keywordEnd + 1];
  if (compressionFlag !== 0) return '';

  let cursor = keywordEnd + 3;
  for (let index = 0; index < 2; index += 1) {
    const end = data.indexOf(0, cursor);
    if (end < 0) return '';
    cursor = end + 1;
  }
  return `${TEXT_DECODER.decode(data.slice(0, keywordEnd))}\0${TEXT_DECODER.decode(data.slice(cursor))}`;
}

function getCardData(raw: Record<string, any>): Record<string, any> {
  const data = isRecord(raw.data) ? raw.data : raw;
  return {
    ...data,
    name: stringValue(data.name || raw.name),
    description: stringValue(data.description || raw.description || raw.desc),
    personality: stringValue(data.personality || raw.personality),
    scenario: stringValue(data.scenario || raw.scenario),
    first_mes: stringValue(data.first_mes || raw.first_mes || raw.firstMes),
    alternate_greetings: arrayValue(data.alternate_greetings || raw.alternate_greetings || raw.altGreetings),
    mes_example: stringValue(data.mes_example || raw.mes_example),
    creator: stringValue(data.creator || raw.creator),
    character_version: stringValue(data.character_version || raw.character_version),
    character_book: data.character_book || raw.character_book || '',
    creator_notes: stringValue(data.creator_notes || data.creatorcomment || raw.creator_notes),
    system_prompt: stringValue(data.system_prompt || data.extensions?.system_prompt || raw.system_prompt),
    post_history_instructions: stringValue(
      data.post_history_instructions || data.extensions?.post_history_instructions || raw.post_history_instructions,
    ),
    extensions: isRecord(data.extensions) ? data.extensions : {},
  };
}

function mergeImportRaw(
  newRaw: Record<string, any>,
  existingDetail: CharacterDetail | undefined,
  match: CharacterSummary | undefined,
  tagMap: Record<string, string[]>,
): Record<string, any> {
  if (!existingDetail && !match) return newRaw;

  const nextRaw = cloneRecord(newRaw);
  const nextData = getWritableCardData(nextRaw);
  const nextExtensions = isRecord(nextData.extensions) ? { ...nextData.extensions } : {};
  const oldExtensions = getExistingExtensions(existingDetail);

  Object.entries(oldExtensions).forEach(([key, value]) => {
    if (nextExtensions[key] === undefined || nextExtensions[key] === '' || nextExtensions[key] === null) {
      nextExtensions[key] = value;
    }
  });
  mergeSourceUrlExtension(nextExtensions, existingDetail?.sourceUrl);

  if (existingDetail?.fav && nextData.fav === undefined) nextData.fav = existingDetail.fav;
  if (existingDetail?.fav && nextExtensions.fav === undefined) nextExtensions.fav = existingDetail.fav;
  if (match?.date_added && nextData.create_date === undefined) nextData.create_date = match.date_added;
  if (match?.fileName && tagMap[match.fileName]?.length) nextExtensions.tags_preserved_by_manager = true;

  nextData.extensions = nextExtensions;
  return nextRaw;
}

function getWritableCardData(raw: Record<string, any>): Record<string, any> {
  if (isRecord(raw.data)) return raw.data;
  return raw;
}

function buildImportBlob(raw: Record<string, any>, originalBlob: Blob, format: CharacterImportFormat): Blob {
  if (format === 'png') return originalBlob;
  return new Blob([JSON.stringify(raw, null, 2)], { type: 'application/json;charset=utf-8' });
}

function buildErrorCandidate(id: string, input: CharacterImportParseInput, message: string): CharacterImportCandidate {
  const fallbackName = ensureCharacterFileName(input.sourceName || '无法解析.json', inferFormatSafe(input.sourceName, input.contentType));
  const summary = normalizeSummary({ avatar: fallbackName, name: input.sourceName || '无法解析' });
  return {
    id,
    sourceKind: input.sourceKind,
    sourceName: input.sourceName,
    fileName: fallbackName,
    format: inferFormatSafe(input.sourceName, input.contentType),
    blob: input.blob,
    raw: {},
    card: {},
    summary,
    action: 'create',
    status: 'error',
    issues: [{ level: 'error', message }],
    mergedRaw: {},
    importBlob: input.blob,
    diff: [],
    resultMessage: message,
  };
}

function inferFormat(fileName: string, contentType = ''): CharacterImportFormat {
  const lowerName = fileName.toLowerCase();
  const lowerType = contentType.toLowerCase();
  if (lowerName.endsWith('.json') || lowerType.includes('json')) return 'json';
  if (lowerName.endsWith('.png') || lowerType.includes('png')) return 'png';
  throw new Error('只支持 JSON 或 PNG 角色卡。');
}

function inferSourceFormat(fileName: string, contentType = ''): CharacterImportSourceFormat {
  const lowerName = fileName.toLowerCase();
  const lowerType = contentType.toLowerCase();
  if (lowerName.endsWith('.zip') || lowerType.includes('zip')) return 'zip';
  return inferFormat(fileName, contentType);
}

function inferSourceFormatSafe(fileName: string, contentType = ''): CharacterImportSourceFormat {
  try {
    return inferSourceFormat(fileName, contentType);
  } catch {
    return 'json';
  }
}

function inferContentType(fileName: string): string {
  const lowerName = fileName.toLowerCase();
  if (lowerName.endsWith('.png')) return 'image/png';
  if (lowerName.endsWith('.zip')) return 'application/zip';
  return 'application/json';
}

function inferFormatSafe(fileName: string, contentType = ''): CharacterImportFormat {
  try {
    return inferFormat(fileName, contentType);
  } catch {
    return 'json';
  }
}

function ensureCharacterFileName(sourceName: string, format: CharacterImportFormat): string {
  const fallback = format === 'png' ? '未命名角色.png' : '未命名角色.json';
  const safeName = sourceName.split(/[\\/]/).pop() || fallback;
  if (/\.(?:json|png)$/i.test(safeName)) return safeName;
  return `${safeName}.${format}`;
}

function getFileNameFromResponse(response: Response, url: string): string {
  const disposition = response.headers.get('content-disposition') || '';
  const match = disposition.match(/filename\*?=(?:UTF-8''|")?([^";]+)/i);
  if (match?.[1]) return decodeURIComponent(match[1].replace(/"$/u, ''));

  try {
    const path = new URL(url).pathname;
    return decodeURIComponent(path.split('/').pop() || 'url-角色卡.json');
  } catch {
    return 'url-角色卡.json';
  }
}

function diffRow(label: string, oldValue: unknown, newValue: unknown, finalValue: unknown, preserved = false): CharacterImportDiffRow {
  const oldText = displayValue(oldValue, label);
  const newText = displayValue(newValue, label);
  const finalText = displayValue(finalValue, label);
  return {
    label,
    oldValue: oldText,
    newValue: newText,
    finalValue: finalText,
    changed: oldText !== finalText,
    preserved: preserved && Boolean(oldText) && oldText === finalText && oldText !== newText,
  };
}

function getCardField(detail: CharacterDetail | undefined, key: string): unknown {
  if (!detail) return '';
  if (key === 'character_book') return detail.character_book;
  return (detail as unknown as Record<string, unknown>)[key] || '';
}

function getExtensionValue(card: Record<string, any>, key: string): unknown {
  if (!isRecord(card.extensions)) return '';
  if (key === 'source_url') {
    return getSourceUrlFromExtensions(card.extensions);
  }
  return card.extensions[key];
}

function getExistingExtensions(detail: CharacterDetail | undefined): Record<string, any> {
  if (!detail) return {};
  return {
    source_url: detail.sourceUrl || undefined,
    source_link: detail.sourceUrl || undefined,
    fav: detail.fav || undefined,
  };
}

function mergeSourceUrlExtension(extensions: Record<string, any>, existingSourceUrl = ''): void {
  const sourceUrl = getSourceUrlFromExtensions(extensions) || existingSourceUrl;
  if (!sourceUrl) return;
  if (extensions.source_url === undefined || extensions.source_url === '' || extensions.source_url === null) {
    extensions.source_url = sourceUrl;
  }
  if (extensions.source_link === undefined || extensions.source_link === '' || extensions.source_link === null) {
    extensions.source_link = sourceUrl;
  }
}

function getSourceUrlFromExtensions(extensions: Record<string, any>): string {
  return stringValue(extensions.source_url || extensions.source_link || extensions.url || extensions.source);
}

function getPreservedTagNames(fileName: string, tags: CharacterTag[], tagMap: Record<string, string[]>): string {
  const ids = tagMap[fileName] || [];
  return ids
    .map(id => tags.find(tag => tag.id === id)?.name)
    .filter((name): name is string => Boolean(name))
    .join('、');
}

function readUint32(bytes: Uint8Array, offset: number): number {
  return ((bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]) >>> 0;
}

function decodeBase64Utf8(value: string): string {
  const binary = atob(value.trim());
  const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
  return TEXT_DECODER.decode(bytes);
}

function displayValue(value: unknown, label = ''): string {
  if (label === '世界书') return displayWorldBookValue(value);
  if (label === '深度提示') return displayDepthPromptValue(value);
  if (Array.isArray(value)) return value.length ? `${value.length} 条` : '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (isRecord(value)) return Object.keys(value).length ? JSON.stringify(value) : '';
  return '';
}

function displayWorldBookValue(value: unknown): string {
  if (typeof value === 'string') return value;
  if (!isRecord(value)) return '';

  const entries = Array.isArray(value.entries) ? value.entries : [];
  const name = stringValue(value.name) || stringValue(value.comment) || stringValue(entries.find(isRecord)?.comment);
  if (name && entries.length > 0) return `${name}（${entries.length} 条）`;
  if (name) return name;
  return entries.length > 0 ? `内嵌世界书（${entries.length} 条）` : '';
}

function displayDepthPromptValue(value: unknown): string {
  if (typeof value === 'string') return value;
  if (!isRecord(value)) return '';

  const prompt = stringValue(value.prompt).trim();
  if (!prompt) return '';

  const details = [
    typeof value.depth === 'number' ? `深度 ${value.depth}` : '',
    stringValue(value.role),
  ].filter(Boolean);
  return details.length > 0 ? `${prompt}（${details.join('，')}）` : prompt;
}

function normalizeName(name: string): string {
  return name.trim().toLocaleLowerCase();
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function arrayValue(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function isRecord(value: unknown): value is Record<string, any> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function cloneRecord(value: Record<string, any>): Record<string, any> {
  return JSON.parse(JSON.stringify(value)) as Record<string, any>;
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error || '未知错误');
}

export function encodePngTextChunkForTest(key: string, value: string): Uint8Array {
  const payload = TEXT_ENCODER.encode(`${key}\0${value}`);
  const bytes = new Uint8Array(PNG_SIGNATURE.length + 12 + payload.length + 12);
  bytes.set(PNG_SIGNATURE, 0);
  writeUint32(bytes, PNG_SIGNATURE.length, payload.length);
  bytes.set(TEXT_ENCODER.encode('tEXt'), PNG_SIGNATURE.length + 4);
  bytes.set(payload, PNG_SIGNATURE.length + 8);
  const nextOffset = PNG_SIGNATURE.length + 12 + payload.length;
  writeUint32(bytes, nextOffset, 0);
  bytes.set(TEXT_ENCODER.encode('IEND'), nextOffset + 4);
  return bytes;
}

function writeUint32(bytes: Uint8Array, offset: number, value: number) {
  bytes[offset] = (value >>> 24) & 0xff;
  bytes[offset + 1] = (value >>> 16) & 0xff;
  bytes[offset + 2] = (value >>> 8) & 0xff;
  bytes[offset + 3] = value & 0xff;
}

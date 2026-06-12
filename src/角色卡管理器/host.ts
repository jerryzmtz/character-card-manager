import { zipSync } from 'fflate';
import {
  attachTagsToCharacters,
  buildUpdatedTagState,
  getUnknownTagIds,
  normalizeTagMap,
  normalizeTavernTags,
  previewTagMutation,
} from './tags';
import type {
  CharacterChatSummary,
  CharacterChatContent,
  CharacterDeleteApplyResult,
  CharacterDeleteOptions,
  CharacterDeletePreview,
  CharacterDeleteTarget,
  CharacterDetail,
  CharacterExportResult,
  CharacterFavoriteMutationResult,
  CharacterImportApplyResult,
  CharacterImportCandidate,
  CharacterIssue,
  CharacterListState,
  CharacterRenamePreview,
  CharacterRenameResult,
  CharacterSourceUrlMutationResult,
  CharacterSummary,
  CharacterTag,
  CharacterWorldBookLink,
  CharacterZipExportResult,
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
    getChatHistoryBrief?: (fileName: string) => Promise<unknown> | unknown;
    getThumbnailUrl?: (type: string, file: string) => string;
    importRawCharacter?: (filename: string, content: Blob) => Promise<Response>;
    this_chid?: number | string;
    loadCharacter?: (id: number | string) => Promise<unknown> | unknown;
    jQuery?: (element: Element) => { trigger?: (eventName: string) => unknown };
    TavernHelper?: {
      importRawCharacter?: (filename: string, content: Blob) => Promise<Response>;
      openCharacterChat?: (chatId: string) => Promise<unknown> | unknown;
      launchChat?: (character: string | { fileName?: string; avatar?: string }, chatId?: string) => Promise<unknown> | unknown;
    };
    openCharacterChat?: (chatId: string) => Promise<unknown> | unknown;
    launchChat?: (character: string | { fileName?: string; avatar?: string }, chatId?: string) => Promise<unknown> | unknown;
  };

interface TavernContext {
  characters?: TavernCharacter[];
  getCharacters?: () => Promise<unknown> | unknown;
  tags?: unknown[];
  tagMap?: Record<string, string[]>;
  saveSettingsDebounced?: () => Promise<unknown> | unknown;
  openCharacterChat?: (chatId: string) => Promise<unknown> | unknown;
  selectCharacterById?: (id: number | string, options?: { switchMenu?: boolean }) => Promise<unknown> | unknown;
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

interface ChatApiResponse {
  chats?: unknown[];
  data?: unknown[];
}

interface RenameApiResponse {
  avatar?: string;
}

const LEGACY_META_DB_NAME = 'CharManagerDB';
const LEGACY_META_DB_STORE = 'cache';
const LEGACY_META_DB_VERSION = 1;
const LEGACY_META_KEY = 'cm_char_meta';

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

  const legacyMeta = await readLegacyCharMetaMap(host);
  const characters = source
    .map(character => normalizeSummary(character, host, legacyMeta[getCharacterFileName(character)]))
    .filter(Boolean);
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

  if (!isWritableTagContext(context)) {
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
  replaceTagMap(context.tagMap, updated.tagMap);

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

export async function applyFavoriteMutation(
  fileName: string,
  nextFav: boolean,
  host: HostWindow = getHostWindow(),
): Promise<CharacterFavoriteMutationResult> {
  const target = findHostCharacter(fileName, host);
  const previous = snapshotFavorite(target);
  writeFavoriteToMemory(target, nextFav);

  try {
    const response = await host.fetch('/api/characters/merge-attributes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        avatar: fileName,
        fav: nextFav,
        data: {
          extensions: {
            fav: nextFav,
          },
        },
      }),
    });
    if (!response.ok) {
      throw new Error(await getResponseError(response, '收藏写入失败'));
    }

    return {
      success: true,
      message: nextFav ? '已收藏。' : '已取消收藏。',
      fileName,
      fav: nextFav,
    };
  } catch (error) {
    restoreFavorite(target, previous);
    return {
      success: false,
      message: `收藏写入失败：${formatError(error)}`,
      fileName,
      fav: previous.fav,
    };
  }
}

export async function applySourceUrlMutation(
  fileName: string,
  sourceUrl: string,
  host: HostWindow = getHostWindow(),
): Promise<CharacterSourceUrlMutationResult> {
  const nextSourceUrl = sourceUrl.trim();
  const target = findHostCharacter(fileName, host);
  const previous = snapshotCharacterData(target);
  writeSourceUrlToMemory(target, nextSourceUrl);

  try {
    const response = await host.fetch('/api/characters/merge-attributes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        avatar: fileName,
        data: {
          source_url: nextSourceUrl,
          extensions: {
            source_url: nextSourceUrl,
            source_link: nextSourceUrl,
          },
        },
      }),
    });
    if (!response.ok) {
      throw new Error(await getResponseError(response, '来源 URL 保存失败'));
    }
    await writeLegacySourceUrl(fileName, nextSourceUrl, host);

    return {
      success: true,
      message: nextSourceUrl ? '来源 URL 已保存。' : '来源 URL 已清除。',
      fileName,
      sourceUrl: nextSourceUrl,
    };
  } catch (error) {
    restoreCharacterData(target, previous);
    return {
      success: false,
      message: `来源 URL 保存失败：${formatError(error)}`,
      fileName,
      sourceUrl: getSourceUrl(target?.data || {}),
    };
  }
}

export function previewCharacterRename(
  character: Pick<CharacterSummary, 'fileName' | 'name' | 'tagIds'>,
  inputName: string,
  characters: Pick<CharacterSummary, 'fileName'>[],
): CharacterRenamePreview {
  const sanitizedName = sanitizeCharacterName(inputName);
  const extension = getFileExtension(character.fileName) || '.png';
  const targetFileName = sanitizedName ? `${sanitizedName}${extension}` : '';
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!inputName.trim()) {
    errors.push('请输入新名称。');
  }
  if (!sanitizedName) {
    errors.push('名称不能只包含非法字符。');
  }
  if (inputName.trim() && sanitizedName !== inputName.trim()) {
    warnings.push(`名称包含不安全字符，将修正为“${sanitizedName}”。`);
  }
  if (sanitizedName && sanitizedName === character.name) {
    errors.push('名称没有变化。');
  }
  if (
    targetFileName &&
    characters.some(
      item => item.fileName !== character.fileName && item.fileName.toLocaleLowerCase('zh-CN') === targetFileName.toLocaleLowerCase('zh-CN'),
    )
  ) {
    errors.push(`已存在文件名为“${targetFileName}”的角色。`);
  }

  return {
    oldFileName: character.fileName,
    oldName: character.name,
    inputName,
    sanitizedName,
    targetFileName,
    tagIdsToMove: [...character.tagIds],
    errors,
    warnings,
  };
}

export async function applyCharacterRename(
  preview: CharacterRenamePreview,
  host: HostWindow = getHostWindow(),
): Promise<CharacterRenameResult> {
  if (preview.errors.length > 0) {
    return {
      success: false,
      message: preview.errors.join(' '),
      oldFileName: preview.oldFileName,
      preview,
    };
  }

  try {
    const response = await host.fetch('/api/characters/rename', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        avatar_url: preview.oldFileName,
        new_name: preview.sanitizedName,
      }),
    });
    if (!response.ok) {
      throw new Error(await getResponseError(response, '重命名失败'));
    }

    const payload = (await response.json().catch(() => ({}))) as RenameApiResponse;
    const newFileName = payload.avatar || preview.targetFileName;
    await migrateRenamedCharacterTags(preview.oldFileName, newFileName, host);
    renameHostCharacter(preview.oldFileName, preview.sanitizedName, newFileName, host);

    return {
      success: true,
      message: `已重命名为“${preview.sanitizedName}”。`,
      oldFileName: preview.oldFileName,
      newFileName,
      preview: {
        ...preview,
        targetFileName: newFileName,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: `重命名失败：${formatError(error)}`,
      oldFileName: preview.oldFileName,
      preview,
    };
  }
}

export async function downloadCharacterFile(fileName: string, host: HostWindow = getHostWindow()): Promise<CharacterExportResult> {
  try {
    const blob = await fetchCharacterBlob(fileName, host);
    triggerDownload(blob, fileName, host);
    return {
      success: true,
      message: `已准备下载 ${fileName}。`,
      fileName,
    };
  } catch (error) {
    return {
      success: false,
      message: `下载失败：${formatError(error)}`,
      fileName,
    };
  }
}

export async function exportCharactersZip(
  fileNames: string[],
  host: HostWindow = getHostWindow(),
): Promise<CharacterZipExportResult> {
  const uniqueFileNames = Array.from(new Set(fileNames.filter(Boolean)));
  const files: Record<string, Uint8Array> = {};
  const exportedFileNames: string[] = [];
  const failedFileNames: string[] = [];

  for (const fileName of uniqueFileNames) {
    try {
      const blob = await fetchCharacterBlob(fileName, host);
      files[fileName] = new Uint8Array(await blob.arrayBuffer());
      exportedFileNames.push(fileName);
    } catch {
      failedFileNames.push(fileName);
    }
  }

  if (exportedFileNames.length === 0) {
    return {
      success: false,
      message: '没有可导出的角色文件。',
      zipFileName: '',
      exportedFileNames,
      failedFileNames,
    };
  }

  const zipFileName = `character-cards-${formatLocalDate(new Date())}.zip`;
  const zipBytes = zipSync(files);
  triggerDownload(new Blob([zipBytes], { type: 'application/zip' }), zipFileName, host);

  return {
    success: failedFileNames.length === 0,
    message:
      failedFileNames.length === 0
        ? `已导出 ${exportedFileNames.length} 个角色。`
        : `已导出 ${exportedFileNames.length} 个角色，${failedFileNames.length} 个失败：${failedFileNames.join('、')}`,
    zipFileName,
    exportedFileNames,
    failedFileNames,
  };
}

export async function readCharacterChats(fileName: string, host: HostWindow = getHostWindow()): Promise<CharacterChatSummary[]> {
  const historyGetter = host.getChatHistoryBrief || (window as HostWindow).getChatHistoryBrief;
  if (typeof historyGetter === 'function') {
    try {
      const chats = normalizeChatList(await historyGetter.call(host, fileName), fileName);
      if (chats.length > 0) return chats;
    } catch {
      // 继续探测酒馆 API。
    }
  }

  const endpoints = [
    { url: '/api/characters/chats', body: { avatar_url: fileName } },
    { url: '/api/chats/get', body: { avatar_url: fileName } },
    { url: '/api/chats/list', body: { avatar_url: fileName } },
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await host.fetch(endpoint.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(endpoint.body),
      });
      if (!response.ok) continue;
      const chats = normalizeChatList(await response.json().catch(() => ({})), fileName);
      return chats;
    } catch {
      // 继续探测下一个端点。
    }
  }

  throw new Error('当前酒馆环境没有暴露可读取聊天记录列表的接口。');
}

export async function downloadCharacterChats(
  fileName: string,
  chatIds: string[] = [],
  host: HostWindow = getHostWindow(),
): Promise<CharacterExportResult> {
  try {
    const chats = await readCharacterChats(fileName, host);
    const filtered = chatIds.length > 0 ? chats.filter(chat => chatIds.includes(chat.id)) : chats;
    if (filtered.length === 0) {
      return { success: false, message: '没有可下载的聊天记录。', fileName };
    }
    const contents = await Promise.all(filtered.map(chat => readCharacterChatContent(fileName, chat, host)));
    if (contents.length === 1) {
      const chat = contents[0];
      triggerDownload(toChatBlob(chat.content), getChatDownloadFileName(chat), host);
    } else {
      const files = Object.fromEntries(
        contents.map(chat => [getChatDownloadFileName(chat), new Uint8Array(new TextEncoder().encode(formatChatContent(chat.content)))]),
      );
      triggerDownload(new Blob([zipSync(files)], { type: 'application/zip' }), `${stripExtension(fileName)}-chats.zip`, host);
    }
    return {
      success: true,
      message: '',
      fileName,
    };
  } catch (error) {
    return {
      success: false,
      message: `聊天记录下载失败：${formatError(error)}`,
      fileName,
    };
  }
}

export async function readCharacterChatContent(
  fileName: string,
  chat: CharacterChatSummary | string,
  host: HostWindow = getHostWindow(),
): Promise<CharacterChatContent> {
  const chatFileName = typeof chat === 'string' ? chat : chat.fileName;
  const title = typeof chat === 'string' ? getChatTitleFromFileName(chat, fileName) : chat.title;
  const response = await fetchFirstOk(
    [
      { url: '/api/chats/get', body: { avatar_url: fileName, chatfile: chatFileName } },
      { url: '/api/chats/get', body: { avatar_url: fileName, file_name: chatFileName } },
    ],
    host,
  );
  if (!response.ok) {
    throw new Error(await getResponseError(response, `聊天记录读取失败：${title || chatFileName}`));
  }
  return {
    fileName: chatFileName,
    title,
    content: await response.json().catch(() => ({})),
  };
}

export async function deleteCharacterChat(
  fileName: string,
  chat: CharacterChatSummary | string,
  host: HostWindow = getHostWindow(),
): Promise<CharacterExportResult> {
  const chatFileName = typeof chat === 'string' ? chat : chat.fileName;
  const chatId = typeof chat === 'string' ? chat : chat.id;
  try {
    const response = await fetchFirstOk(
      [
        { url: '/api/chats/delete', body: { avatar_url: fileName, chatfile: chatFileName } },
        { url: '/api/chats/delete', body: { avatar_url: fileName, chat_id: chatId, file_name: chatFileName } },
      ],
      host,
    );
    if (!response.ok) {
      throw new Error(await getResponseError(response, `聊天记录删除失败：${chatFileName}`));
    }
    return { success: true, message: '', fileName };
  } catch (error) {
    return {
      success: false,
      message: `聊天记录删除失败：${formatError(error)}`,
      fileName,
    };
  }
}

export async function openCharacterChat(
  fileName: string,
  chatFileName: string,
  host: HostWindow = getHostWindow(),
): Promise<CharacterExportResult> {
  try {
    const context = getContext(host);
    const helper = host.TavernHelper || host;
    const opener = host.TavernHelper?.openCharacterChat || host.openCharacterChat;
    const contextOpener = context?.openCharacterChat;
    const launcher = host.TavernHelper?.launchChat || host.launchChat;
    if (typeof launcher === 'function') {
      await launcher.call(helper, { fileName, avatar: fileName }, chatFileName);
      return { success: true, message: '', fileName };
    }
    await selectHostCharacter(fileName, host, context);
    if (typeof contextOpener === 'function') {
      await contextOpener.call(context, chatFileName);
      return { success: true, message: '', fileName };
    }
    if (typeof opener === 'function') {
      await opener.call(helper, chatFileName);
      return { success: true, message: '', fileName };
    }
    if (openChatByDom(chatFileName, host)) {
      return { success: true, message: '', fileName };
    }
    {
      throw new Error('当前酒馆环境没有暴露打开聊天记录的接口。');
    }
  } catch (error) {
    return {
      success: false,
      message: `打开聊天失败：${formatError(error)}`,
      fileName,
    };
  }
}

async function selectHostCharacter(fileName: string, host: HostWindow, context: TavernContext | undefined) {
  const source = context?.characters || host.characters || [];
  const characterIndex = source.findIndex(character => getCharacterFileName(character) === fileName);
  if (characterIndex < 0) {
    throw new Error(`角色卡不在当前酒馆列表中：${fileName}`);
  }
  if (String(host.this_chid ?? '') === String(characterIndex)) return;

  const domButton = host.document?.getElementById(`CharID${characterIndex}`);
  if (domButton instanceof HTMLElement) {
    domButton.click();
    await waitForHost(host, 250);
    return;
  }
  if (typeof context?.selectCharacterById === 'function') {
    await context.selectCharacterById(characterIndex, { switchMenu: false });
    await waitForHost(host, 250);
    return;
  }
  if (typeof host.loadCharacter === 'function') {
    await host.loadCharacter(characterIndex);
    await waitForHost(host, 250);
    return;
  }
}

function openChatByDom(chatFileName: string, host: HostWindow): boolean {
  const doc = host.document;
  if (!doc) return false;
  const button = doc.createElement('div');
  button.className = 'select_chat_block';
  button.setAttribute('file_name', chatFileName);
  button.style.display = 'none';
  doc.body.appendChild(button);
  try {
    const trigger = host.jQuery?.(button).trigger;
    if (typeof trigger === 'function') {
      trigger.call(host.jQuery?.(button), 'click');
      return true;
    }
    button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: host }));
    return true;
  } finally {
    host.setTimeout(() => button.remove(), 1000);
  }
}

function waitForHost(host: HostWindow, ms: number): Promise<void> {
  return new Promise(resolve => host.setTimeout(resolve, ms));
}

export async function previewCharacterDeletion(
  fileNames: string[],
  options: Partial<CharacterDeleteOptions> = {},
  characters?: CharacterSummary[],
  host: HostWindow = getHostWindow(),
): Promise<CharacterDeletePreview> {
  const deleteOptions: CharacterDeleteOptions = {
    backupCharacters: options.backupCharacters ?? true,
    deleteChats: options.deleteChats ?? false,
    deleteWorldBooks: options.deleteWorldBooks ?? true,
  };
  const list = characters || (await readCharacterList(host)).characters;
  const uniqueFileNames = Array.from(new Set(fileNames.filter(Boolean)));
  const targets: CharacterDeleteTarget[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];

  for (const fileName of uniqueFileNames) {
    const summary = list.find(character => character.fileName === fileName) || normalizeSummary({ avatar: fileName }, host);
    let chats: CharacterChatSummary[] = [];
    let chatStatus: CharacterDeleteTarget['chatStatus'] = 'ready';
    let chatError = '';
    try {
      chats = await readCharacterChats(fileName, host);
    } catch (error) {
      chatStatus = 'unavailable';
      chatError = formatError(error);
    }
    const worldBook = readCharacterWorldBookLink(summary, list);
    const willDeleteChats = deleteOptions.deleteChats && chatStatus === 'ready' && chats.length > 0;
    const willDeleteWorldBook = deleteOptions.deleteWorldBooks && worldBook.canDelete;
    const issues: CharacterIssue[] = [];
    if (deleteOptions.deleteChats && chatStatus === 'unavailable') {
      issues.push({ level: 'warning', message: `聊天记录不会删除：${chatError}` });
    }
    if (deleteOptions.deleteWorldBooks && summary.character_book && !worldBook.canDelete) {
      issues.push({ level: 'warning', message: `世界书不会删除：${worldBook.reason}` });
    }

    targets.push({
      fileName,
      name: summary.name,
      sourceUrl: summary.sourceUrl,
      tagNames: summary.tags.map(tag => tag.name),
      chatStatus,
      chatError,
      chats,
      worldBook,
      willDeleteChats,
      willDeleteWorldBook,
      issues,
    });
  }

  if (uniqueFileNames.length === 0) {
    errors.push('请选择要删除的角色。');
  }
  if (deleteOptions.deleteChats && targets.some(target => target.chatStatus === 'unavailable')) {
    warnings.push('部分角色无法读取聊天记录，已自动跳过聊天删除。');
  }
  if (deleteOptions.deleteWorldBooks && targets.some(target => target.worldBook.type !== 'none' && !target.worldBook.canDelete)) {
    warnings.push('部分世界书无法确认归属或被其他角色使用，已自动跳过。');
  }

  return {
    options: deleteOptions,
    targets,
    warnings,
    errors,
    requiresDeleteText: targets.length > 1,
  };
}

export function readCharacterWorldBookLink(character: CharacterSummary, characters: CharacterSummary[] = []): CharacterWorldBookLink {
  const name = character.character_book;
  if (!name) {
    return { name: '', type: 'none', canDelete: false, reason: '无关联世界书。', sharedBy: [] };
  }

  const sharedBy = characters
    .filter(item => item.fileName !== character.fileName && item.character_book === name)
    .map(item => item.name);
  if (sharedBy.length > 0) {
    return { name, type: 'external', canDelete: false, reason: `被其他角色使用：${sharedBy.join('、')}`, sharedBy };
  }

  const embedded = isEmbeddedWorldBook(character);
  return {
    name,
    type: embedded ? 'embedded' : 'unknown',
    canDelete: embedded,
    reason: embedded ? '可确认来自角色卡内嵌世界书。' : '只有世界书名称，无法确认是否为角色专属。',
    sharedBy,
  };
}

export async function applyCharacterDeletion(
  preview: CharacterDeletePreview,
  host: HostWindow = getHostWindow(),
): Promise<CharacterDeleteApplyResult[]> {
  if (preview.errors.length > 0) {
    return preview.targets.map(target => ({
      fileName: target.fileName,
      success: false,
      message: preview.errors.join(' '),
      deletedChats: 0,
      deletedWorldBook: false,
    }));
  }

  if (preview.options.backupCharacters) {
    const backup = await exportCharactersZip(preview.targets.map(target => target.fileName), host);
    if (!backup.exportedFileNames.length) {
      return preview.targets.map(target => ({
        fileName: target.fileName,
        success: false,
        message: `备份失败，已取消删除：${backup.message}`,
        deletedChats: 0,
        deletedWorldBook: false,
      }));
    }
  }

  const results: CharacterDeleteApplyResult[] = [];
  for (const target of preview.targets) {
    let deletedChats = 0;
    let deletedWorldBook = false;
    try {
      if (target.willDeleteChats) {
        deletedChats = await deleteCharacterChats(target, host);
      }
      if (target.willDeleteWorldBook) {
        deletedWorldBook = await deleteCharacterWorldBook(target.worldBook.name, host);
      }
      await deleteCharacterFile(target.fileName, host);
      await cleanupDeletedCharacter(target.fileName, host);
      results.push({
        fileName: target.fileName,
        success: true,
        message: `已删除 ${target.name}。`,
        deletedChats,
        deletedWorldBook,
      });
    } catch (error) {
      results.push({
        fileName: target.fileName,
        success: false,
        message: `删除失败：${formatError(error)}`,
        deletedChats,
        deletedWorldBook,
      });
    }
  }
  await refreshHostCharacters(host);
  return results;
}

export async function applyCharacterImport(
  candidates: CharacterImportCandidate[],
  host: HostWindow = getHostWindow(),
): Promise<CharacterImportApplyResult[]> {
  const results: CharacterImportApplyResult[] = [];
  for (const candidate of candidates) {
    if (candidate.status === 'error') {
      results.push({
        id: candidate.id,
        fileName: candidate.fileName,
        success: false,
        message: candidate.issues.map(issue => issue.message).join(' ') || '候选项存在解析错误。',
      });
      continue;
    }

    try {
      await writeCharacterImport(candidate, host);
      results.push({
        id: candidate.id,
        fileName: candidate.fileName,
        success: true,
        message: candidate.action === 'update' ? `已更新 ${candidate.summary.name}` : `已导入 ${candidate.summary.name}`,
      });
    } catch (error) {
      results.push({
        id: candidate.id,
        fileName: candidate.fileName,
        success: false,
        message: `导入失败：${formatError(error)}`,
      });
    }
  }

  return results;
}

async function writeCharacterImport(candidate: CharacterImportCandidate, host: HostWindow) {
  const nativeInput = getNativeImportInput(host);
  if (candidate.action === 'create' && nativeInput) {
    await importWithNativeFileInput(candidate, host, nativeInput);
    return;
  }

  const importRawCharacter = getImportRawCharacter(host);
  if (importRawCharacter) {
    const response = await importRawCharacter(candidate.fileName, candidate.importBlob);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return;
  }

  await importWithNativeFileInput(candidate, host, nativeInput);
}

function getImportRawCharacter(host: HostWindow): ((filename: string, content: Blob) => Promise<Response>) | undefined {
  const helperImport = host.TavernHelper?.importRawCharacter || window.TavernHelper?.importRawCharacter;
  if (typeof helperImport === 'function') {
    return (filename, content) => helperImport.call(host.TavernHelper || window.TavernHelper, filename, content);
  }

  const legacyImport = host.importRawCharacter || window.importRawCharacter;
  if (typeof legacyImport === 'function') {
    return (filename, content) => legacyImport.call(host, filename, content);
  }

  return undefined;
}

function getNativeImportInput(host: HostWindow): HTMLInputElement | null {
  return (host.document?.getElementById('character_import_file') as HTMLInputElement | null) || null;
}

async function importWithNativeFileInput(candidate: CharacterImportCandidate, host: HostWindow, input = getNativeImportInput(host)) {
  if (!input) {
    throw new Error('酒馆导入接口 importRawCharacter 不可用，且未找到原生导入控件 character_import_file。');
  }

  const DataTransferCtor = host.DataTransfer || window.DataTransfer;
  const FileCtor = host.File || window.File;
  const EventCtor = host.Event || window.Event;
  if (!DataTransferCtor || !FileCtor || !EventCtor) {
    throw new Error('当前环境不支持原生文件导入所需的 DataTransfer / File / Event。');
  }

  const before = getCharacterFileSet(host);
  const file = new FileCtor([candidate.importBlob], candidate.fileName, { type: getImportMimeType(candidate) });
  const transfer = new DataTransferCtor();
  transfer.items.add(file);
  input.files = transfer.files;

  if (!input.files || input.files.length === 0) {
    throw new Error('导入文件列表为空，可能被浏览器环境限制。');
  }

  input.dispatchEvent(new EventCtor('change', { bubbles: true }));
  await waitForNativeImport(candidate, host, before);
}

async function waitForNativeImport(candidate: CharacterImportCandidate, host: HostWindow, before: Set<string>) {
  const timeoutAt = Date.now() + 12_000;
  let lastSeen = getCharacterFileSet(host);

  while (Date.now() < timeoutAt) {
    await delay(300);
    await refreshHostCharacters(host);
    lastSeen = getCharacterFileSet(host);

    if (lastSeen.has(candidate.fileName) || lastSeen.size > before.size) {
      return;
    }
  }

  throw new Error('已提交给酒馆原生导入控件，但未在限定时间内确认角色列表变化。');
}

async function refreshHostCharacters(host: HostWindow) {
  const context = getContext(host);
  const refresh = context?.getCharacters || host.getCharacters;
  if (typeof refresh === 'function') {
    await refresh.call(context || host);
  }
}

function getCharacterFileSet(host: HostWindow): Set<string> {
  const context = getContext(host);
  const source = context?.characters || host.characters || [];
  return new Set(
    source
      .map(character => character.avatar || character.file_name || character.fileName || '')
      .filter(Boolean),
  );
}

function getImportMimeType(candidate: CharacterImportCandidate): string {
  return candidate.format === 'png' ? 'image/png' : 'application/json';
}

function normalizeChatSummary(chat: unknown, fileName: string, index: number): CharacterChatSummary {
  const record = chat && typeof chat === 'object' ? (chat as Record<string, any>) : {};
  const chatFileName = stringValue(record.file_name || record.fileName || record.filename);
  const id = stringValue(record.id || chatFileName || record.name || record.title || `chat-${index + 1}`);
  const title = stringValue(record.title || record.name) || getChatTitleFromFileName(chatFileName, fileName) || `聊天 ${index + 1}`;
  const messages = Array.isArray(record.messages)
    ? record.messages.length
    : numberValue(record.messageCount || record.messages_count || record.chat_items || record.mes_count || record.count);
  return {
    id,
    fileName: chatFileName || id,
    title,
    messageCount: messages,
    updatedAt: numberValue(record.updatedAt || record.updated_at || record.last_mes || record.date_last_chat || record.mtime),
    sizeBytes: numberValue(record.size || record.sizeBytes || record.size_bytes),
    canOpen: true,
    canDownload: true,
  };
}

function getChatTitleFromFileName(chatFileName: string, characterFileName: string): string {
  if (!chatFileName) return '';
  const characterName = stripExtension(characterFileName);
  let title = stripExtension(chatFileName);
  if (characterName && title.startsWith(`${characterName} - `)) {
    title = title.slice(characterName.length + 3);
  }
  return title || chatFileName;
}

function getChatDownloadFileName(chat: CharacterChatContent): string {
  const fileName = chat.fileName || `${chat.title || 'chat'}.jsonl`;
  return /\.[^.]+$/.test(fileName) ? fileName : `${fileName}.json`;
}

function toChatBlob(content: unknown): Blob {
  return new Blob([formatChatContent(content)], { type: 'application/json' });
}

function formatChatContent(content: unknown): string {
  return typeof content === 'string' ? content : JSON.stringify(content, null, 2);
}

function normalizeChatList(payload: unknown, fileName: string): CharacterChatSummary[] {
  const rawChats = getRawChatItems(payload);
  const seen = new Set<string>();
  return rawChats
    .map((chat, index) => normalizeChatSummary(chat, fileName, index))
    .filter(chat => {
      const key = stripExtension(chat.fileName || chat.id);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

function getRawChatItems(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];
  const response = payload as ChatApiResponse & Record<string, unknown>;
  if (Array.isArray(response.chats)) return response.chats;
  if (Array.isArray(response.data)) return response.data;
  return Object.entries(response).map(([fileName, value]) =>
    value && typeof value === 'object' ? { file_name: fileName, ...(value as Record<string, unknown>) } : { file_name: fileName },
  );
}

async function deleteCharacterChats(target: CharacterDeleteTarget, host: HostWindow): Promise<number> {
  let deleted = 0;
  for (const chat of target.chats) {
    const response = await fetchFirstOk(
      [
        { url: '/api/chats/delete', body: { avatar_url: target.fileName, chatfile: chat.fileName || chat.id } },
        { url: '/api/chats/delete', body: { avatar_url: target.fileName, chat_id: chat.id, file_name: chat.fileName } },
        { url: '/api/chats/remove', body: { avatar_url: target.fileName, chat_id: chat.id, file_name: chat.fileName } },
      ],
      host,
    );
    if (!response.ok) {
      throw new Error(await getResponseError(response, `聊天记录删除失败：${chat.title}`));
    }
    deleted += 1;
  }
  return deleted;
}

async function deleteCharacterWorldBook(name: string, host: HostWindow): Promise<boolean> {
  if (!name) return false;
  const response = await fetchFirstOk(
    [
      { url: '/api/worldinfo/delete', body: { name } },
      { url: '/api/worldinfo/delete-world-info', body: { name } },
      { url: '/api/worldinfo/edit', body: { name, delete: true } },
    ],
    host,
  );
  if (!response.ok) {
    throw new Error(await getResponseError(response, `世界书删除失败：${name}`));
  }
  return true;
}

async function deleteCharacterFile(fileName: string, host: HostWindow): Promise<void> {
  const response = await fetchFirstOk(
    [
      { url: '/api/characters/delete', body: { avatar_url: fileName, delete_chats: false } },
      { url: '/api/characters/delete', body: { avatar: fileName } },
    ],
    host,
  );
  if (!response.ok) {
    throw new Error(await getResponseError(response, `角色删除失败：${fileName}`));
  }
  removeHostCharacter(fileName, host);
}

async function fetchFirstOk(endpoints: { url: string; body: Record<string, unknown> }[], host: HostWindow): Promise<Response> {
  let lastResponse: Response | undefined;
  let lastError: unknown;
  for (const endpoint of endpoints) {
    try {
      const response = await host.fetch(endpoint.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(endpoint.body),
      });
      lastResponse = response;
      if (response.ok) return response;
    } catch (error) {
      lastError = error;
    }
  }
  if (lastResponse) return lastResponse;
  throw lastError instanceof Error ? lastError : new Error('宿主接口不可用。');
}

async function cleanupDeletedCharacter(fileName: string, host: HostWindow) {
  const context = getContext(host);
  if (context?.tagMap && Object.prototype.hasOwnProperty.call(context.tagMap, fileName)) {
    delete context.tagMap[fileName];
    await context.saveSettingsDebounced?.();
  }
  await writeLegacySourceUrl(fileName, '', host);
}

function removeHostCharacter(fileName: string, host: HostWindow) {
  const context = getContext(host);
  removeCharacterFromArray(context?.characters, fileName);
  removeCharacterFromArray(host.characters, fileName);
}

function removeCharacterFromArray(characters: TavernCharacter[] | undefined, fileName: string) {
  if (!Array.isArray(characters)) return;
  const index = characters.findIndex(character => getCharacterFileName(character) === fileName);
  if (index >= 0) characters.splice(index, 1);
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => {
    window.setTimeout(resolve, ms);
  });
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

export function normalizeSummary(
  raw: TavernCharacter,
  host: HostWindow = getHostWindow(),
  legacyMeta: Record<string, any> = {},
): CharacterSummary {
  return normalizeSummaryWithMeta(raw, host, legacyMeta);
}

function normalizeSummaryWithMeta(
  raw: TavernCharacter,
  host: HostWindow = getHostWindow(),
  legacyMeta: Record<string, any> = {},
): CharacterSummary {
  const fileName = raw.avatar || raw.file_name || raw.fileName || '';
  const data = raw.data || {};
  const firstMes = stringValue(raw.firstMes || data.first_mes);
  const altGreetings = arrayValue(raw.altGreetings || data.alternate_greetings);
  const rawBook = data.character_book || raw.character_book;
  const characterBook = getBookName(rawBook);
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
    worldBookEmbedded: isEmbeddedBookValue(rawBook),
    sourceUrl: getSourceUrl(data, raw, legacyMeta),
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
    sourceUrl: base?.sourceUrl || summary.sourceUrl,
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

function isWritableTagContext(
  context: TavernContext | undefined,
): context is TavernContext & { tags: unknown[]; tagMap: Record<string, string[]> } {
  return Boolean(context && Array.isArray(context.tags) && context.tagMap && typeof context.tagMap === 'object');
}

function replaceTagMap(target: Record<string, string[]>, source: Record<string, string[]>) {
  Object.keys(target).forEach(fileName => {
    delete target[fileName];
  });
  Object.entries(source).forEach(([fileName, ids]) => {
    target[fileName] = ids;
  });
}

function findHostCharacter(fileName: string, host: HostWindow): TavernCharacter | undefined {
  const context = getContext(host);
  const source = context?.characters || host.characters || [];
  return source.find(character => (character.avatar || character.file_name || character.fileName) === fileName);
}

function getCharacterFileName(character: TavernCharacter): string {
  return character.avatar || character.file_name || character.fileName || '';
}

function snapshotFavorite(character: TavernCharacter | undefined): {
  fav: boolean;
  dataFav: unknown;
  extensionFav: unknown;
  hadDataFav: boolean;
  hadExtensionFav: boolean;
} {
  const data = character?.data;
  const extensions = data?.extensions as Record<string, unknown> | undefined;
  return {
    fav: Boolean(character?.fav || data?.fav || extensions?.fav),
    dataFav: data?.fav,
    extensionFav: extensions?.fav,
    hadDataFav: Boolean(data && Object.prototype.hasOwnProperty.call(data, 'fav')),
    hadExtensionFav: Boolean(extensions && Object.prototype.hasOwnProperty.call(extensions, 'fav')),
  };
}

function writeFavoriteToMemory(character: TavernCharacter | undefined, fav: boolean) {
  if (!character) return;
  character.fav = fav;
  character.data = character.data || {};
  character.data.fav = fav;
  character.data.extensions = character.data.extensions || {};
  character.data.extensions.fav = fav;
}

function restoreFavorite(
  character: TavernCharacter | undefined,
  snapshot: ReturnType<typeof snapshotFavorite>,
) {
  if (!character) return;
  character.fav = snapshot.fav;
  if (!character.data) return;
  if (snapshot.hadDataFav) {
    character.data.fav = snapshot.dataFav;
  } else {
    delete character.data.fav;
  }
  const extensions = character.data.extensions as Record<string, unknown> | undefined;
  if (!extensions) return;
  if (snapshot.hadExtensionFav) {
    extensions.fav = snapshot.extensionFav;
  } else {
    delete extensions.fav;
  }
}

function snapshotCharacterData(character: TavernCharacter | undefined): Record<string, any> | undefined {
  if (!character?.data) return undefined;
  return JSON.parse(JSON.stringify(character.data));
}

function restoreCharacterData(character: TavernCharacter | undefined, snapshot: Record<string, any> | undefined) {
  if (!character) return;
  if (snapshot) {
    character.data = snapshot;
  } else {
    delete character.data;
  }
}

async function readLegacyCharMetaMap(host: HostWindow): Promise<Record<string, Record<string, any>>> {
  try {
    const data = await readLegacyMetaDB(host, LEGACY_META_KEY);
    return data && typeof data === 'object' ? (data as Record<string, Record<string, any>>) : {};
  } catch {
    return {};
  }
}

async function writeLegacySourceUrl(fileName: string, sourceUrl: string, host: HostWindow) {
  try {
    const data = await readLegacyCharMetaMap(host);
    const current = data[fileName] && typeof data[fileName] === 'object' ? data[fileName] : {};
    if (sourceUrl) {
      data[fileName] = { ...current, source_url: sourceUrl };
    } else {
      const { source_url: _removed, ...rest } = current;
      if (Object.keys(rest).length > 0) {
        data[fileName] = rest;
      } else {
        delete data[fileName];
      }
    }
    await writeLegacyMetaDB(host, LEGACY_META_KEY, data);
  } catch (error) {
    console.warn('[CharacterCardManager] 旧角色卡管理器来源 URL 缓存同步失败', error);
  }
}

function readLegacyMetaDB(host: HostWindow, key: string): Promise<unknown> {
  const indexedDBApi = host.indexedDB || window.indexedDB;
  if (!indexedDBApi) return Promise.resolve(undefined);
  return new Promise(resolve => {
    const request = indexedDBApi.open(LEGACY_META_DB_NAME, LEGACY_META_DB_VERSION);
    request.onerror = () => resolve(undefined);
    request.onupgradeneeded = event => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(LEGACY_META_DB_STORE)) {
        db.createObjectStore(LEGACY_META_DB_STORE);
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction([LEGACY_META_DB_STORE], 'readonly');
      const store = transaction.objectStore(LEGACY_META_DB_STORE);
      const getRequest = store.get(key);
      getRequest.onerror = () => {
        db.close();
        resolve(undefined);
      };
      getRequest.onsuccess = () => {
        db.close();
        resolve(getRequest.result);
      };
    };
  });
}

function writeLegacyMetaDB(host: HostWindow, key: string, value: unknown): Promise<void> {
  const indexedDBApi = host.indexedDB || window.indexedDB;
  if (!indexedDBApi) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const request = indexedDBApi.open(LEGACY_META_DB_NAME, LEGACY_META_DB_VERSION);
    request.onerror = () => reject(new Error('IndexedDB 打开失败'));
    request.onupgradeneeded = event => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(LEGACY_META_DB_STORE)) {
        db.createObjectStore(LEGACY_META_DB_STORE);
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction([LEGACY_META_DB_STORE], 'readwrite');
      const store = transaction.objectStore(LEGACY_META_DB_STORE);
      const putRequest = store.put(value, key);
      putRequest.onerror = () => {
        db.close();
        reject(new Error('IndexedDB 保存失败'));
      };
      putRequest.onsuccess = () => {
        db.close();
        resolve();
      };
    };
  });
}

function writeSourceUrlToMemory(character: TavernCharacter | undefined, sourceUrl: string) {
  if (!character) return;
  character.data = character.data || {};
  if (!character.data.extensions || typeof character.data.extensions !== 'object') {
    character.data.extensions = {};
  }
  if (sourceUrl) {
    character.data.source_url = sourceUrl;
    character.data.extensions.source_url = sourceUrl;
    character.data.extensions.source_link = sourceUrl;
  } else {
    delete character.data.source_url;
    delete character.data.source;
    delete character.data.url;
    delete character.data.extensions.source_url;
    delete character.data.extensions.source_link;
    delete character.data.extensions.source;
    delete character.data.extensions.url;
  }
}

async function migrateRenamedCharacterTags(oldFileName: string, newFileName: string, host: HostWindow) {
  const context = getContext(host);
  if (!context?.tagMap || typeof context.tagMap !== 'object') return;
  const ids = context.tagMap[oldFileName];
  if (!ids) return;
  context.tagMap[newFileName] = [...ids];
  delete context.tagMap[oldFileName];
  await context.saveSettingsDebounced?.();
}

function renameHostCharacter(oldFileName: string, newName: string, newFileName: string, host: HostWindow) {
  const character = findHostCharacter(oldFileName, host);
  if (!character) return;
  character.name = newName;
  character.avatar = newFileName;
  if (character.file_name) character.file_name = newFileName;
  if (character.fileName) character.fileName = newFileName;
  if (character.data) character.data.name = newName;
}

async function fetchCharacterBlob(fileName: string, host: HostWindow): Promise<Blob> {
  const response = await host.fetch(`/characters/${encodeURIComponent(fileName)}`);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.blob();
}

function triggerDownload(blob: Blob, fileName: string, host: HostWindow) {
  const url = URL.createObjectURL(blob);
  const link = host.document.createElement('a');
  link.href = url;
  link.download = fileName;
  host.document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function sanitizeCharacterName(name: string): string {
  const forbidden = new Set(['<', '>', ':', '"', '/', '\\', '|', '?', '*']);
  return name
    .trim()
    .split('')
    .filter(char => !forbidden.has(char) && char.charCodeAt(0) >= 32)
    .join('')
    .replace(/[. ]+$/g, '');
}

function getFileExtension(fileName: string): string {
  const match = /\.[^.]+$/.exec(fileName);
  return match?.[0] || '';
}

async function getResponseError(response: Response, fallback: string): Promise<string> {
  try {
    return (await response.text()) || fallback;
  } catch {
    return fallback;
  }
}

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getBookName(book: unknown): string {
  if (!book) return '';
  if (typeof book === 'string') return book;
  if (typeof book === 'object' && 'name' in book) {
    return stringValue((book as { name?: string }).name);
  }
  return '';
}

function isEmbeddedBookValue(book: unknown): boolean {
  if (!book || typeof book !== 'object') return false;
  const record = book as Record<string, unknown>;
  return Array.isArray(record.entries) || Array.isArray(record.entries_list);
}

function isEmbeddedWorldBook(character: CharacterSummary): boolean {
  return Boolean(character.worldBookEmbedded);
}

function getSourceUrl(data: Record<string, any>, raw: TavernCharacter = {}, legacyMeta: Record<string, any> = {}): string {
  const extensions = data.extensions && typeof data.extensions === 'object' ? data.extensions : {};
  return stringValue(
    legacyMeta.source_url ||
      extensions.source_url ||
      extensions.source_link ||
      extensions.sourceUrl ||
      extensions.source ||
      extensions.url ||
      data.source_url ||
      data.sourceUrl ||
      data.source ||
      data.url ||
      (raw as Record<string, unknown>).source_url ||
      (raw as Record<string, unknown>).sourceUrl,
  );
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

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { filterCharacters, getFilterCounts, sortCharacters } from './filters';
import {
  applyCharacterDeletion,
  applyCharacterCoverMutation,
  applyCharacterImport,
  applyCharacterRename,
  applyFavoriteMutation,
  applySourceUrlMutation,
  applyTagMutation,
  applyUserNoteMutation,
  deleteCharacterChat,
  downloadCharacterChats,
  downloadCharacterFile,
  exportCharactersZip,
  loadCharacterOriginalImage,
  openCharacterChat,
  previewCharacterDeletion,
  previewCharacterRename,
  readCharacterChats,
  readCharacterChatContent,
  readCharacterDetail,
  readCharacterList,
} from './host';
import { buildImportCandidate, canApplyImport, expandImportSources, fetchImportSource, parseImportSource } from './imports';
import { getArchiveTag, getTagCounts, isArchiveTag, previewTagMutation } from './tags';
import type {
  CharacterDetail,
  CharacterDeletePreview,
  CharacterFilter,
  CharacterChatSummary,
  CharacterChatContent,
  CharacterImportCandidate,
  CharacterImportDiffRow,
  CharacterImportParseInput,
  CharacterImportSourceKind,
  CharacterRenamePreview,
  CharacterSort,
  CharacterSummary,
  CharacterTag,
  TagFilterMode,
  TagMutationAction,
  TagMutationPreview,
} from './types';

interface ImportDiffLine {
  label: string;
  value: string;
  primary: boolean;
}

const DETAIL_LOADING_DELAY_MS = 180;
const APP_VERSION = '1.06';
const TAG_FILTER_MODE_KEY = 'character-card-manager:tag-filter-mode';
const CHAT_ALIAS_KEY = 'character-card-manager:chat-aliases';
const CARD_GRID_GAP_PX = 8;
const CARD_GRID_HORIZONTAL_PADDING_PX = 20;
const CARD_HEIGHT_RATIO = 4 / 3;
const IMPORT_ACCEPT_DEFAULT = '.json,.png,.zip,application/json,image/png,application/zip';
const IMPORT_ACCEPT_REPLACE = '.json,.png,application/json,image/png';

const sideFilters: { id: CharacterFilter; label: string }[] = [
  { id: 'all', label: '全部' },
  { id: 'favorite', label: '收藏' },
  { id: 'archived', label: '归档' },
  { id: 'untagged', label: '无标签' },
];

const characters = ref<CharacterSummary[]>([]);
const tavernTags = ref<CharacterTag[]>([]);
const tagMap = ref<Record<string, string[]>>({});
const selectedFile = ref('');
const selectedDetail = ref<CharacterDetail | null>(null);
const loadingList = ref(false);
const loadingDetail = ref(false);
const query = ref('');
const activeFilter = ref<CharacterFilter>('all');
const activeTagIds = ref<string[]>([]);
const tagFilterMode = ref<TagFilterMode>(readStoredTagFilterMode());
const settingsOpen = ref(false);
const sortBy = ref<CharacterSort>('date_added');
const globalIssues = ref<string[]>([]);
const leftCollapsed = ref(false);
const rightCollapsed = ref(false);
const cardSizeIndex = ref(1);
const selectedGreetingIndex = ref(0);
const selectionMode = ref(false);
const selectedFiles = ref<Set<string>>(new Set());
const tagAction = ref<TagMutationAction>('add');
const selectedTagId = ref('');
const newTagName = ref('');
const tagPreview = ref<TagMutationPreview | null>(null);
const tagStatus = ref('');
const applyingTags = ref(false);
const applyingFavoriteFiles = ref<Set<string>>(new Set());
const applyingBatchFavorite = ref(false);
const exportingFiles = ref(false);
const managementStatus = ref('');
const launchingFileName = ref('');
const deletePreview = ref<CharacterDeletePreview | null>(null);
const deleteBackupCharacters = ref(true);
const deleteChats = ref(false);
const deleteWorldBooks = ref(true);
const deleteConfirmText = ref('');
const applyingDeletion = ref(false);
const tagDialogOpen = ref(false);
const detailTagName = ref('');
const applyingDetailTag = ref(false);
const chatStates = ref<Record<string, { loading: boolean; error: string; chats: CharacterChatSummary[] }>>({});
const chatsExpanded = ref(false);
const chatAliases = ref<Record<string, string>>(readStoredChatAliases());
const expandedChatKey = ref('');
const chatContentStates = ref<Record<string, { loading: boolean; error: string; content: CharacterChatContent | null }>>({});
const deletingChatKeys = ref<Set<string>>(new Set());
const sourceUrlDraft = ref('');
const sourceUrlError = ref('');
const savingSourceUrl = ref(false);
const userNoteDraft = ref('');
const userNoteError = ref('');
const savingUserNote = ref(false);
const renameInput = ref('');
const applyingRename = ref(false);
const avatarUrlIndex = ref<Record<string, number>>({});
const originalAvatarUrls = ref<Record<string, string>>({});
const importAvatarUrls = ref<Record<string, string>>({});
const importDialogOpen = ref(false);
const importReplaceTarget = ref<CharacterSummary | null>(null);
const importUrl = ref('');
const importCandidates = ref<CharacterImportCandidate[]>([]);
const selectedImportId = ref('');
const parsingImports = ref(false);
const applyingImports = ref(false);
const importStatus = ref('');
const coverInputElement = ref<HTMLInputElement | null>(null);
const updatingCover = ref(false);
const galleryElement = ref<HTMLElement | null>(null);
const galleryContentWidth = ref(0);
const galleryColumnGap = ref(CARD_GRID_GAP_PX);
const galleryRenderedColumns = ref(0);
const loadingOriginalAvatars = new Set<string>();
const cardSizes = [
  { label: '小', columns: 8 },
  { label: '中', columns: 6 },
  { label: '大', columns: 4 },
  { label: '特大', columns: 3 },
];
let detailRequestId = 0;
let detailLoadingTimer: ReturnType<typeof setTimeout> | undefined;
let galleryResizeObserver: ResizeObserver | undefined;
let galleryResizeFallback: (() => void) | undefined;

const visibleCharacters = computed(() =>
  sortCharacters(
    filterCharacters(characters.value, query.value, activeFilter.value, activeTagIds.value, tagFilterMode.value),
    sortBy.value,
  ),
);

const selectedSummary = computed(() => characters.value.find(character => character.fileName === selectedFile.value));
const selectedCharacters = computed(() => characters.value.filter(character => selectedFiles.value.has(character.fileName)));
const selectedFileList = computed(() => selectedCharacters.value.map(character => character.fileName));
const filterCounts = computed(() => getFilterCounts(characters.value));
const tagCounts = computed(() => getTagCounts(characters.value));
const archiveTag = computed(() => getArchiveTag(tavernTags.value));
const ordinaryTavernTags = computed(() => tavernTags.value.filter(tag => !isArchiveTag(tag)));
const selectedTagDistribution = computed(() =>
  selectedCharacters.value
    .flatMap(character => character.tags)
    .reduce<Record<string, { tag: CharacterTag; count: number }>>((result, tag) => {
      result[tag.id] = result[tag.id] || { tag, count: 0 };
      result[tag.id].count += 1;
      return result;
    }, {}),
);
const selectedFavoriteCount = computed(() => selectedCharacters.value.filter(character => character.fav).length);
const selectedMissingGreetingCount = computed(() => selectedCharacters.value.filter(character => !character.firstMes).length);
const selectedErrorCount = computed(() =>
  selectedCharacters.value.filter(character => character.issues.some(issue => issue.level === 'error')).length,
);
const showSelectionSummary = computed(() => selectionMode.value && selectedCharacters.value.length > 0);
const detailActiveTagIds = computed(() => new Set(activePreview.value?.tagIds || []));

const activePreview = computed(() => selectedSummary.value || selectedDetail.value || null);
const detailPreview = computed(() => {
  if (selectedDetail.value?.fileName === selectedFile.value) return selectedDetail.value;
  return selectedDetail.value || activePreview.value;
});
const previewRiskIssues = computed(() => detailPreview.value?.issues.filter(issue => issue.level !== 'info') || []);
const previewDescription = computed(() => {
  if (!detailPreview.value) return '';
  return 'description' in detailPreview.value ? detailPreview.value.description : detailPreview.value.desc;
});
const previewFirstMessage = computed(() => {
  if (!detailPreview.value) return '';
  return 'first_mes' in detailPreview.value ? detailPreview.value.first_mes : detailPreview.value.firstMes;
});
const previewAltGreetings = computed(() =>
  detailPreview.value && 'alternate_greetings' in detailPreview.value ? detailPreview.value.alternate_greetings : [],
);
const greetingOptions = computed(() => [previewFirstMessage.value, ...previewAltGreetings.value]);
const selectedGreeting = computed(() => greetingOptions.value[selectedGreetingIndex.value] || greetingOptions.value[0]);
const greetingPageLabel = computed(() => `${Math.min(selectedGreetingIndex.value + 1, greetingOptions.value.length)} / ${greetingOptions.value.length}`);
const cardSize = computed(() => cardSizes[cardSizeIndex.value]);
const cardGridStyle = computed(() => ({
  '--cm-card-cols': String(cardSize.value.columns),
  '--cm-card-height': `${getMeasuredCardHeight(galleryRenderedColumns.value || cardSize.value.columns)}px`,
}));
const selectedImportCandidate = computed(
  () => importCandidates.value.find(candidate => candidate.id === selectedImportId.value) || importCandidates.value[0] || null,
);
const importReadyCount = computed(() => importCandidates.value.filter(candidate => candidate.status !== 'error').length);
const importErrorCount = computed(() => importCandidates.value.filter(candidate => candidate.status === 'error').length);
const canConfirmImports = computed(() => canApplyImport(importCandidates.value) && !parsingImports.value && !applyingImports.value);
const isImportReplaceMode = computed(() => Boolean(importReplaceTarget.value));
const importDialogTitle = computed(() => (importReplaceTarget.value ? '替换角色卡' : '导入/更新角色卡'));
const importDialogHint = computed(() =>
  importReplaceTarget.value ? `将替换当前角色：${importReplaceTarget.value.name}` : '',
);
const importFileAccept = computed(() => (isImportReplaceMode.value ? IMPORT_ACCEPT_REPLACE : IMPORT_ACCEPT_DEFAULT));
const importFileHint = computed(() => (isImportReplaceMode.value ? 'JSON / PNG' : 'JSON / PNG / ZIP'));
const renamePreview = computed<CharacterRenamePreview | null>(() => {
  if (!activePreview.value) return null;
  return previewCharacterRename(activePreview.value, renameInput.value, characters.value);
});
const canSaveRename = computed(() =>
  Boolean(activePreview.value && renameInput.value.trim() && renameInput.value.trim() !== activePreview.value.name && !applyingRename.value),
);
const canOpenSourceUrl = computed(() => /^https?:\/\//i.test(sourceUrlDraft.value.trim()));
const activeChatState = computed(() =>
  activePreview.value
    ? chatStates.value[activePreview.value.fileName] || { loading: false, error: '', chats: [] }
    : { loading: false, error: '', chats: [] },
);
const canConfirmDeletion = computed(
  () =>
    Boolean(deletePreview.value) &&
    !applyingDeletion.value &&
    deletePreview.value!.errors.length === 0 &&
    (!deletePreview.value!.requiresDeleteText || deleteConfirmText.value === 'DELETE'),
);

watch(
  () => activePreview.value?.fileName,
  () => {
    sourceUrlDraft.value = activePreview.value?.sourceUrl || '';
    sourceUrlError.value = '';
    userNoteDraft.value = activePreview.value?.userNote || '';
    userNoteError.value = '';
    chatsExpanded.value = false;
    expandedChatKey.value = '';
  },
  { immediate: true },
);

watch(
  () => `${activePreview.value?.fileName || ''}\n${activePreview.value?.name || ''}`,
  () => {
    if (!applyingRename.value) {
      renameInput.value = activePreview.value?.name || '';
    }
  },
  { immediate: true },
);

watch(
  () => activePreview.value?.sourceUrl,
  value => {
    if (!savingSourceUrl.value) {
      sourceUrlDraft.value = value || '';
    }
  },
);

watch(
  () => activePreview.value?.userNote,
  value => {
    if (!savingUserNote.value) {
      userNoteDraft.value = value || '';
    }
  },
);

watch(
  galleryElement,
  element => {
    observeGalleryElement(element);
  },
  { flush: 'post' },
);

watch(
  () => cardSize.value.columns,
  () => {
    window.requestAnimationFrame(() => refreshGalleryMetrics());
  },
);

onMounted(() => {
  observeGalleryElement(galleryElement.value);
  void refreshList();
});

onUnmounted(() => {
  clearDetailLoadingTimer();
  disconnectGalleryObserver();
  revokeOriginalAvatarUrls();
  revokeImportAvatarUrls();
});

function getMeasuredCardHeight(columns: number): number {
  const safeColumns = Math.max(1, columns);
  const width = galleryContentWidth.value || estimateGalleryWidth();
  const gap = galleryColumnGap.value || CARD_GRID_GAP_PX;
  const columnWidth = (width - gap * (safeColumns - 1)) / safeColumns;
  return Math.max(120, Math.round(columnWidth * CARD_HEIGHT_RATIO));
}

function estimateGalleryWidth(): number {
  if (typeof window === 'undefined') return 360;
  return Math.max(320, window.innerWidth - 700 - CARD_GRID_HORIZONTAL_PADDING_PX);
}

function observeGalleryElement(element: HTMLElement | null) {
  disconnectGalleryObserver();
  if (!element) {
    galleryContentWidth.value = 0;
    galleryRenderedColumns.value = 0;
    return;
  }

  refreshGalleryMetrics(element);
  if (typeof ResizeObserver === 'function') {
    galleryResizeObserver = new ResizeObserver(() => refreshGalleryMetrics(element));
    galleryResizeObserver.observe(element);
    return;
  }

  galleryResizeFallback = () => refreshGalleryMetrics(element);
  window.addEventListener('resize', galleryResizeFallback);
}

function refreshGalleryMetrics(element = galleryElement.value) {
  if (!element) return;
  const style = window.getComputedStyle(element);
  const paddingLeft = parsePx(style.paddingLeft);
  const paddingRight = parsePx(style.paddingRight);
  const columnGap = parsePx(style.columnGap || style.gap);
  galleryColumnGap.value = columnGap || CARD_GRID_GAP_PX;
  galleryContentWidth.value = Math.max(0, element.clientWidth - paddingLeft - paddingRight);
  galleryRenderedColumns.value = getRenderedColumnCount(style) || cardSize.value.columns;
}

function disconnectGalleryObserver() {
  galleryResizeObserver?.disconnect();
  galleryResizeObserver = undefined;
  if (galleryResizeFallback) {
    window.removeEventListener('resize', galleryResizeFallback);
    galleryResizeFallback = undefined;
  }
}

function parsePx(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getRenderedColumnCount(style: CSSStyleDeclaration): number {
  const template = style.gridTemplateColumns;
  if (!template || template === 'none') return 0;
  return template.split(/\s+/).filter(Boolean).length;
}

async function refreshList() {
  loadingList.value = true;
  selectedDetail.value = null;
  selectedGreetingIndex.value = 0;
  globalIssues.value = [];
  try {
    const result = await readCharacterList();
    characters.value = result.characters;
    tavernTags.value = result.tags;
    tagMap.value = result.tagMap;
    globalIssues.value = result.issues.map(issue => issue.message);
    selectedTagId.value = selectedTagId.value || result.tags[0]?.id || '';
    selectedFiles.value = new Set([...selectedFiles.value].filter(fileName => result.characters.some(character => character.fileName === fileName)));
    activeTagIds.value = activeTagIds.value.filter(id => result.tags.some(tag => tag.id === id));
    result.characters.forEach(character => {
      void loadOriginalAvatar(character);
    });
    if (!selectedFile.value || !characters.value.some(character => character.fileName === selectedFile.value)) {
      selectedFile.value = characters.value[0]?.fileName || '';
    }
  } finally {
    loadingList.value = false;
  }
}

function activateFilter(filter: CharacterFilter) {
  activeFilter.value = filter;
  activeTagIds.value = [];
}

function activateTagFilter(tagId: string) {
  if (archiveTag.value?.id === tagId) {
    activateFilter('archived');
    return;
  }
  if (tagFilterMode.value === 'exclusive') {
    activeTagIds.value = activeTagIds.value.includes(tagId) ? [] : [tagId];
  } else {
    activeTagIds.value = activeTagIds.value.includes(tagId)
      ? activeTagIds.value.filter(id => id !== tagId)
      : [...activeTagIds.value, tagId];
  }
  if (activeTagIds.value.length > 0) activeFilter.value = 'all';
}

function clearTagFilters() {
  activeTagIds.value = [];
  activeFilter.value = 'all';
}

function openImportDialog(target?: CharacterSummary | CharacterDetail) {
  importReplaceTarget.value = target
    ? {
        ...target,
        tags: [...target.tags],
        tagIds: [...target.tagIds],
        avatarFallbackUrls: [...target.avatarFallbackUrls],
        issues: [...target.issues],
      }
    : null;
  clearImportCandidates();
  importUrl.value = '';
  importDialogOpen.value = true;
  selectionMode.value = false;
  selectedFiles.value = new Set();
  clearTagPreview();
  resetRenameEditor();
  closeTagDialog();
}

function closeImportDialog() {
  if (parsingImports.value || applyingImports.value) return;
  importDialogOpen.value = false;
  importReplaceTarget.value = null;
  clearImportCandidates();
  importUrl.value = '';
}

function openReplaceDialog() {
  if (!activePreview.value) return;
  openImportDialog(activePreview.value);
}

async function selectCharacter(character: CharacterSummary) {
  const requestId = detailRequestId + 1;
  detailRequestId = requestId;
  selectedFile.value = character.fileName;
  selectedGreetingIndex.value = 0;
  resetRenameEditor();
  closeTagDialog();
  loadingDetail.value = false;
  clearDetailLoadingTimer();
  detailLoadingTimer = setTimeout(() => {
    if (detailRequestId === requestId) {
      loadingDetail.value = true;
    }
  }, DETAIL_LOADING_DELAY_MS);
  try {
    const detail = await readCharacterDetail(character.fileName, character);
    if (detailRequestId === requestId) {
      selectedDetail.value = detail;
    }
  } finally {
    if (detailRequestId === requestId) {
      clearDetailLoadingTimer();
      loadingDetail.value = false;
    }
  }
}

function setTagFilterMode(mode: TagFilterMode) {
  tagFilterMode.value = mode;
  if (mode === 'exclusive' && activeTagIds.value.length > 1) {
    activeTagIds.value = activeTagIds.value.slice(0, 1);
  }
  try {
    localStorage.setItem(TAG_FILTER_MODE_KEY, mode);
  } catch {
    // 设置仅影响当前界面筛选，localStorage 不可用时保持内存态。
  }
}

function clearDetailLoadingTimer() {
  if (detailLoadingTimer) {
    clearTimeout(detailLoadingTimer);
    detailLoadingTimer = undefined;
  }
}

function readStoredTagFilterMode(): TagFilterMode {
  try {
    const stored = localStorage.getItem(TAG_FILTER_MODE_KEY);
    return stored === 'or' || stored === 'and' ? stored : 'exclusive';
  } catch {
    return 'exclusive';
  }
}

function readStoredChatAliases(): Record<string, string> {
  try {
    const stored = localStorage.getItem(CHAT_ALIAS_KEY);
    const parsed = stored ? JSON.parse(stored) : {};
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function saveChatAliases() {
  try {
    localStorage.setItem(CHAT_ALIAS_KEY, JSON.stringify(chatAliases.value));
  } catch {
    // 聊天别名只是界面辅助，localStorage 不可用时保持当前内存态。
  }
}

function formatDate(timestamp: number): string {
  if (!timestamp) return '未知';
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '未知';
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function truncate(text: string, fallback = '无内容', maxLength = 140): string {
  if (!text) return fallback;
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

function getAvatarSrc(character: CharacterSummary | CharacterDetail): string {
  const originalUrl = originalAvatarUrls.value[character.fileName];
  if (originalUrl) return originalUrl;

  const urls = character.avatarFallbackUrls.length ? character.avatarFallbackUrls : [character.avatarUrl];
  const index = avatarUrlIndex.value[character.fileName] || 0;
  return urls[Math.min(index, urls.length - 1)] || '';
}

function getImportAvatarSrc(candidate: CharacterImportCandidate): string {
  return importAvatarUrls.value[candidate.id] || '';
}

function handleAvatarError(character: CharacterSummary | CharacterDetail) {
  const urls = character.avatarFallbackUrls.length ? character.avatarFallbackUrls : [character.avatarUrl];
  const index = avatarUrlIndex.value[character.fileName] || 0;
  if (index < urls.length - 1) {
    avatarUrlIndex.value = {
      ...avatarUrlIndex.value,
      [character.fileName]: index + 1,
    };
  }
}

function openCoverPicker() {
  if (!activePreview.value || updatingCover.value) return;
  coverInputElement.value?.click();
}

async function handleCoverFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file || !activePreview.value) return;
  await handleCoverFile(file, activePreview.value);
}

async function handleCoverFile(file: File, character: CharacterSummary | CharacterDetail) {
  const source: CharacterImportParseInput = {
    sourceKind: 'file',
    sourceName: file.name,
    blob: file,
    contentType: file.type,
  };

  if (await shouldTreatCoverFileAsCharacterCard(source)) {
    openImportDialog(character);
    await addImportFiles([file]);
    return;
  }

  if (!isCoverImageFile(file)) {
    managementStatus.value = '封面只支持 PNG、JPG、WebP；角色卡请使用 JSON 或带角色数据的 PNG。';
    return;
  }

  updatingCover.value = true;
  managementStatus.value = '';
  try {
    const result = await applyCharacterCoverMutation(character.fileName, file, file.name);
    if (!result.success) {
      managementStatus.value = result.message;
      return;
    }
    replaceOriginalAvatarUrl(character.fileName, URL.createObjectURL(file));
    await refreshList();
    selectedFile.value = character.fileName;
  } finally {
    updatingCover.value = false;
  }
}

async function shouldTreatCoverFileAsCharacterCard(source: CharacterImportParseInput): Promise<boolean> {
  if (/\.json$/i.test(source.sourceName) || source.contentType?.toLowerCase().includes('json')) return true;
  if (!/\.png$/i.test(source.sourceName) && !source.contentType?.toLowerCase().includes('png')) return false;
  try {
    await parseImportSource(source);
    return true;
  } catch {
    return false;
  }
}

function isCoverImageFile(file: File): boolean {
  return /^image\/(?:png|jpeg|webp)$/i.test(file.type) || /\.(?:png|jpe?g|webp)$/i.test(file.name);
}

function replaceOriginalAvatarUrl(fileName: string, url: string) {
  const previousUrl = originalAvatarUrls.value[fileName];
  if (previousUrl && previousUrl.startsWith('blob:')) {
    URL.revokeObjectURL(previousUrl);
  }
  originalAvatarUrls.value = {
    ...originalAvatarUrls.value,
    [fileName]: url,
  };
}

function revokeOriginalAvatarUrls() {
  Object.values(originalAvatarUrls.value).forEach(url => {
    if (url.startsWith('blob:')) URL.revokeObjectURL(url);
  });
  originalAvatarUrls.value = {};
}

function changeCardSize(delta: number) {
  cardSizeIndex.value = Math.min(Math.max(cardSizeIndex.value + delta, 0), cardSizes.length - 1);
}

function handleGalleryWheel(event: WheelEvent) {
  if (!event.ctrlKey || event.deltaY === 0) return;
  event.preventDefault();
  changeCardSize(event.deltaY < 0 ? 1 : -1);
}

function changeGreeting(delta: number) {
  const lastIndex = Math.max(greetingOptions.value.length - 1, 0);
  selectedGreetingIndex.value = Math.min(Math.max(selectedGreetingIndex.value + delta, 0), lastIndex);
}

function toggleSelectionMode() {
  selectionMode.value = !selectionMode.value;
  clearTagPreview();
  clearDeletePreview();
  resetRenameEditor();
  if (!selectionMode.value) {
    selectedFiles.value = new Set();
  }
}

function toggleCharacterSelection(fileName: string) {
  const next = new Set(selectedFiles.value);
  if (next.has(fileName)) {
    next.delete(fileName);
  } else {
    next.add(fileName);
  }
  selectedFiles.value = next;
  clearTagPreview();
  clearDeletePreview();
}

function selectVisibleCharacters() {
  selectedFiles.value = new Set([...selectedFiles.value, ...visibleCharacters.value.map(character => character.fileName)]);
  clearTagPreview();
  clearDeletePreview();
}

function clearSelection() {
  selectedFiles.value = new Set();
  clearTagPreview();
  clearDeletePreview();
}

function buildTagDraft() {
  return {
    action: tagAction.value,
    fileNames: selectedFileList.value,
    tagId: tagAction.value === 'create' ? undefined : selectedTagId.value,
    tagName: tagAction.value === 'create' ? newTagName.value : undefined,
  };
}

function previewTagChanges() {
  tagPreview.value = previewTagMutation(tavernTags.value, tagMap.value, buildTagDraft());
  tagStatus.value = '';
}

function clearTagPreview() {
  tagPreview.value = null;
  tagStatus.value = '';
}

function clearDeletePreview() {
  deletePreview.value = null;
  deleteConfirmText.value = '';
}

function openTagDialog() {
  if (!activePreview.value) return;
  detailTagName.value = '';
  managementStatus.value = '';
  tagDialogOpen.value = true;
}

function closeTagDialog() {
  tagDialogOpen.value = false;
  detailTagName.value = '';
  applyingDetailTag.value = false;
}

async function removeDetailTag(tag: CharacterTag) {
  if (!activePreview.value || applyingDetailTag.value) return;
  applyingDetailTag.value = true;
  managementStatus.value = '';
  try {
    const result = await applyTagMutation({
      action: 'remove',
      fileNames: [activePreview.value.fileName],
      tagId: tag.id,
    });
    if (result.success) {
      await refreshList();
    } else {
      managementStatus.value = result.message;
    }
  } finally {
    applyingDetailTag.value = false;
  }
}

async function toggleDetailTag(tag: CharacterTag) {
  if (!activePreview.value || applyingDetailTag.value) return;
  applyingDetailTag.value = true;
  managementStatus.value = '';
  try {
    const result = await applyTagMutation({
      action: detailActiveTagIds.value.has(tag.id) ? 'remove' : 'add',
      fileNames: [activePreview.value.fileName],
      tagId: tag.id,
    });
    if (result.success) {
      await refreshList();
    } else {
      managementStatus.value = result.message;
    }
  } finally {
    applyingDetailTag.value = false;
  }
}

async function confirmCustomDetailTag() {
  if (!activePreview.value || applyingDetailTag.value) return;
  const customName = detailTagName.value.trim();
  if (!customName) return;
  applyingDetailTag.value = true;
  managementStatus.value = '';
  try {
    const result = await applyTagMutation({
      action: 'create',
      fileNames: [activePreview.value.fileName],
      tagName: customName,
    });
    if (result.success) {
      detailTagName.value = '';
      await refreshList();
    } else {
      managementStatus.value = result.message;
    }
  } finally {
    applyingDetailTag.value = false;
  }
}

async function confirmTagChanges() {
  if (!tagPreview.value || tagPreview.value.errors.length > 0) return;
  applyingTags.value = true;
  tagStatus.value = '';
  try {
    const result = await applyTagMutation(buildTagDraft());
    tagStatus.value = result.message;
    tagPreview.value = result.preview;
    if (result.success) {
      tagPreview.value = null;
      await refreshList();
    }
  } finally {
    applyingTags.value = false;
  }
}

function setFavoriteBusy(fileName: string, busy: boolean) {
  const next = new Set(applyingFavoriteFiles.value);
  if (busy) {
    next.add(fileName);
  } else {
    next.delete(fileName);
  }
  applyingFavoriteFiles.value = next;
}

function setCharacterFavorite(fileName: string, fav: boolean) {
  characters.value = characters.value.map(character => (character.fileName === fileName ? { ...character, fav } : character));
  if (selectedDetail.value?.fileName === fileName) {
    selectedDetail.value = { ...selectedDetail.value, fav };
  }
}

function setCharacterSourceUrl(fileName: string, sourceUrl: string) {
  characters.value = characters.value.map(character => (character.fileName === fileName ? { ...character, sourceUrl } : character));
  if (selectedDetail.value?.fileName === fileName) {
    selectedDetail.value = { ...selectedDetail.value, sourceUrl };
  }
}

function setCharacterUserNote(fileName: string, userNote: string) {
  characters.value = characters.value.map(character => (character.fileName === fileName ? { ...character, userNote } : character));
  if (selectedDetail.value?.fileName === fileName) {
    selectedDetail.value = { ...selectedDetail.value, userNote };
  }
}

async function saveSourceUrl() {
  if (!activePreview.value || savingSourceUrl.value) return;
  const fileName = activePreview.value.fileName;
  const nextUrl = sourceUrlDraft.value.trim();
  if (nextUrl === (activePreview.value.sourceUrl || '')) return;

  savingSourceUrl.value = true;
  sourceUrlError.value = '';
  try {
    const result = await applySourceUrlMutation(fileName, nextUrl);
    if (result.success) {
      setCharacterSourceUrl(fileName, result.sourceUrl);
    } else {
      sourceUrlDraft.value = activePreview.value?.sourceUrl || result.sourceUrl;
      sourceUrlError.value = result.message;
    }
  } finally {
    savingSourceUrl.value = false;
  }
}

async function clearSourceUrl() {
  if (savingSourceUrl.value || !sourceUrlDraft.value.trim()) return;
  sourceUrlDraft.value = '';
  await saveSourceUrl();
}

function openSourceUrl() {
  if (!canOpenSourceUrl.value) return;
  window.open(sourceUrlDraft.value.trim(), '_blank', 'noopener,noreferrer');
}

async function saveUserNote() {
  if (!activePreview.value || savingUserNote.value) return;
  const fileName = activePreview.value.fileName;
  const nextUserNote = userNoteDraft.value.trim();
  if (nextUserNote === (activePreview.value.userNote || '')) return;

  savingUserNote.value = true;
  userNoteError.value = '';
  try {
    const result = await applyUserNoteMutation(fileName, nextUserNote);
    if (result.success) {
      setCharacterUserNote(fileName, result.userNote);
    } else {
      userNoteDraft.value = activePreview.value?.userNote || result.userNote;
      userNoteError.value = result.message;
    }
  } finally {
    savingUserNote.value = false;
  }
}

async function applyFavoriteChange(character: CharacterSummary, nextFav: boolean, refreshAfterSuccess = true) {
  if (applyingFavoriteFiles.value.has(character.fileName)) return;
  managementStatus.value = '';
  setFavoriteBusy(character.fileName, true);
  setCharacterFavorite(character.fileName, nextFav);
  try {
    const result = await applyFavoriteMutation(character.fileName, nextFav);
    if (result.success) {
      if (refreshAfterSuccess) await refreshList();
    } else {
      managementStatus.value = result.message;
      setCharacterFavorite(character.fileName, result.fav);
    }
    return result.success;
  } finally {
    setFavoriteBusy(character.fileName, false);
  }
}

async function toggleFavorite(character: CharacterSummary) {
  await applyFavoriteChange(character, !character.fav);
}

async function applyFavoriteToSelection(nextFav: boolean) {
  const targets = selectedCharacters.value.filter(character => character.fav !== nextFav);
  if (targets.length === 0 || applyingBatchFavorite.value) {
    managementStatus.value = nextFav ? '选中角色已经全部收藏。' : '选中角色已经全部取消收藏。';
    return;
  }
  applyingBatchFavorite.value = true;
  let successCount = 0;
  const failedNames: string[] = [];
  try {
    for (const character of targets) {
      const success = await applyFavoriteChange(character, nextFav, false);
      if (success) {
        successCount += 1;
      } else {
        failedNames.push(character.name);
      }
    }
    await refreshList();
    managementStatus.value = failedNames.length
      ? `收藏写入完成：成功 ${successCount} 项，失败 ${failedNames.length} 项：${failedNames.slice(0, 3).join('、')}`
      : `收藏写入完成：成功 ${successCount} 项。`;
  } finally {
    applyingBatchFavorite.value = false;
  }
}

async function downloadCharacter(character: CharacterSummary) {
  managementStatus.value = '';
  const result = await downloadCharacterFile(character.fileName);
  if (!result.success) managementStatus.value = result.message;
}

async function exportSelectedZip() {
  if (selectedFileList.value.length === 0 || exportingFiles.value) return;
  exportingFiles.value = true;
  managementStatus.value = '';
  try {
    const result = await exportCharactersZip(selectedFileList.value);
    if (!result.success) managementStatus.value = result.message;
  } finally {
    exportingFiles.value = false;
  }
}

async function previewSelectedDeletion() {
  if (selectedFileList.value.length === 0 || applyingDeletion.value) return;
  managementStatus.value = '';
  deleteConfirmText.value = '';
  deletePreview.value = await previewCharacterDeletion(
    selectedFileList.value,
    {
      backupCharacters: deleteBackupCharacters.value,
      deleteChats: deleteChats.value,
      deleteWorldBooks: deleteWorldBooks.value,
    },
    characters.value,
  );
}

async function previewActiveDeletion() {
  if (!activePreview.value || applyingDeletion.value) return;
  selectionMode.value = true;
  selectedFiles.value = new Set([activePreview.value.fileName]);
  clearTagPreview();
  await previewSelectedDeletion();
}

async function confirmDeletion() {
  if (!deletePreview.value || !canConfirmDeletion.value) return;
  applyingDeletion.value = true;
  managementStatus.value = '';
  try {
    const results = await applyCharacterDeletion(deletePreview.value);
    const successCount = results.filter(result => result.success).length;
    const failedCount = results.length - successCount;
    managementStatus.value = failedCount
      ? `删除完成：成功 ${successCount} 项，失败 ${failedCount} 项。`
      : `删除完成：成功 ${successCount} 项。`;
    selectedFiles.value = new Set([...selectedFiles.value].filter(fileName => !results.some(result => result.fileName === fileName && result.success)));
    deletePreview.value = null;
    deleteConfirmText.value = '';
    await refreshList();
  } finally {
    applyingDeletion.value = false;
  }
}

async function toggleChats() {
  if (!activePreview.value) return;
  chatsExpanded.value = !chatsExpanded.value;
  if (chatsExpanded.value) {
    await loadChats(activePreview.value.fileName);
  }
}

async function loadChats(fileName: string) {
  const current = chatStates.value[fileName];
  if (current?.loading || current?.chats.length) return;
  chatStates.value = {
    ...chatStates.value,
    [fileName]: { loading: true, error: '', chats: current?.chats || [] },
  };
  try {
    const chats = await readCharacterChats(fileName);
    chatStates.value = {
      ...chatStates.value,
      [fileName]: { loading: false, error: '', chats },
    };
  } catch (error) {
    chatStates.value = {
      ...chatStates.value,
      [fileName]: { loading: false, error: formatError(error), chats: [] },
    };
  }
}

async function downloadActiveChats() {
  if (!activePreview.value) return;
  const result = await downloadCharacterChats(activePreview.value.fileName);
  if (!result.success) managementStatus.value = result.message;
}

function getChatAliasKey(chat: CharacterChatSummary): string {
  return `${activePreview.value?.fileName || ''}__${chat.fileName}`;
}

function getChatDisplayTitle(chat: CharacterChatSummary): string {
  return chatAliases.value[getChatAliasKey(chat)] || chat.title;
}

function saveChatAlias(chat: CharacterChatSummary, value: string) {
  const key = getChatAliasKey(chat);
  const nextTitle = value.trim();
  if (nextTitle && nextTitle !== chat.title) {
    chatAliases.value = { ...chatAliases.value, [key]: nextTitle };
  } else {
    const { [key]: _removed, ...rest } = chatAliases.value;
    chatAliases.value = rest;
  }
  saveChatAliases();
}

function commitChatAlias(chat: CharacterChatSummary, event: Event) {
  saveChatAlias(chat, (event.target as HTMLInputElement).value);
}

async function downloadChat(chat: CharacterChatSummary) {
  if (!activePreview.value) return;
  const result = await downloadCharacterChats(activePreview.value.fileName, [chat.id]);
  if (!result.success) managementStatus.value = result.message;
}

async function deleteChat(chat: CharacterChatSummary) {
  if (!activePreview.value) return;
  const title = getChatDisplayTitle(chat);
  if (!window.confirm(`确认删除聊天记录“${title}”？此操作不会删除角色卡。`)) return;
  const fileName = activePreview.value.fileName;
  const key = getChatAliasKey(chat);
  deletingChatKeys.value = new Set([...deletingChatKeys.value, key]);
  managementStatus.value = '';
  try {
    const result = await deleteCharacterChat(fileName, chat);
    if (!result.success) {
      managementStatus.value = result.message;
      return;
    }
    const current = chatStates.value[fileName];
    if (current) {
      chatStates.value = {
        ...chatStates.value,
        [fileName]: { ...current, chats: current.chats.filter(item => item.id !== chat.id) },
      };
    }
    if (expandedChatKey.value === key) expandedChatKey.value = '';
    const { [key]: _content, ...restContentStates } = chatContentStates.value;
    chatContentStates.value = restContentStates;
    const { [key]: _alias, ...restAliases } = chatAliases.value;
    chatAliases.value = restAliases;
    saveChatAliases();
  } finally {
    const next = new Set(deletingChatKeys.value);
    next.delete(key);
    deletingChatKeys.value = next;
  }
}

async function toggleChatContent(chat: CharacterChatSummary) {
  if (!activePreview.value) return;
  const key = getChatAliasKey(chat);
  if (expandedChatKey.value === key) {
    expandedChatKey.value = '';
    return;
  }
  expandedChatKey.value = key;
  const current = chatContentStates.value[key];
  if (current?.loading || current?.content) return;
  chatContentStates.value = {
    ...chatContentStates.value,
    [key]: { loading: true, error: '', content: null },
  };
  try {
    const content = await readCharacterChatContent(activePreview.value.fileName, chat);
    chatContentStates.value = {
      ...chatContentStates.value,
      [key]: { loading: false, error: '', content },
    };
  } catch (error) {
    chatContentStates.value = {
      ...chatContentStates.value,
      [key]: { loading: false, error: formatError(error), content: null },
    };
  }
}

async function openChat(chat: CharacterChatSummary) {
  if (!activePreview.value) return;
  const result = await openCharacterChat(activePreview.value.fileName, chat.fileName);
  if (result.success) {
    requestClose();
    return;
  }
  managementStatus.value = result.message;
}

async function launchCharacter(character: CharacterSummary | CharacterDetail | null = activePreview.value) {
  if (!character || selectionMode.value || launchingFileName.value) return;
  launchingFileName.value = character.fileName;
  managementStatus.value = '';
  try {
    const result = await openCharacterChat(character.fileName);
    if (result.success) {
      requestClose();
      return;
    }
    managementStatus.value = result.message;
  } finally {
    launchingFileName.value = '';
  }
}

function getChatContentPreview(chat: CharacterChatSummary): string {
  const state = chatContentStates.value[getChatAliasKey(chat)];
  if (state?.loading) return '正在读取聊天内容...';
  if (state?.error) return state.error;
  if (!state?.content) return '';
  return formatReadableChatContent(state.content.content);
}

function formatReadableChatContent(content: unknown): string {
  const parsed = parseMaybeJson(content);
  const messages = extractChatMessages(parsed);
  if (messages.length === 0) return '没有可显示的聊天正文。';
  return truncate(messages.join('\n\n'), '', 1400);
}

function parseMaybeJson(content: unknown): unknown {
  if (typeof content !== 'string') return content;
  try {
    return JSON.parse(content);
  } catch {
    return content;
  }
}

function extractChatMessages(content: unknown): string[] {
  if (Array.isArray(content)) {
    return content.flatMap(extractChatMessages);
  }
  if (!content || typeof content !== 'object') {
    return typeof content === 'string' ? [stripChatMarkup(content)] : [];
  }

  const record = content as Record<string, unknown>;
  if (Array.isArray(record.messages)) return extractChatMessages(record.messages);
  if (Array.isArray(record.chat)) return extractChatMessages(record.chat);
  if (Array.isArray(record.data)) return extractChatMessages(record.data);

  const message = typeof record.mes === 'string' ? record.mes : typeof record.message === 'string' ? record.message : '';
  if (!message.trim()) return [];
  const speaker =
    typeof record.name === 'string' && record.name.trim()
      ? record.name.trim()
      : record.is_user === true
        ? '用户'
        : record.is_user === false
          ? '角色'
          : '';
  const text = stripChatMarkup(message);
  return [speaker ? `${speaker}：${text}` : text];
}

function stripChatMarkup(text: string): string {
  return text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .trim();
}

function resetRenameEditor() {
  renameInput.value = activePreview.value?.name || '';
  applyingRename.value = false;
}

async function saveInlineRename() {
  if (!renamePreview.value || !canSaveRename.value) return;
  if (renamePreview.value.errors.length > 0) {
    managementStatus.value = renamePreview.value.errors.join(' ');
    return;
  }
  applyingRename.value = true;
  managementStatus.value = '';
  try {
    const result = await applyCharacterRename(renamePreview.value);
    if (result.success && result.newFileName) {
      selectedFile.value = result.newFileName;
      selectedFiles.value = new Set([...selectedFiles.value].map(fileName => (fileName === result.oldFileName ? result.newFileName! : fileName)));
      await refreshList();
    } else {
      managementStatus.value = result.message;
      resetRenameEditor();
    }
  } finally {
    applyingRename.value = false;
  }
}

async function handleImportFiles(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files?.length) return;
  await addImportFiles(Array.from(input.files));
  input.value = '';
}

async function addImportFiles(files: File[]) {
  if (isImportReplaceMode.value && files.length !== 1) {
    importStatus.value = '替换当前角色时一次只能选择一个 JSON 或 PNG。';
    return;
  }
  parsingImports.value = true;
  importStatus.value = '';
  try {
    for (const file of files) {
      await addImportSource({ sourceKind: 'file', sourceName: file.name, blob: file, contentType: file.type });
    }
  } finally {
    parsingImports.value = false;
  }
}

async function addImportUrl() {
  const url = importUrl.value.trim();
  if (!url) return;
  if (isImportReplaceMode.value && /\.(?:zip)(?:[?#].*)?$/i.test(url)) {
    importStatus.value = '替换当前角色不支持 ZIP，请选择单个 JSON 或 PNG。';
    return;
  }
  parsingImports.value = true;
  importStatus.value = '';
  try {
    const source = await fetchImportSource(url);
    await addImportSource(source);
    importUrl.value = '';
  } catch (error) {
    await addFailedImportCandidate(createEmptyImportSource('url', url), error);
  } finally {
    parsingImports.value = false;
  }
}

async function addImportSource(source: CharacterImportParseInput) {
  try {
    const sources = await expandImportSources(source);
    if (isImportReplaceMode.value && sources.length !== 1) {
      throw new Error('替换当前角色不支持 ZIP 或多个候选项，请选择单个 JSON 或 PNG。');
    }
    for (const item of sources) {
      const candidate = await buildImportCandidate(
        item,
        characters.value,
        tavernTags.value,
        tagMap.value,
        readCharacterDetail,
        importReplaceTarget.value || undefined,
      );
      pushImportCandidate(candidate);
    }
  } catch (error) {
    await addFailedImportCandidate(createEmptyImportSource(source.sourceKind, source.sourceName), error);
  }
}

function createEmptyImportSource(sourceKind: CharacterImportSourceKind, sourceName: string): CharacterImportParseInput {
  return {
    sourceKind,
    sourceName,
    blob: new Blob([], { type: 'application/json' }),
    contentType: 'application/json',
  };
}

async function addFailedImportCandidate(source: CharacterImportParseInput, error: unknown) {
  const message = formatError(error);
  const candidate = await buildImportCandidate(
    source,
    characters.value,
    tavernTags.value,
    tagMap.value,
    readCharacterDetail,
    importReplaceTarget.value || undefined,
  );
  candidate.status = 'error';
  candidate.issues = [{ level: 'error', message }];
  candidate.resultMessage = message;
  pushImportCandidate(candidate);
}

function pushImportCandidate(candidate: CharacterImportCandidate) {
  if (candidate.format === 'png' && candidate.blob.size > 0 && typeof URL.createObjectURL === 'function') {
    importAvatarUrls.value = {
      ...importAvatarUrls.value,
      [candidate.id]: URL.createObjectURL(candidate.blob),
    };
  }
  importCandidates.value = [...importCandidates.value, candidate];
  selectedImportId.value = candidate.id;
}

function removeImportCandidate(id: string) {
  revokeImportAvatarUrl(id);
  importCandidates.value = importCandidates.value.filter(candidate => candidate.id !== id);
  if (selectedImportId.value === id) {
    selectedImportId.value = importCandidates.value[0]?.id || '';
  }
}

function clearImportCandidates() {
  revokeImportAvatarUrls();
  importCandidates.value = [];
  selectedImportId.value = '';
  importStatus.value = '';
}

function revokeImportAvatarUrl(id: string) {
  const url = importAvatarUrls.value[id];
  if (!url) return;
  URL.revokeObjectURL(url);
  const { [id]: _removed, ...rest } = importAvatarUrls.value;
  importAvatarUrls.value = rest;
}

function revokeImportAvatarUrls() {
  Object.keys(importAvatarUrls.value).forEach(revokeImportAvatarUrl);
}

async function confirmImports() {
  if (!canConfirmImports.value) return;
  applyingImports.value = true;
  importStatus.value = '';
  let shouldCloseDialog = false;
  try {
    const results = await applyCharacterImport(importCandidates.value);
    importCandidates.value = importCandidates.value.map(candidate => {
      const result = results.find(item => item.id === candidate.id);
      if (!result) return candidate;
      return {
        ...candidate,
        status: result.success ? 'success' : 'failed',
        resultMessage: result.message,
      };
    });
    const successCount = results.filter(result => result.success).length;
    const failedCount = results.length - successCount;
    if (successCount > 0) {
      await refreshList();
    }
    if (failedCount === 0) {
      shouldCloseDialog = true;
    } else {
      importStatus.value = `导入完成：成功 ${successCount} 项，失败 ${failedCount} 项。`;
    }
  } finally {
    applyingImports.value = false;
    if (shouldCloseDialog) closeImportDialog();
  }
}

function formatSelectedTags(): string {
  const items = Object.values(selectedTagDistribution.value).sort((lhs, rhs) =>
    rhs.count === lhs.count ? lhs.tag.name.localeCompare(rhs.tag.name, 'zh-CN') : rhs.count - lhs.count,
  );
  if (items.length === 0) return '无标签';
  return items
    .slice(0, 6)
    .map(item => `${item.tag.name} ${item.count}`)
    .join('、');
}

async function loadOriginalAvatar(character: CharacterSummary | CharacterDetail) {
  if (
    !character.fileName ||
    originalAvatarUrls.value[character.fileName] ||
    loadingOriginalAvatars.has(character.fileName)
  ) {
    return;
  }

  loadingOriginalAvatars.add(character.fileName);
  try {
    const url = await loadCharacterOriginalImage(character.fileName);
    replaceOriginalAvatarUrl(character.fileName, url);
  } catch {
    // 继续使用普通 URL 和缩略图兜底。
  } finally {
    loadingOriginalAvatars.delete(character.fileName);
  }
}

function requestClose() {
  const closeManager = (window.parent as typeof window & { closeCharacterCardManager?: () => void })?.closeCharacterCardManager;
  if (typeof closeManager === 'function') {
    closeManager();
    return;
  }
  window.parent?.postMessage({ source: 'character-card-manager', type: 'close' }, '*');
}

function formatImportAction(candidate: CharacterImportCandidate): string {
  if (candidate.status === 'error') return '解析失败';
  if (candidate.status === 'success') return '已完成';
  if (candidate.status === 'failed') return '写入失败';
  if (candidate.replaceTargetFileName) return '替换';
  return candidate.action === 'update' ? '更新' : '新增';
}

function formatImportIssue(candidate: CharacterImportCandidate): string {
  return candidate.resultMessage || candidate.issues.map(issue => issue.message).join(' ');
}

function getImportWorldBookSummary(candidate: CharacterImportCandidate): string {
  const worldBookRow = candidate.diff
    .find(group => group.id === 'gameplay')
    ?.rows.find(row => row.label === '世界书');
  if (!worldBookRow) return '无世界书变更';
  const lines = getImportDiffLines(worldBookRow)
    .map(line => `${line.label}：${line.value}`)
    .join('；');
  return lines || '无世界书变更';
}

function getImportDiffLines(row: CharacterImportDiffRow): ImportDiffLine[] {
  const oldValue = hasImportDiffValue(row.oldValue) ? row.oldValue : '';
  const newValue = hasImportDiffValue(row.newValue) ? row.newValue : '';
  const finalValue = hasImportDiffValue(row.finalValue) ? row.finalValue : '';

  if (!oldValue && newValue && (!finalValue || finalValue === newValue)) {
    return [{ label: '新增', value: newValue, primary: true }];
  }
  if (!oldValue && !newValue && finalValue) {
    return [{ label: '说明', value: finalValue, primary: true }];
  }
  if (row.preserved && finalValue) {
    return [{ label: '保留', value: finalValue, primary: true }];
  }
  if (oldValue && !newValue && !finalValue) {
    return [{ label: '移除', value: oldValue, primary: true }];
  }
  if (oldValue && (!newValue || newValue === oldValue) && (!finalValue || finalValue === oldValue)) {
    return [{ label: '不变', value: oldValue, primary: false }];
  }

  const lines: ImportDiffLine[] = [];
  if (oldValue) lines.push({ label: '旧', value: oldValue, primary: false });
  if (newValue && newValue !== oldValue) lines.push({ label: oldValue ? '新' : '新增', value: newValue, primary: !oldValue });
  if (finalValue && finalValue !== newValue && finalValue !== oldValue) lines.push({ label: '结果', value: finalValue, primary: true });
  return lines;
}

function hasImportDiffValue(value: string): boolean {
  const normalized = value.trim();
  return normalized !== '' && normalized !== '无';
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error || '未知错误');
}
</script>

<template>
  <main class="cm-shell" aria-label="角色卡管理器">
    <header class="cm-header">
      <div>
        <h1>角色卡管理器 <span>v{{ APP_VERSION }}</span></h1>
      </div>
      <div class="cm-header-actions" aria-label="面板操作">
        <button
          class="cm-header-primary"
          type="button"
          title="导入/更新"
          aria-label="导入/更新"
          @click="openImportDialog()"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M12 3v10m0-10 4 4m-4-4-4 4M5 14v5h14v-5" />
          </svg>
        </button>
        <button
          class="cm-icon-button"
          type="button"
          title="设置"
          :aria-pressed="settingsOpen"
          @click="settingsOpen = true"
        >
          ⚙
        </button>
        <button class="cm-icon-button" type="button" title="刷新列表" :disabled="loadingList" @click="refreshList">
          ↻
        </button>
        <button class="cm-icon-button danger" type="button" title="关闭面板" @click="requestClose">
          ×
        </button>
      </div>
    </header>

    <section
      class="cm-workspace"
      :class="{ 'left-collapsed': leftCollapsed, 'right-collapsed': rightCollapsed }"
    >
      <aside class="cm-controls" aria-label="标签筛选和读取提示" :aria-hidden="leftCollapsed">
        <section class="cm-tag-filter" aria-label="标签筛选">
          <div class="cm-side-heading">
            <strong>标签</strong>
            <button
              class="cm-clear-tags"
              type="button"
              title="清空已选标签"
              aria-label="清空已选标签"
              :disabled="activeTagIds.length === 0 && activeFilter === 'all'"
              @click="clearTagFilters"
            >
              ⌫
            </button>
          </div>
          <button
            v-for="item in sideFilters"
            :key="item.id"
            type="button"
            :class="{ active: activeFilter === item.id && activeTagIds.length === 0 }"
            :aria-pressed="activeFilter === item.id && activeTagIds.length === 0"
            @click="activateFilter(item.id)"
          >
            <span>{{ item.label }}</span>
            <strong>{{ filterCounts[item.id] }}</strong>
          </button>
          <div v-if="ordinaryTavernTags.length === 0" class="cm-side-empty">暂无酒馆标签</div>
          <button
            v-for="tag in ordinaryTavernTags"
            :key="tag.id"
            type="button"
            :class="{ active: activeTagIds.includes(tag.id) }"
            :aria-pressed="activeTagIds.includes(tag.id)"
            @click="activateTagFilter(tag.id)"
          >
            <span>
              {{ tag.name }}
            </span>
            <strong>{{ tagCounts[tag.id] || 0 }}</strong>
          </button>
        </section>

        <div v-if="globalIssues.length" class="cm-issue-box" role="status">
          <strong>读取提示</strong>
          <p v-for="issue in globalIssues" :key="issue">{{ issue }}</p>
        </div>
      </aside>

      <button
        class="cm-panel-toggle left"
        type="button"
        :title="leftCollapsed ? '展开左栏' : '收起左栏'"
        :aria-label="leftCollapsed ? '展开左栏' : '收起左栏'"
        :aria-pressed="leftCollapsed"
        @click="leftCollapsed = !leftCollapsed"
      ></button>

      <section class="cm-list-panel" aria-label="角色缩略图列表">
        <div class="cm-list-head">
          <div class="cm-list-status">
            <strong>{{ visibleCharacters.length }} 个匹配项</strong>
          </div>
          <label class="cm-field cm-search-field">
            <span>搜索</span>
            <input v-model="query" type="search" placeholder="名称、作者、文件名、描述" />
          </label>
          <label class="cm-field cm-sort-field">
            <span>排序</span>
            <select v-model="sortBy">
              <option value="date_added">导入时间</option>
              <option value="date_last_chat">最后聊天</option>
              <option value="name">名称</option>
            </select>
          </label>
          <div class="cm-list-tools">
            <button
              class="cm-selection-toggle"
              type="button"
              :aria-pressed="selectionMode"
              @click="toggleSelectionMode"
            >
              {{ selectionMode ? '退出选择' : '选择' }}
            </button>
            <template v-if="selectionMode">
              <button type="button" @click="selectVisibleCharacters">全选当前</button>
              <button type="button" @click="clearSelection">清空</button>
              <output>{{ selectedCharacters.length }} 已选</output>
            </template>
          </div>
          <div class="cm-gallery-tools" aria-label="卡片大小">
            <button
              type="button"
              title="缩小卡片"
              :disabled="cardSizeIndex === 0"
              @click="changeCardSize(-1)"
            >
              −
            </button>
            <output>{{ cardSize.label }}</output>
            <button
              type="button"
              title="放大卡片"
              :disabled="cardSizeIndex === cardSizes.length - 1"
              @click="changeCardSize(1)"
            >
              +
            </button>
          </div>
        </div>

        <div v-if="!loadingList && visibleCharacters.length === 0" class="cm-empty">
          没有匹配的角色卡，调整搜索或刷新列表。
        </div>

        <div v-else ref="galleryElement" class="cm-card-grid" :style="cardGridStyle" @wheel="handleGalleryWheel">
          <article
            v-for="character in visibleCharacters"
            :key="character.fileName"
            role="button"
            :aria-label="character.name"
            tabindex="0"
            class="cm-card"
            :class="{ active: selectedFile === character.fileName, selected: selectedFiles.has(character.fileName) }"
            @click="selectCharacter(character)"
            @dblclick.stop="launchCharacter(character)"
            @keydown.enter="selectCharacter(character)"
            @keydown.space.prevent="selectCharacter(character)"
          >
            <label v-if="selectionMode" class="cm-card-check" @click.stop>
              <input
                type="checkbox"
                :checked="selectedFiles.has(character.fileName)"
                :aria-label="`选择 ${character.name}`"
                @change="toggleCharacterSelection(character.fileName)"
              />
            </label>
            <span class="cm-thumb">
              <img
                :src="getAvatarSrc(character)"
                :alt="character.name"
                loading="lazy"
                @error="handleAvatarError(character)"
              />
              <span v-if="character.tags.length" class="cm-card-tags" aria-hidden="true">
                <b v-for="tag in character.tags.slice(0, 8)" :key="tag.id">{{ tag.name }}</b>
                <b v-if="character.tags.length > 8">+{{ character.tags.length - 8 }}</b>
              </span>
              <span class="cm-card-text">
                <strong>{{ character.name }}</strong>
              </span>
              <span class="cm-card-actions" aria-label="角色快捷操作">
                <button
                  type="button"
                  :title="character.fav ? '取消收藏' : '收藏'"
                  :aria-label="`${character.fav ? '取消收藏' : '收藏'} ${character.name}`"
                  :aria-pressed="character.fav"
                  :disabled="applyingFavoriteFiles.has(character.fileName)"
                  class="cm-card-action"
                  :class="{ active: character.fav }"
                  @click.stop="toggleFavorite(character)"
                >
                  {{ character.fav ? '★' : '☆' }}
                </button>
                <button
                  type="button"
                  title="下载角色卡"
                  :aria-label="`下载 ${character.name}`"
                  class="cm-card-action"
                  @click.stop="downloadCharacter(character)"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path d="M12 3v11m0 0 4-4m-4 4-4-4M5 17v3h14v-3" />
                  </svg>
                </button>
              </span>
            </span>
          </article>
        </div>
      </section>

      <button
        class="cm-panel-toggle right"
        type="button"
        :title="rightCollapsed ? '展开右栏' : '收起右栏'"
        :aria-label="rightCollapsed ? '展开右栏' : '收起右栏'"
        :aria-pressed="rightCollapsed"
        @click="rightCollapsed = !rightCollapsed"
      ></button>

      <section class="cm-preview" aria-label="角色详情预览" :aria-hidden="rightCollapsed">
        <p v-if="managementStatus" class="cm-inline-status global">{{ managementStatus }}</p>

        <template v-if="showSelectionSummary">
          <div class="cm-selection-summary">
            <h2>{{ selectedCharacters.length }} 个已选角色</h2>
            <dl class="cm-meta-list compact">
              <div>
                <dt>收藏</dt>
                <dd>{{ selectedFavoriteCount }}</dd>
              </div>
              <div>
                <dt>缺开场</dt>
                <dd>{{ selectedMissingGreetingCount }}</dd>
              </div>
              <div>
                <dt>异常</dt>
                <dd>{{ selectedErrorCount }}</dd>
              </div>
              <div>
                <dt>标签</dt>
                <dd>{{ formatSelectedTags() }}</dd>
              </div>
            </dl>
            <div class="cm-management-actions">
              <button class="cm-secondary-action" type="button" :disabled="selectedCharacters.length === 0 || applyingBatchFavorite" @click="applyFavoriteToSelection(true)">
                全部收藏
              </button>
              <button class="cm-secondary-action" type="button" :disabled="selectedCharacters.length === 0 || applyingBatchFavorite" @click="applyFavoriteToSelection(false)">
                取消收藏
              </button>
              <button class="cm-primary-action" type="button" :disabled="selectedCharacters.length === 0 || exportingFiles" @click="exportSelectedZip">
                {{ exportingFiles ? '正在导出...' : '导出 ZIP' }}
              </button>
            </div>
          </div>

          <section class="cm-danger-zone" aria-label="批量删除">
            <h3>删除</h3>
            <label>
              <input v-model="deleteBackupCharacters" type="checkbox" @change="clearDeletePreview" />
              删除前导出 ZIP 备份
            </label>
            <label>
              <input v-model="deleteChats" type="checkbox" @change="clearDeletePreview" />
              同时删除聊天记录
            </label>
            <label>
              <input v-model="deleteWorldBooks" type="checkbox" @change="clearDeletePreview" />
              删除导入的内嵌世界书
            </label>
            <button class="cm-danger-action" type="button" :disabled="selectedCharacters.length === 0 || applyingDeletion" @click="previewSelectedDeletion">
              预览删除
            </button>

            <div v-if="deletePreview" class="cm-delete-preview">
              <p v-for="error in deletePreview.errors" :key="error" class="error">{{ error }}</p>
              <p v-for="warning in deletePreview.warnings" :key="warning" class="warning">{{ warning }}</p>
              <article v-for="target in deletePreview.targets" :key="target.fileName">
                <strong>{{ target.name }}</strong>
                <span>{{ target.fileName }}</span>
                <span>聊天：{{ target.chats.length }} 条{{ target.willDeleteChats ? '，将删除' : '' }}</span>
                <span>
                  世界书：{{ target.worldBook.name || '无' }}
                  <template v-if="target.willDeleteWorldBook">，将删除</template>
                  <template v-else-if="target.worldBook.type !== 'none'">，跳过：{{ target.worldBook.reason }}</template>
                </span>
                <span>标签：{{ target.tagNames.length ? target.tagNames.join('、') : '无' }}</span>
                <p v-for="issue in target.issues" :key="issue.message" :class="issue.level">{{ issue.message }}</p>
              </article>
              <label v-if="deletePreview.requiresDeleteText" class="cm-field">
                <span>输入 DELETE 确认批量删除</span>
                <input v-model="deleteConfirmText" type="text" autocomplete="off" />
              </label>
              <button class="cm-danger-action strong" type="button" :disabled="!canConfirmDeletion" @click="confirmDeletion">
                {{ applyingDeletion ? '正在删除...' : `确认删除 ${deletePreview.targets.length} 项` }}
              </button>
            </div>
          </section>

          <section class="cm-tag-editor" aria-label="批量标签操作">
            <h3>标签操作</h3>
            <label class="cm-field">
              <span>操作</span>
              <select v-model="tagAction" @change="clearTagPreview">
                <option value="add">添加已有标签</option>
                <option value="remove">移除已有标签</option>
                <option value="create">新建并绑定</option>
              </select>
            </label>
            <label v-if="tagAction !== 'create'" class="cm-field">
              <span>标签</span>
              <select v-model="selectedTagId" @change="clearTagPreview">
                <option v-for="tag in tavernTags" :key="tag.id" :value="tag.id">{{ tag.name }}</option>
              </select>
            </label>
            <label v-else class="cm-field">
              <span>新标签名称</span>
              <input v-model="newTagName" type="text" placeholder="例如：待整理" @input="clearTagPreview" />
            </label>
            <button class="cm-primary-action" type="button" :disabled="selectedCharacters.length === 0" @click="previewTagChanges">
              预览变更
            </button>

            <div v-if="tagPreview" class="cm-mutation-preview">
              <strong>变更预览</strong>
              <p v-if="tagPreview.errors.length" class="error">{{ tagPreview.errors.join(' ') }}</p>
              <template v-else>
                <p>
                  {{ tagPreview.createsTag ? '新建并绑定' : tagAction === 'remove' ? '移除' : '添加' }}
                  “{{ tagPreview.tagName }}”，会更新 {{ tagPreview.changedFileNames.length }} 个角色。
                </p>
                <p v-if="tagPreview.unchangedFileNames.length">
                  {{ tagPreview.unchangedFileNames.length }} 个角色无变化。
                </p>
                <button
                  class="cm-primary-action"
                  type="button"
                  :disabled="applyingTags || tagPreview.changedFileNames.length === 0"
                  @click="confirmTagChanges"
                >
                  确认写入酒馆标签
                </button>
              </template>
            </div>

            <p v-if="tagStatus" class="cm-inline-status">{{ tagStatus }}</p>
          </section>
        </template>

        <div v-else-if="!activePreview" class="cm-empty">请选择一个角色查看详情。</div>
        <template v-else-if="activePreview">
          <div class="cm-preview-head">
            <button
              class="cm-preview-avatar-button"
              type="button"
              title="更换封面图"
              aria-label="更换封面图"
              :disabled="updatingCover"
              @click="openCoverPicker"
            >
              <img :src="getAvatarSrc(activePreview)" :alt="activePreview.name" @error="handleAvatarError(activePreview)" />
              <span>更换</span>
            </button>
            <input
              ref="coverInputElement"
              class="cm-visually-hidden-file"
              type="file"
              accept=".png,.jpg,.jpeg,.webp,.json,image/png,image/jpeg,image/webp,application/json"
              @change="handleCoverFileChange"
            />
            <div>
              <input
                v-model="renameInput"
                class="cm-title-input"
                aria-label="角色名称"
                type="text"
                :disabled="applyingRename"
                @blur="saveInlineRename"
                @keydown.enter.prevent="saveInlineRename"
                @keydown.esc.prevent="resetRenameEditor"
              />
              <p>{{ activePreview.fav ? '已收藏' : '未收藏' }}</p>
            </div>
            <div class="cm-preview-actions">
              <button
                class="cm-preview-action-icon primary"
                type="button"
                title="启动角色，打开最近聊天"
                aria-label="启动角色，打开最近聊天"
                :disabled="launchingFileName === activePreview.fileName"
                @click="launchCharacter(activePreview)"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M8 5v14l11-7-11-7Z" />
                </svg>
              </button>
              <button
                class="cm-preview-action-icon"
                type="button"
                title="替换或更新当前角色卡"
                aria-label="替换或更新当前角色卡"
                @click="openReplaceDialog"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M20 7h-9a4 4 0 0 0-4 4v1m-3-4 3 3 3-3M4 17h9a4 4 0 0 0 4-4v-1m3 4-3-3-3 3" />
                </svg>
              </button>
              <button
                class="cm-preview-action-icon danger"
                type="button"
                title="删除"
                aria-label="删除"
                :disabled="applyingDeletion"
                @click="previewActiveDeletion"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M4 7h16M10 11v6m4-6v6M9 7l1-3h4l1 3m-8 0 1 13h8l1-13" />
                </svg>
              </button>
            </div>
          </div>

          <dl class="cm-meta-list">
            <div>
              <dt>作者</dt>
              <dd>{{ activePreview.creator || '未知' }}</dd>
            </div>
            <div>
              <dt>版本</dt>
              <dd>{{ activePreview.character_version || '未知' }}</dd>
            </div>
            <div>
              <dt>Token</dt>
              <dd>{{ activePreview.tokens || '未知' }}</dd>
            </div>
            <div>
              <dt>世界书</dt>
              <dd>{{ activePreview.character_book || '无' }}</dd>
            </div>
            <div>
              <dt>导入</dt>
              <dd>{{ formatDate(activePreview.date_added) }}</dd>
            </div>
            <div>
              <dt>聊天</dt>
              <dd>{{ formatDate(activePreview.date_last_chat) }}</dd>
            </div>
          </dl>

          <div class="cm-detail-tags">
            <strong>标签</strong>
            <span v-if="activePreview.tags.length === 0">无</span>
            <span v-for="tag in activePreview.tags" v-else :key="tag.id" class="cm-detail-tag-chip" :class="{ active: activeTagIds.includes(tag.id) }">
              <button type="button" :aria-pressed="activeTagIds.includes(tag.id)" :title="`筛选标签：${tag.name}`" @click="activateTagFilter(tag.id)">
                {{ tag.name }}
              </button>
              <button type="button" :aria-label="`从 ${activePreview.name} 移除标签 ${tag.name}`" title="移除标签" @click.stop="removeDetailTag(tag)">
                ×
              </button>
            </span>
            <button class="cm-detail-tag-add" type="button" title="添加标签" aria-label="添加标签" @click="openTagDialog">
              +
            </button>
          </div>

          <div class="cm-source-url">
            <label class="cm-source-field">
              <span>来源</span>
              <input
                v-model="sourceUrlDraft"
                type="url"
                inputmode="url"
                placeholder="Discord / 发布页 URL"
                :disabled="savingSourceUrl"
                @blur="saveSourceUrl"
                @keydown.enter.prevent="saveSourceUrl"
              />
            </label>
            <div class="cm-source-actions">
              <button type="button" title="打开来源 URL" aria-label="打开来源 URL" :disabled="!canOpenSourceUrl" @click="openSourceUrl">↗</button>
              <button type="button" title="清除来源 URL" aria-label="清除来源 URL" :disabled="savingSourceUrl || !sourceUrlDraft.trim()" @click="clearSourceUrl">
                ×
              </button>
            </div>
            <p v-if="sourceUrlError">{{ sourceUrlError }}</p>
          </div>

          <label class="cm-user-note">
            <span>备注</span>
            <textarea
              v-model="userNoteDraft"
              rows="2"
              aria-label="用户备注"
              placeholder="只在管理器里显示"
              :disabled="savingUserNote"
              @blur="saveUserNote"
              @keydown.ctrl.enter.prevent="saveUserNote"
              @keydown.meta.enter.prevent="saveUserNote"
            />
            <p v-if="userNoteError">{{ userNoteError }}</p>
          </label>

          <section class="cm-chat-panel" aria-label="聊天记录">
            <div class="cm-section-head">
              <h3>聊天记录</h3>
              <div class="cm-management-actions">
                <button class="cm-secondary-action" type="button" @click="toggleChats">
                  {{ chatsExpanded ? '收起' : '查看' }}
                </button>
                <button
                  class="cm-secondary-action"
                  type="button"
                  title="下载当前角色的全部聊天记录"
                  :disabled="activeChatState.loading || activeChatState.chats.length === 0"
                  @click="downloadActiveChats"
                >
                  全部下载
                </button>
              </div>
            </div>
            <p v-if="activeChatState.loading" class="cm-inline-status">正在读取聊天记录...</p>
            <p v-else-if="activeChatState.error" class="cm-inline-status error">{{ activeChatState.error }}</p>
            <template v-else-if="chatsExpanded">
              <p v-if="activeChatState.chats.length === 0" class="cm-inline-status">没有读取到聊天记录。</p>
              <div v-else class="cm-chat-list">
                <article v-for="chat in activeChatState.chats" :key="chat.id">
                  <div class="cm-chat-row">
                    <div class="cm-chat-main">
                      <input
                        :value="getChatDisplayTitle(chat)"
                        type="text"
                        :aria-label="`聊天名称 ${getChatDisplayTitle(chat)}`"
                        title="修改这条聊天在管理器里的显示名"
                        @change="commitChatAlias(chat, $event)"
                        @keydown.enter.prevent="commitChatAlias(chat, $event)"
                      />
                      <span>{{ chat.messageCount || 0 }} 条 · {{ formatDate(chat.updatedAt) }}</span>
                    </div>
                    <div class="cm-chat-actions">
                      <button type="button" :aria-label="`查看正文 ${getChatDisplayTitle(chat)}`" title="查看正文" @click="toggleChatContent(chat)">
                        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                          <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
                          <circle cx="12" cy="12" r="2.5" />
                        </svg>
                      </button>
                      <button type="button" :aria-label="`下载聊天 ${getChatDisplayTitle(chat)}`" title="下载这条聊天记录" @click="downloadChat(chat)">
                        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                          <path d="M12 3v12" />
                          <path d="m7 10 5 5 5-5" />
                          <path d="M5 20h14" />
                        </svg>
                      </button>
                      <button type="button" :aria-label="`启动聊天 ${getChatDisplayTitle(chat)}`" title="启动这条聊天" @click="openChat(chat)">
                        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                          <path d="M8 5v14l11-7-11-7Z" />
                        </svg>
                      </button>
                      <button
                        class="danger"
                        type="button"
                        :aria-label="`删除聊天 ${getChatDisplayTitle(chat)}`"
                        title="删除这条聊天记录"
                        :disabled="deletingChatKeys.has(getChatAliasKey(chat))"
                        @click="deleteChat(chat)"
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                          <path d="M4 7h16" />
                          <path d="M10 11v6" />
                          <path d="M14 11v6" />
                          <path d="M6 7l1 14h10l1-14" />
                          <path d="M9 7V4h6v3" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <pre v-if="expandedChatKey === getChatAliasKey(chat)" class="cm-chat-content">{{ getChatContentPreview(chat) }}</pre>
                </article>
              </div>
            </template>
          </section>

          <div v-if="tagDialogOpen" class="cm-tag-dialog-backdrop" role="presentation" @click.self="closeTagDialog">
            <section class="cm-tag-dialog" role="dialog" aria-modal="true" aria-label="添加标签">
              <header>
                <div>
                  <h3>添加标签</h3>
                  <p>{{ activePreview.name }}</p>
                </div>
                <button type="button" title="关闭" aria-label="关闭添加标签" @click="closeTagDialog">×</button>
              </header>
              <div class="cm-tag-choice-grid" aria-label="已有标签">
                <button
                  v-for="tag in tavernTags"
                  :key="tag.id"
                  type="button"
                  :aria-pressed="detailActiveTagIds.has(tag.id)"
                  :class="{ active: detailActiveTagIds.has(tag.id) }"
                  :disabled="applyingDetailTag"
                  @click="toggleDetailTag(tag)"
                >
                  {{ tag.name }}
                </button>
                <p v-if="tavernTags.length === 0" class="cm-dialog-note">当前没有已有标签。</p>
              </div>
              <label class="cm-field">
                <span>自定义标签</span>
                <input v-model="detailTagName" type="text" placeholder="输入新标签，Enter 添加" @keydown.enter.prevent="confirmCustomDetailTag" />
              </label>
              <div class="cm-management-actions">
                <button class="cm-primary-action" type="button" :disabled="applyingDetailTag || !detailTagName.trim()" @click="confirmCustomDetailTag">
                  {{ applyingDetailTag ? '正在写入...' : '添加' }}
                </button>
                <button class="cm-secondary-action" type="button" :disabled="applyingDetailTag" @click="closeTagDialog">
                  取消
                </button>
              </div>
            </section>
          </div>

          <div v-if="loadingDetail" class="cm-inline-status">正在读取详情...</div>

          <div v-if="previewRiskIssues.length" class="cm-risk-list">
            <p v-for="issue in previewRiskIssues" :key="issue.message" :class="issue.level">
              {{ issue.message }}
            </p>
          </div>

          <article class="cm-section">
            <h3>描述</h3>
            <p>{{ truncate(previewDescription, '无内容', 160) }}</p>
          </article>

          <article class="cm-section cm-greeting-section">
            <div class="cm-section-head">
              <h3>开场白</h3>
              <div v-if="greetingOptions.length > 1" class="cm-greeting-pager" aria-label="切换开场白">
                <button
                  type="button"
                  title="上一条开场白"
                  aria-label="上一条开场白"
                  :disabled="selectedGreetingIndex === 0"
                  @click="changeGreeting(-1)"
                >
                  ‹
                </button>
                <output aria-live="polite">{{ greetingPageLabel }}</output>
                <button
                  type="button"
                  title="下一条开场白"
                  aria-label="下一条开场白"
                  :disabled="selectedGreetingIndex >= greetingOptions.length - 1"
                  @click="changeGreeting(1)"
                >
                  ›
                </button>
                <select
                  v-if="greetingOptions.length > 5"
                  v-model.number="selectedGreetingIndex"
                  aria-label="跳转开场白"
                >
                  <option v-for="(_option, index) in greetingOptions" :key="index" :value="index">
                    {{ index + 1 }}
                  </option>
                </select>
              </div>
            </div>
            <div class="cm-greeting-body" aria-label="开场白内容">
              <p>{{ selectedGreeting || (loadingDetail ? '正在读取详情...' : '无内容') }}</p>
            </div>
          </article>
        </template>
      </section>
    </section>

    <div
      v-if="importDialogOpen"
      class="cm-import-dialog-backdrop"
      role="presentation"
      @click.self="closeImportDialog"
    >
      <section
        class="cm-import-dialog"
        :class="{ empty: importCandidates.length === 0 }"
        role="dialog"
        aria-modal="true"
        :aria-label="importDialogTitle"
      >
        <header>
          <div>
            <h2>{{ importDialogTitle }}</h2>
            <p v-if="importDialogHint">{{ importDialogHint }}</p>
          </div>
          <button class="cm-icon-button danger" type="button" title="关闭" aria-label="关闭导入弹窗" :disabled="parsingImports || applyingImports" @click="closeImportDialog">
            ×
          </button>
        </header>

        <div class="cm-import-sourcebar">
          <div class="cm-import-file-source">
            <label class="cm-file-button">
              <input
                type="file"
                :accept="importFileAccept"
                :multiple="!isImportReplaceMode"
                @change="handleImportFiles"
              />
              选择文件
            </label>
            <span>{{ importFileHint }}</span>
          </div>

          <form v-if="!isImportReplaceMode" class="cm-import-url" @submit.prevent="addImportUrl">
            <label class="cm-field">
              <input v-model="importUrl" type="url" placeholder="https://example.com/characters.zip" />
            </label>
            <button class="cm-primary-action" type="submit" :disabled="parsingImports || !importUrl.trim()">解析 URL</button>
          </form>
        </div>

        <div class="cm-import-summary">
          <strong>{{ importCandidates.length }} 个候选项</strong>
          <span>{{ importReadyCount }} 可写入</span>
          <span v-if="importErrorCount">{{ importErrorCount }} 有错误</span>
          <span v-if="parsingImports">正在解析...</span>
          <span v-else-if="applyingImports">正在写入...</span>
          <span v-if="importStatus">{{ importStatus }}</span>
          <button type="button" :disabled="importCandidates.length === 0 || applyingImports" @click="clearImportCandidates">
            清空
          </button>
        </div>

        <div class="cm-import-dialog-body">
          <div v-if="importCandidates.length === 0" class="cm-import-empty">
            <strong>暂无候选项</strong>
          </div>
          <div v-else class="cm-import-list">
            <article
              v-for="candidate in importCandidates"
              :key="candidate.id"
              role="button"
              tabindex="0"
              class="cm-import-card"
              :class="{ active: selectedImportCandidate?.id === candidate.id, error: candidate.status === 'error' || candidate.status === 'failed' }"
              @click="selectedImportId = candidate.id"
              @keydown.enter="selectedImportId = candidate.id"
              @keydown.space.prevent="selectedImportId = candidate.id"
            >
              <span class="cm-import-thumb">
                <img v-if="getImportAvatarSrc(candidate)" :src="getImportAvatarSrc(candidate)" :alt="candidate.summary.name" />
                <b v-else>{{ candidate.format.toUpperCase() }}</b>
                <span class="cm-import-card-tags">
                  <b>{{ candidate.format.toUpperCase() }}</b>
                  <b>{{ formatImportAction(candidate) }}</b>
                </span>
                <button type="button" title="移除此项" aria-label="移除此项" @click.stop="removeImportCandidate(candidate.id)">×</button>
                <span class="cm-import-card-text">
                  <strong>{{ candidate.summary.name }}</strong>
                  <small>{{ candidate.sourceName }}</small>
                  <em v-if="formatImportIssue(candidate)">{{ formatImportIssue(candidate) }}</em>
                </span>
              </span>
            </article>
          </div>

          <aside v-if="selectedImportCandidate" class="cm-import-mini-preview" aria-label="候选预览">
            <div class="cm-import-preview-title">
              <div class="cm-import-avatar" aria-hidden="true">{{ selectedImportCandidate.format.toUpperCase() }}</div>
              <div>
                <h3>{{ selectedImportCandidate.summary.name }}</h3>
                <p>{{ formatImportAction(selectedImportCandidate) }} · {{ selectedImportCandidate.fileName }}</p>
              </div>
            </div>
            <dl>
              <div>
                <dt>来源</dt>
                <dd>{{ selectedImportCandidate.sourceName }}</dd>
              </div>
              <div>
                <dt>世界书</dt>
                <dd>{{ getImportWorldBookSummary(selectedImportCandidate) }}</dd>
              </div>
            </dl>
            <div v-if="selectedImportCandidate.issues.length" class="cm-risk-list">
              <p v-for="issue in selectedImportCandidate.issues" :key="issue.message" :class="issue.level">
                {{ issue.message }}
              </p>
            </div>
          </aside>
        </div>

        <footer>
          <button class="cm-secondary-action" type="button" :disabled="parsingImports || applyingImports" @click="closeImportDialog">取消</button>
          <button class="cm-primary-action cm-import-confirm" type="button" :disabled="!canConfirmImports" @click="confirmImports">
            {{ applyingImports ? '正在写入...' : `确认 ${importReadyCount} 项` }}
          </button>
        </footer>
      </section>
    </div>

    <div v-if="settingsOpen" class="cm-settings-backdrop" role="presentation" @click="settingsOpen = false">
      <section class="cm-settings" role="dialog" aria-modal="true" aria-labelledby="cm-settings-title" @click.stop>
        <header>
          <div>
            <h2 id="cm-settings-title">设置</h2>
            <p>筛选和面板行为</p>
          </div>
          <button class="cm-icon-button danger" type="button" title="关闭设置" @click="settingsOpen = false">×</button>
        </header>

        <article class="cm-settings-group">
          <div>
            <h3>标签过滤逻辑</h3>
            <p>默认只保留一个标签选择，需要组合筛选时可切换为或/且。</p>
          </div>
          <div class="cm-segmented" role="radiogroup" aria-label="标签过滤逻辑">
            <button
              type="button"
              role="radio"
              :aria-checked="tagFilterMode === 'exclusive'"
              :class="{ active: tagFilterMode === 'exclusive' }"
              @click="setTagFilterMode('exclusive')"
            >
              单选
            </button>
            <button
              type="button"
              role="radio"
              :aria-checked="tagFilterMode === 'or'"
              :class="{ active: tagFilterMode === 'or' }"
              @click="setTagFilterMode('or')"
            >
              或
            </button>
            <button
              type="button"
              role="radio"
              :aria-checked="tagFilterMode === 'and'"
              :class="{ active: tagFilterMode === 'and' }"
              @click="setTagFilterMode('and')"
            >
              且
            </button>
          </div>
        </article>
      </section>
    </div>
  </main>
</template>

<style scoped>
.cm-shell {
  --cm-bg: oklch(16% 0.012 248);
  --cm-panel: oklch(20% 0.012 248);
  --cm-panel-2: oklch(24% 0.014 248);
  --cm-control-bg: var(--cm-bg);
  --cm-card-bg: var(--cm-bg);
  --cm-border: oklch(34% 0.018 248);
  --cm-text: oklch(91% 0.01 248);
  --cm-muted: oklch(70% 0.018 248);
  --cm-weak: oklch(55% 0.018 248);
  --cm-accent: oklch(62% 0.16 250);
  --cm-accent-text: oklch(87% 0.06 250);
  --cm-accent-bg: oklch(24% 0.025 250);
  --cm-accent-contrast: oklch(18% 0.014 248);
  --cm-hover: oklch(92% 0.01 248 / 8%);
  --cm-toggle-color: oklch(78% 0.018 248 / 54%);
  --cm-toggle-hover: oklch(88% 0.025 248 / 82%);
  --cm-media-bg: oklch(13% 0.01 248);
  --cm-scrim: oklch(13% 0.012 248 / 84%);
  --cm-badge-bg: oklch(13% 0.012 248 / 82%);
  --cm-backdrop: oklch(8% 0.01 248 / 76%);
  --cm-primary-bg: oklch(28% 0.055 250);
  --cm-warning: oklch(76% 0.13 82);
  --cm-danger: oklch(65% 0.16 25);
  height: 100vh;
  min-height: 0;
  box-sizing: border-box;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  padding: 16px;
  overflow: hidden;
  background: var(--cm-bg);
  color: var(--cm-text);
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size: 14px;
}

.cm-header {
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 14px;
  border: 1px solid var(--cm-border);
  border-radius: 8px;
  background: var(--cm-panel);
}

.cm-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cm-header h1,
.cm-preview h2,
.cm-section h3 {
  margin: 0;
  letter-spacing: 0;
}

.cm-header h1 {
  font-size: 18px;
  line-height: 1.25;
}

.cm-header h1 span {
  color: var(--cm-muted);
  font-size: 12px;
  font-weight: 700;
}

.cm-preview p,
.cm-list-head > span {
  color: var(--cm-muted);
}

.cm-icon-button {
  width: 34px;
  height: 34px;
  display: inline-grid;
  place-items: center;
  border: 1px solid var(--cm-border);
  border-radius: 6px;
  background: var(--cm-panel-2);
  color: var(--cm-text);
  cursor: pointer;
}

.cm-header-primary {
  width: 36px;
  height: 34px;
  display: inline-grid;
  place-items: center;
  border: 1px solid var(--cm-accent);
  border-radius: 6px;
  background: var(--cm-primary-bg);
  color: var(--cm-text);
  padding: 0;
  cursor: pointer;
}

.cm-header-primary[aria-pressed='true'] {
  background: var(--cm-accent-bg);
  color: var(--cm-accent-text);
}

.cm-header-primary:hover,
.cm-header-primary:focus-visible {
  background: var(--cm-accent-bg);
}

.cm-header-primary:focus-visible {
  outline: 1px solid var(--cm-accent);
  outline-offset: 2px;
}

.cm-header-primary svg,
.cm-icon-button svg {
  width: 17px;
  height: 17px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2.2;
}

.cm-icon-button:disabled {
  cursor: wait;
  opacity: 0.65;
}

.cm-icon-button[aria-pressed='true'] {
  border-color: var(--cm-accent);
  color: var(--cm-accent-text);
}

.cm-icon-button.danger {
  font-size: 20px;
}

.cm-workspace {
  --cm-left-rail-width: 240px;
  --cm-right-rail-width: 360px;
  display: grid;
  position: relative;
  grid-template-columns: minmax(210px, 240px) minmax(480px, 1fr) minmax(300px, 360px);
  gap: 12px;
  margin-top: 12px;
  height: calc(100% - 12px);
  min-height: 0;
  align-items: stretch;
  overflow: hidden;
  transition: grid-template-columns 160ms ease;
}

.cm-workspace.left-collapsed {
  grid-template-columns: 0 minmax(480px, 1fr) minmax(300px, 360px);
}

.cm-workspace.right-collapsed {
  grid-template-columns: minmax(210px, 240px) minmax(480px, 1fr) 0;
}

.cm-workspace.left-collapsed.right-collapsed {
  grid-template-columns: 0 minmax(480px, 1fr) 0;
}

.cm-panel-toggle {
  position: absolute;
  top: 50%;
  z-index: 3;
  width: 22px;
  height: 72px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--cm-toggle-color);
  cursor: pointer;
  opacity: 0.58;
  transform: translateY(-50%);
  transition:
    opacity 140ms ease,
    background 140ms ease,
    color 140ms ease,
    left 160ms ease,
    right 160ms ease;
}

.cm-panel-toggle:hover,
.cm-panel-toggle:focus-visible {
  background: var(--cm-hover);
  color: var(--cm-toggle-hover);
  opacity: 1;
}

.cm-panel-toggle:focus-visible {
  outline: 1px solid var(--cm-accent);
  outline-offset: 2px;
}

.cm-panel-toggle::before {
  content: '';
  width: 0;
  height: 0;
  border-top: 9px solid transparent;
  border-bottom: 9px solid transparent;
}

.cm-panel-toggle.left {
  left: calc(var(--cm-left-rail-width) + 1px);
}

.cm-panel-toggle.left::before {
  border-right: 9px solid currentColor;
}

.cm-workspace.left-collapsed .cm-panel-toggle.left {
  left: 1px;
}

.cm-workspace.left-collapsed .cm-panel-toggle.left::before {
  border-right: 0;
  border-left: 9px solid currentColor;
}

.cm-panel-toggle.right {
  right: calc(var(--cm-right-rail-width) + 1px);
}

.cm-panel-toggle.right::before {
  border-left: 9px solid currentColor;
}

.cm-workspace.right-collapsed .cm-panel-toggle.right {
  right: 1px;
}

.cm-workspace.right-collapsed .cm-panel-toggle.right::before {
  border-left: 0;
  border-right: 9px solid currentColor;
}

.cm-controls,
.cm-list-panel,
.cm-preview {
  min-height: 0;
  height: 100%;
  max-height: 100%;
  border: 1px solid var(--cm-border);
  border-radius: 8px;
  background: var(--cm-panel);
}

.cm-controls,
.cm-preview {
  padding: 12px;
  overflow: auto;
  transition:
    opacity 140ms ease,
    padding 140ms ease,
    border-width 140ms ease;
}

.cm-workspace.left-collapsed .cm-controls,
.cm-workspace.right-collapsed .cm-preview {
  width: 0;
  min-width: 0;
  padding: 0;
  border-width: 0;
  opacity: 0;
  pointer-events: none;
  overflow: hidden;
}

.cm-shell,
.cm-controls,
.cm-list-panel,
.cm-preview {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.cm-shell::-webkit-scrollbar,
.cm-controls::-webkit-scrollbar,
.cm-list-panel::-webkit-scrollbar,
.cm-preview::-webkit-scrollbar {
  width: 0;
  height: 0;
  display: none;
}

.cm-field {
  display: grid;
  gap: 6px;
  margin-bottom: 12px;
}

.cm-field span {
  color: var(--cm-muted);
  font-size: 12px;
}

.cm-field input,
.cm-field select {
  appearance: none;
  width: 100%;
  box-sizing: border-box;
  height: 34px;
  border: 1px solid var(--cm-border);
  border-radius: 6px;
  background: var(--cm-control-bg);
  color: var(--cm-text);
  padding: 0 10px;
}

.cm-tag-filter {
  display: grid;
  gap: 6px;
}

.cm-tag-filter {
  margin-top: 0;
}

.cm-side-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2px;
  color: var(--cm-muted);
  font-size: 12px;
}

.cm-tag-filter .cm-clear-tags {
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
  min-height: 0;
  border: 0;
  border-radius: 5px;
  background: transparent;
  color: var(--cm-weak);
  cursor: pointer;
  font-size: 15px;
  line-height: 1;
}

.cm-tag-filter .cm-clear-tags:hover:not(:disabled),
.cm-tag-filter .cm-clear-tags:focus-visible {
  background: var(--cm-panel-2);
  color: var(--cm-text);
}

.cm-tag-filter .cm-clear-tags:focus-visible {
  outline: 1px solid var(--cm-accent);
  outline-offset: 2px;
}

.cm-tag-filter .cm-clear-tags:disabled {
  cursor: not-allowed;
  opacity: 0.35;
}

.cm-side-empty {
  color: var(--cm-weak);
  font-size: 12px;
  line-height: 1.5;
}

.cm-tag-filter button {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 34px;
  border: 1px solid var(--cm-border);
  border-radius: 6px;
  background: var(--cm-panel-2);
  color: var(--cm-text);
  cursor: pointer;
}

.cm-tag-filter button {
  gap: 8px;
}

.cm-tag-filter button.active {
  border-color: var(--cm-accent);
  color: var(--cm-accent-text);
}

.cm-tag-filter span {
  min-width: 0;
  display: inline-flex;
  align-items: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cm-tag-filter strong {
  color: var(--cm-muted);
  font-size: 12px;
}

.cm-issue-box,
.cm-risk-list {
  margin-top: 12px;
  border: 1px solid var(--cm-border);
  border-radius: 6px;
  background: var(--cm-control-bg);
  padding: 10px;
}

.cm-issue-box strong {
  display: block;
  margin-bottom: 6px;
}

.cm-issue-box p,
.cm-risk-list p {
  margin: 6px 0 0;
  color: var(--cm-muted);
  line-height: 1.5;
}

.cm-risk-list .warning {
  color: var(--cm-warning);
}

.cm-risk-list .error {
  color: var(--cm-danger);
}

.cm-list-panel {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  overflow: hidden;
  scroll-padding-top: 0;
}

.cm-list-panel.import-mode {
  grid-template-rows: minmax(0, 1fr);
}

.cm-list-head {
  position: relative;
  z-index: 4;
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 10px;
  padding: 11px 12px;
  border-bottom: 1px solid var(--cm-border);
  background: var(--cm-panel);
  overflow: hidden;
}

.cm-list-status {
  flex: 0 0 auto;
  min-width: 110px;
  display: grid;
  gap: 2px;
}

.cm-list-status span {
  color: var(--cm-muted);
  font-size: 12px;
}

.cm-search-field,
.cm-sort-field {
  margin-bottom: 0;
}

.cm-list-head .cm-field {
  display: block;
}

.cm-list-head .cm-field > span {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}

.cm-search-field {
  flex: 1 1 260px;
  min-width: 180px;
}

.cm-sort-field {
  flex: 0 0 150px;
}

.cm-list-head > span {
  margin-left: auto;
}

.cm-list-tools {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  margin-left: auto;
}

.cm-list-tools button,
.cm-list-tools output,
.cm-selection-toggle {
  min-height: 28px;
  border: 1px solid var(--cm-border);
  border-radius: 6px;
  background: var(--cm-control-bg);
  color: var(--cm-text);
  padding: 0 9px;
  font-size: 12px;
}

.cm-list-tools button {
  cursor: pointer;
}

.cm-selection-toggle[aria-pressed='true'] {
  border-color: var(--cm-accent);
  color: var(--cm-accent-text);
}

.cm-list-tools output {
  display: inline-flex;
  align-items: center;
  color: var(--cm-muted);
}

.cm-gallery-tools {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px;
  border: 1px solid var(--cm-border);
  border-radius: 6px;
  background: var(--cm-control-bg);
}

.cm-gallery-tools button {
  width: 26px;
  height: 24px;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--cm-text);
  cursor: pointer;
  font-size: 15px;
  line-height: 1;
}

.cm-gallery-tools button:hover:not(:disabled) {
  background: var(--cm-panel-2);
}

.cm-gallery-tools button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.cm-gallery-tools output {
  min-width: 28px;
  color: var(--cm-muted);
  font-size: 12px;
  text-align: center;
}

.cm-card-grid {
  display: grid;
  grid-template-columns: repeat(var(--cm-card-cols, 5), minmax(0, 1fr));
  gap: 8px;
  align-items: start;
  align-content: start;
  min-height: 0;
  padding: 10px;
  overflow: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.cm-import-workspace,
.cm-card-grid {
  min-height: 0;
}

.cm-card-grid::-webkit-scrollbar {
  width: 0;
  height: 0;
  display: none;
}

.cm-import-workspace {
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  gap: 0;
  min-height: 0;
  overflow: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.cm-import-workspace::-webkit-scrollbar {
  width: 0;
  height: 0;
  display: none;
}

.cm-import-dialog-backdrop {
  position: fixed;
  inset: 0;
  z-index: 40;
  display: grid;
  place-items: center;
  padding: 18px;
  background: var(--cm-backdrop);
}

.cm-import-dialog {
  width: min(780px, calc(100vw - 32px));
  max-height: min(680px, calc(100vh - 32px));
  display: grid;
  grid-template-rows: auto auto auto minmax(0, 1fr) auto;
  border: 1px solid var(--cm-border);
  border-radius: 8px;
  background: var(--cm-panel);
  color: var(--cm-text);
  overflow: hidden;
  box-shadow: 0 18px 60px oklch(4% 0.01 248 / 50%);
}

.cm-import-dialog.empty {
  grid-template-rows: auto auto auto minmax(180px, 1fr) auto;
}

.cm-import-dialog > header,
.cm-import-dialog > footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  border-bottom: 1px solid var(--cm-border);
}

.cm-import-dialog > footer {
  justify-content: flex-end;
  border-top: 1px solid var(--cm-border);
  border-bottom: 0;
}

.cm-import-dialog h2,
.cm-import-dialog h3,
.cm-import-dialog p {
  margin: 0;
}

.cm-import-dialog h2 {
  font-size: 18px;
  line-height: 1.25;
}

.cm-import-dialog header p,
.cm-import-mini-preview > p {
  margin-top: 3px;
  color: var(--cm-muted);
  font-size: 12px;
}

.cm-import-dialog-body {
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(220px, 280px);
  gap: 10px;
  padding: 10px 14px;
  overflow: hidden;
}

.cm-import-dialog.empty .cm-import-dialog-body {
  grid-template-columns: 1fr;
  place-items: center;
}

.cm-import-empty {
  display: grid;
  place-items: center;
  gap: 5px;
  color: var(--cm-muted);
  text-align: center;
}

.cm-import-empty strong {
  color: var(--cm-text);
  font-size: 15px;
}

.cm-import-empty span {
  font-size: 12px;
}

.cm-import-mini-preview {
  min-width: 0;
  display: grid;
  align-content: start;
  gap: 8px;
  overflow: auto;
  border: 1px solid var(--cm-border);
  border-radius: 6px;
  background: var(--cm-panel-2);
  padding: 10px;
  scrollbar-width: none;
}

.cm-import-mini-preview::-webkit-scrollbar {
  width: 0;
  height: 0;
}

.cm-import-mini-preview dl {
  display: grid;
  gap: 6px;
  margin: 0;
}

.cm-import-mini-preview dt {
  color: var(--cm-weak);
  font-size: 11px;
  font-weight: 800;
}

.cm-import-mini-preview dd {
  margin: 2px 0 0;
  color: var(--cm-muted);
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.cm-import-preview-title {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  gap: 9px;
  align-items: center;
  min-width: 0;
}

.cm-import-preview-title h3,
.cm-import-preview-title p {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cm-import-summary,
.cm-diff-section dl {
  border: 1px solid var(--cm-border);
  border-radius: 6px;
  background: var(--cm-control-bg);
}

.cm-import-sourcebar {
  display: grid;
  grid-template-columns: minmax(210px, 0.65fr) minmax(280px, 1.35fr);
  gap: 10px;
  align-items: center;
  min-width: 0;
  border-bottom: 1px solid var(--cm-border);
  background: var(--cm-control-bg);
  padding: 10px 14px;
}

.cm-import-card em {
  margin: 0;
  color: var(--cm-muted);
  line-height: 1.5;
}

.cm-import-file-source {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.cm-import-file-source span {
  min-width: 0;
  overflow: hidden;
  color: var(--cm-muted);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cm-file-button {
  width: fit-content;
  min-height: 34px;
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--cm-accent);
  border-radius: 6px;
  background: var(--cm-primary-bg);
  color: var(--cm-text);
  padding: 0 10px;
  cursor: pointer;
}

.cm-file-button input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.cm-import-url {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
  min-width: 0;
}

.cm-import-url .cm-field {
  margin-bottom: 0;
}

.cm-import-summary {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  border-right: 0;
  border-left: 0;
  border-radius: 0;
  padding: 8px 14px;
}

.cm-import-summary span {
  color: var(--cm-muted);
}

.cm-import-summary button {
  flex: 0 0 auto;
}

.cm-import-summary button:first-of-type {
  margin-left: auto;
}

.cm-import-summary button,
.cm-import-card button {
  min-height: 28px;
  border: 1px solid var(--cm-border);
  border-radius: 6px;
  background: var(--cm-panel-2);
  color: var(--cm-text);
  cursor: pointer;
}

.cm-import-dialog > footer .cm-import-confirm {
  min-height: 36px;
  border-color: var(--cm-accent);
  background: var(--cm-accent);
  color: var(--cm-accent-contrast);
  padding: 0 16px;
  font-weight: 800;
  box-shadow: 0 0 0 1px oklch(92% 0.05 250 / 16%);
}

.cm-import-dialog > footer .cm-import-confirm:hover:not(:disabled),
.cm-import-dialog > footer .cm-import-confirm:focus-visible {
  filter: brightness(1.08);
}

.cm-import-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(136px, 1fr));
  align-content: start;
  gap: 7px;
  min-height: 0;
  padding: 0;
  overflow: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.cm-import-list::-webkit-scrollbar {
  width: 0;
  height: 0;
  display: none;
}

.cm-import-card {
  position: relative;
  min-width: 0;
  display: block;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 8px;
  background: var(--cm-card-bg);
  color: var(--cm-text);
  text-align: left;
  cursor: pointer;
  overflow: hidden;
}

.cm-import-card.active {
  border-color: var(--cm-accent);
}

.cm-import-card.error {
  border-color: var(--cm-danger);
}

.cm-import-thumb {
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 3 / 4;
  height: auto;
  overflow: hidden;
  background: var(--cm-media-bg);
}

.cm-import-thumb::before {
  content: '';
  display: block;
  width: 100%;
  padding-top: 133.3333%;
}

.cm-import-thumb::after {
  content: '';
  position: absolute;
  inset: auto 0 0;
  height: 54%;
  pointer-events: none;
  background: linear-gradient(
    to bottom,
    oklch(13% 0.012 248 / 0%),
    oklch(11% 0.012 248 / 64%) 42%,
    oklch(9% 0.012 248 / 94%) 100%
  );
}

.cm-import-thumb img {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: var(--cm-media-bg);
}

.cm-import-thumb > b {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  color: var(--cm-muted);
  font-size: 22px;
  letter-spacing: 0;
}

.cm-import-card-tags {
  position: absolute;
  top: 8px;
  left: 8px;
  right: 42px;
  z-index: 2;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.cm-import-card-tags b {
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  border: 1px solid oklch(94% 0.01 248 / 26%);
  border-radius: 999px;
  background: oklch(16% 0.012 248 / 66%);
  color: var(--cm-text);
  padding: 2px 7px;
  font-size: 11px;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cm-import-card button {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 3;
  width: 28px;
  min-height: 28px;
  padding: 0;
}

.cm-import-card-text {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 2;
  display: grid;
  gap: 3px;
  min-width: 0;
  padding: 58px 11px 11px;
  pointer-events: none;
}

.cm-import-card-text strong,
.cm-import-card-text small,
.cm-import-card-text em {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cm-import-card-text strong {
  color: var(--cm-text);
  font-size: 14px;
  line-height: 1.25;
  text-shadow: 0 1px 8px oklch(7% 0.01 248 / 82%);
}

.cm-import-card-text small {
  color: var(--cm-muted);
  font-size: 12px;
}

.cm-import-card-text em {
  color: var(--cm-warning);
  font-size: 12px;
  font-style: normal;
}

.cm-import-avatar {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  border: 1px solid var(--cm-border);
  border-radius: 6px;
  background: var(--cm-media-bg);
  color: var(--cm-muted);
  font-size: 11px;
  font-weight: 800;
}

.cm-diff-section dl {
  display: grid;
  gap: 0;
  margin: 8px 0 0;
  overflow: hidden;
}

.cm-diff-section div {
  display: grid;
  gap: 5px;
  padding: 8px;
  border-bottom: 1px solid var(--cm-border);
}

.cm-diff-section div:last-child {
  border-bottom: 0;
}

.cm-diff-section div.changed {
  background: var(--cm-panel-2);
}

.cm-diff-section div.preserved {
  color: var(--cm-accent-text);
}

.cm-diff-section dt {
  color: var(--cm-text);
  font-weight: 800;
  font-size: 12px;
}

.cm-diff-section dd {
  display: grid;
  gap: 3px;
  margin: 0;
  color: var(--cm-muted);
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.cm-diff-section dd strong {
  color: var(--cm-text);
}

.cm-card {
  position: relative;
  min-width: 0;
  scroll-margin-top: 112px;
  display: block;
  width: 100%;
  height: var(--cm-card-height, 320px);
  padding: 0;
  border: 1px solid transparent;
  border-radius: 8px;
  background: var(--cm-card-bg);
  color: var(--cm-text);
  text-align: left;
  cursor: pointer;
  overflow: hidden;
}

.cm-card:hover,
.cm-card.active,
.cm-card.selected {
  border-color: var(--cm-accent);
  background: var(--cm-card-bg);
}

.cm-card.selected {
  box-shadow: inset 0 0 0 1px var(--cm-accent);
}

.cm-card-check {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 4;
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: var(--cm-scrim);
  cursor: pointer;
}

.cm-card-check input {
  width: 16px;
  height: 16px;
  accent-color: var(--cm-accent);
}

.cm-thumb {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 8px;
  overflow: hidden;
  background: var(--cm-media-bg);
}

.cm-thumb::before {
  content: none;
}

.cm-thumb::after {
  content: '';
  position: absolute;
  inset: auto 0 0;
  z-index: 1;
  height: 54%;
  pointer-events: none;
  background: linear-gradient(
    to bottom,
    rgba(7, 11, 18, 0) 0%,
    rgba(7, 11, 18, 0.18) 28%,
    rgba(7, 11, 18, 0.68) 70%,
    rgba(7, 11, 18, 0.9) 100%
  );
}

.cm-thumb img {
  position: absolute;
  inset: 0;
  z-index: 0;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  image-rendering: auto;
  background: var(--cm-media-bg);
}

.cm-card-tags {
  position: absolute;
  top: 8px;
  left: 8px;
  right: 8px;
  z-index: 2;
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  max-height: 39px;
  overflow: hidden;
  pointer-events: none;
}

.cm-card-tags b {
  max-width: 100%;
  min-width: 0;
  display: inline-block;
  overflow: hidden;
  border: 1px solid oklch(94% 0.01 248 / 28%);
  border-radius: 999px;
  background: oklch(16% 0.012 248 / 58%);
  color: var(--cm-text);
  padding: 2px 6px;
  font-size: 11px;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
  backdrop-filter: blur(4px);
}

.cm-card-actions {
  position: absolute;
  right: 9px;
  bottom: 9px;
  z-index: 4;
  display: inline-flex;
  gap: 5px;
}

.cm-card-action {
  width: 28px;
  height: 28px;
  display: inline-grid;
  place-items: center;
  border: 1px solid oklch(94% 0.01 248 / 20%);
  border-radius: 7px;
  background: var(--cm-badge-bg);
  color: var(--cm-text);
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  backdrop-filter: blur(4px);
}

.cm-card-action:hover:not(:disabled),
.cm-card-action:focus-visible,
.cm-card-action.active {
  border-color: var(--cm-accent);
  color: var(--cm-accent-text);
  background: var(--cm-accent-bg);
}

.cm-card-action:disabled {
  cursor: wait;
  opacity: 0.56;
}

.cm-card-action svg {
  width: 17px;
  height: 17px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2.2;
}

.cm-preview-avatar-button img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  image-rendering: auto;
  background: var(--cm-media-bg);
}

.cm-card-text {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2;
  min-width: 0;
  padding: 54px 78px 12px 12px;
  pointer-events: none;
  background: linear-gradient(
    to bottom,
    rgba(7, 11, 18, 0) 0%,
    rgba(7, 11, 18, 0.42) 48%,
    rgba(7, 11, 18, 0.82) 100%
  );
}

.cm-card-text strong {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--cm-text);
  font-size: 14px;
  line-height: 1.3;
  text-shadow: 0 1px 8px oklch(7% 0.01 248 / 82%);
}

.cm-empty,
.cm-inline-status {
  padding: 24px 14px;
  color: var(--cm-muted);
  text-align: center;
}

.cm-preview {
  display: grid;
  align-content: start;
  gap: 10px;
  overscroll-behavior: contain;
}

.cm-preview-head {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
}

.cm-preview-avatar-button {
  position: relative;
  width: 48px;
  height: 48px;
  display: block;
  border: 1px solid transparent;
  border-radius: 6px;
  background: var(--cm-control-bg);
  color: var(--cm-text);
  padding: 0;
  overflow: hidden;
  cursor: pointer;
}

.cm-preview-avatar-button:hover,
.cm-preview-avatar-button:focus-visible {
  border-color: var(--cm-accent);
  outline: none;
}

.cm-preview-avatar-button:disabled {
  cursor: wait;
  opacity: 0.65;
}

.cm-preview-avatar-button span {
  position: absolute;
  inset: auto 0 0;
  padding: 2px 0;
  background: var(--cm-scrim);
  color: var(--cm-text);
  font-size: 10px;
  font-weight: 700;
  opacity: 0;
  text-align: center;
  transition: opacity 160ms ease;
}

.cm-preview-avatar-button:hover span,
.cm-preview-avatar-button:focus-visible span {
  opacity: 1;
}

.cm-visually-hidden-file {
  position: fixed;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.cm-title-input {
  width: 100%;
  min-height: 30px;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: var(--cm-text);
  padding: 0 4px;
  font: inherit;
  font-size: 17px;
  font-weight: 800;
  line-height: 1.25;
}

.cm-title-input:hover,
.cm-title-input:focus {
  border-color: var(--cm-border);
  background: var(--cm-control-bg);
  outline: none;
}

.cm-preview-actions {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 5px;
  white-space: nowrap;
}

.cm-preview-action-icon {
  width: 34px;
  height: 34px;
  display: inline-grid;
  place-items: center;
  border: 1px solid var(--cm-accent);
  border-radius: 8px;
  background: var(--cm-accent-bg);
  color: var(--cm-accent-text);
  cursor: pointer;
}

.cm-preview-action-icon:not(.primary):not(.danger) {
  border-color: var(--cm-border);
  background: var(--cm-control-bg);
  color: var(--cm-muted);
}

.cm-preview-action-icon.danger {
  border-color: oklch(62% 0.18 28 / 70%);
  background: oklch(28% 0.12 28 / 58%);
  color: var(--cm-text);
}

.cm-preview-action-icon:hover:not(:disabled),
.cm-preview-action-icon:focus-visible {
  background: var(--cm-accent);
  color: var(--cm-accent-contrast);
  border-color: var(--cm-accent);
  outline: none;
}

.cm-preview-action-icon.danger:hover:not(:disabled),
.cm-preview-action-icon.danger:focus-visible {
  border-color: var(--cm-danger);
  background: oklch(36% 0.14 28 / 72%);
  color: var(--cm-text);
}

.cm-preview-action-icon:disabled {
  cursor: wait;
  opacity: 0.58;
}

.cm-preview-action-icon svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2.2;
}

.cm-preview-action-icon.primary svg {
  fill: currentColor;
  stroke: none;
}

.cm-preview-head p {
  margin: 3px 0 0;
  color: var(--cm-muted);
  font-size: 12px;
}

.cm-meta-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0;
  margin: 0;
  border: 1px solid var(--cm-border);
  border-radius: 6px;
  background: var(--cm-control-bg);
  overflow: hidden;
}

.cm-meta-list.compact dd {
  white-space: normal;
}

.cm-meta-list div {
  min-width: 0;
  display: grid;
  grid-template-columns: 46px minmax(0, 1fr);
  gap: 8px;
  align-items: baseline;
  padding: 7px 9px;
  border-bottom: 1px solid var(--cm-border);
  color: var(--cm-muted);
  overflow-wrap: anywhere;
}

.cm-meta-list div:nth-last-child(-n + 2) {
  border-bottom: 0;
}

.cm-meta-list div:nth-child(odd) {
  border-right: 1px solid var(--cm-border);
}

.cm-meta-list dt {
  color: var(--cm-weak);
  font-size: 11px;
  font-weight: 700;
}

.cm-meta-list dd {
  margin: 0;
  min-width: 0;
  overflow: hidden;
  color: var(--cm-muted);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cm-section {
  border-top: 1px solid var(--cm-border);
  padding-top: 9px;
}

.cm-detail-tags,
.cm-chat-panel,
.cm-danger-zone,
.cm-tag-editor,
.cm-mutation-preview,
.cm-selection-summary {
  border: 1px solid var(--cm-border);
  border-radius: 6px;
  background: var(--cm-control-bg);
  padding: 10px;
}

.cm-detail-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.cm-detail-tags strong,
.cm-tag-editor h3,
.cm-selection-summary h2 {
  margin: 0;
  font-size: 12px;
}

.cm-detail-tags > span:not(.cm-detail-tag-chip),
.cm-detail-tags button {
  border: 1px solid var(--cm-border);
  border-radius: 999px;
  color: var(--cm-muted);
  padding: 2px 7px;
  font-size: 12px;
}

.cm-detail-tags button {
  background: transparent;
  cursor: pointer;
  line-height: 1.4;
}

.cm-detail-tags button:hover,
.cm-detail-tags button:focus-visible {
  border-color: var(--cm-accent);
  color: var(--cm-text);
  background: var(--cm-panel-2);
}

.cm-detail-tags button:focus-visible {
  outline: 1px solid var(--cm-accent);
  outline-offset: 2px;
}

.cm-detail-tags .cm-detail-tag-chip.active {
  border-color: var(--cm-accent);
  color: var(--cm-accent-text);
  background: var(--cm-accent-bg);
}

.cm-detail-tag-chip {
  min-width: 0;
  display: inline-flex;
  align-items: center;
  overflow: hidden;
  border: 1px solid var(--cm-border);
  border-radius: 999px;
  color: var(--cm-muted);
}

.cm-detail-tag-chip button {
  min-height: 26px;
  border: 0;
  border-radius: 0;
  padding: 2px 7px;
}

.cm-detail-tag-chip button:first-child {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cm-detail-tag-chip button:last-child {
  width: 24px;
  padding: 0;
  border-left: 1px solid var(--cm-border);
  color: var(--cm-weak);
}

.cm-detail-tag-chip.active button {
  color: var(--cm-accent-text);
}

.cm-detail-tag-add {
  width: 28px;
  min-height: 28px;
  display: inline-grid;
  place-items: center;
  padding: 0;
  font-weight: 900;
}

.cm-source-url {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 6px;
  align-items: end;
}

.cm-source-field {
  min-width: 0;
  display: grid;
  gap: 4px;
}

.cm-source-field span {
  color: var(--cm-muted);
  font-size: 12px;
  font-weight: 700;
}

.cm-source-field input {
  width: 100%;
  min-height: 32px;
  border: 1px solid var(--cm-border);
  border-radius: 6px;
  background: var(--cm-control-bg);
  color: var(--cm-text);
  padding: 0 9px;
  font: inherit;
}

.cm-source-field input:focus {
  border-color: var(--cm-accent);
  outline: none;
}

.cm-source-actions {
  display: flex;
  gap: 4px;
}

.cm-source-actions button {
  width: 32px;
  height: 32px;
  display: inline-grid;
  place-items: center;
  border: 1px solid var(--cm-border);
  border-radius: 6px;
  background: var(--cm-control-bg);
  color: var(--cm-muted);
  cursor: pointer;
}

.cm-source-actions button:hover:not(:disabled),
.cm-source-actions button:focus-visible:not(:disabled) {
  border-color: var(--cm-accent);
  color: var(--cm-text);
  background: var(--cm-panel-2);
}

.cm-source-actions button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.cm-source-url p {
  grid-column: 1 / -1;
  margin: 0;
  color: var(--cm-danger);
  font-size: 12px;
}

.cm-user-note {
  display: grid;
  gap: 5px;
}

.cm-user-note span {
  color: var(--cm-muted);
  font-size: 12px;
  font-weight: 700;
}

.cm-user-note textarea {
  width: 100%;
  min-height: 54px;
  resize: vertical;
  border: 1px solid var(--cm-border);
  border-radius: 6px;
  background: var(--cm-control-bg);
  color: var(--cm-text);
  padding: 7px 9px;
  font: inherit;
  line-height: 1.45;
}

.cm-user-note textarea:focus {
  border-color: var(--cm-accent);
  outline: none;
}

.cm-user-note textarea:disabled {
  cursor: wait;
  opacity: 0.65;
}

.cm-user-note p {
  margin: 0;
  color: var(--cm-danger);
  font-size: 12px;
}

.cm-tag-dialog-backdrop {
  position: fixed;
  inset: 0;
  z-index: 30;
  display: grid;
  place-items: center;
  padding: 16px;
  background: var(--cm-backdrop);
}

.cm-tag-dialog {
  width: min(420px, 100%);
  display: grid;
  gap: 12px;
  border: 1px solid var(--cm-border);
  border-radius: 8px;
  background: var(--cm-panel);
  padding: 14px;
  box-shadow: 0 18px 50px oklch(4% 0.01 248 / 46%);
}

.cm-tag-dialog header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.cm-tag-dialog h3,
.cm-tag-dialog p {
  margin: 0;
}

.cm-tag-dialog header p,
.cm-dialog-note {
  color: var(--cm-muted);
  line-height: 1.45;
}

.cm-tag-dialog header button {
  width: 32px;
  height: 32px;
  border: 1px solid var(--cm-border);
  border-radius: 6px;
  background: var(--cm-control-bg);
  color: var(--cm-text);
  cursor: pointer;
}

.cm-tag-dialog .cm-field {
  margin-bottom: 0;
}

.cm-tag-choice-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  min-height: 36px;
}

.cm-tag-choice-grid button {
  min-height: 30px;
  border: 1px solid var(--cm-border);
  border-radius: 999px;
  background: var(--cm-control-bg);
  color: var(--cm-muted);
  padding: 0 11px;
  cursor: pointer;
}

.cm-tag-choice-grid button:hover,
.cm-tag-choice-grid button:focus-visible {
  border-color: var(--cm-accent);
  color: var(--cm-text);
}

.cm-tag-choice-grid button.active {
  border-color: var(--cm-accent);
  background: var(--cm-accent-bg);
  color: var(--cm-accent-text);
}

.cm-tag-editor {
  display: grid;
  gap: 10px;
}

.cm-danger-zone {
  display: grid;
  gap: 9px;
  border-color: oklch(62% 0.18 28 / 55%);
}

.cm-danger-zone h3,
.cm-chat-panel h3 {
  margin: 0;
  font-size: 12px;
}

.cm-danger-zone label {
  display: flex;
  gap: 7px;
  align-items: center;
  color: var(--cm-muted);
  font-size: 12px;
}

.cm-danger-action {
  min-height: 32px;
  border: 1px solid oklch(62% 0.18 28 / 70%);
  border-radius: 6px;
  background: oklch(28% 0.12 28 / 58%);
  color: var(--cm-text);
  padding: 0 10px;
  cursor: pointer;
}

.cm-danger-action.compact {
  min-height: 30px;
  padding: 0 10px;
}

.cm-danger-action.strong {
  background: oklch(42% 0.18 28 / 78%);
  font-weight: 800;
}

.cm-danger-action:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.cm-delete-preview {
  display: grid;
  gap: 8px;
}

.cm-delete-preview article {
  display: grid;
  gap: 3px;
  border: 1px solid var(--cm-border);
  border-radius: 6px;
  background: var(--cm-bg);
  padding: 8px;
}

.cm-delete-preview article span,
.cm-delete-preview p,
.cm-chat-list article span {
  color: var(--cm-muted);
  font-size: 12px;
  line-height: 1.45;
}

.cm-delete-preview .warning {
  color: var(--cm-warning);
}

.cm-delete-preview .error,
.cm-inline-status.error {
  color: var(--cm-danger);
}

.cm-chat-panel {
  display: grid;
  gap: 8px;
}

.cm-chat-list {
  display: grid;
  gap: 6px;
}

.cm-chat-list article {
  display: grid;
  gap: 7px;
  border: 1px solid var(--cm-border);
  border-radius: 6px;
  background: var(--cm-bg);
  padding: 7px 8px;
}

.cm-chat-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
}

.cm-chat-main {
  min-width: 0;
  display: grid;
  gap: 3px;
}

.cm-chat-main input {
  width: 100%;
  min-width: 0;
  border: 1px solid transparent;
  border-radius: 5px;
  background: transparent;
  color: var(--cm-text);
  padding: 2px 4px;
  font: inherit;
  font-weight: 800;
}

.cm-chat-main input:hover,
.cm-chat-main input:focus {
  border-color: var(--cm-border);
  background: var(--cm-control-bg);
  outline: none;
}

.cm-chat-actions {
  display: inline-flex;
  gap: 4px;
}

.cm-chat-actions button {
  width: 28px;
  height: 28px;
  display: inline-grid;
  place-items: center;
  border: 1px solid var(--cm-border);
  border-radius: 6px;
  background: var(--cm-control-bg);
  color: var(--cm-muted);
  cursor: pointer;
}

.cm-chat-actions button:hover,
.cm-chat-actions button:focus-visible {
  border-color: var(--cm-accent);
  color: var(--cm-text);
  background: var(--cm-panel-2);
}

.cm-chat-actions button.danger:hover,
.cm-chat-actions button.danger:focus-visible {
  border-color: var(--cm-danger);
  color: var(--cm-danger);
}

.cm-chat-actions button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.cm-chat-actions svg {
  width: 15px;
  height: 15px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2.1;
}

.cm-chat-content {
  max-height: none;
  margin: 0;
  overflow: visible;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  border-top: 1px solid var(--cm-border);
  padding: 8px 2px 0;
  color: var(--cm-muted);
  font: inherit;
  font-size: 12px;
  line-height: 1.5;
}

.cm-tag-editor .cm-field {
  margin-bottom: 0;
}

.cm-management-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.cm-primary-action {
  min-height: 32px;
  border: 1px solid var(--cm-accent);
  border-radius: 6px;
  background: var(--cm-primary-bg);
  color: var(--cm-text);
  cursor: pointer;
}

.cm-secondary-action {
  min-height: 30px;
  border: 1px solid var(--cm-border);
  border-radius: 6px;
  background: var(--cm-control-bg);
  color: var(--cm-text);
  padding: 0 9px;
  cursor: pointer;
}

.cm-secondary-action.compact {
  min-height: 34px;
  border-radius: 8px;
  padding: 0 12px;
  font-weight: 800;
  line-height: 1;
}

.cm-primary-action:disabled,
.cm-secondary-action:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.cm-mutation-preview {
  display: grid;
  gap: 6px;
}

.cm-mutation-preview p {
  margin: 0;
  color: var(--cm-muted);
  line-height: 1.5;
}

.cm-mutation-preview .error {
  color: var(--cm-danger);
}

.cm-selection-summary {
  display: grid;
  gap: 10px;
}

.cm-section h3 {
  font-size: 12px;
}

.cm-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.cm-section p {
  margin: 5px 0 0;
  color: var(--cm-muted);
  line-height: 1.5;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.cm-greeting-body {
  margin-top: 8px;
}

.cm-greeting-pager {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
}

.cm-greeting-pager button,
.cm-greeting-pager select {
  height: 26px;
  border: 1px solid var(--cm-border);
  border-radius: 6px;
  background: var(--cm-control-bg);
  color: var(--cm-text);
}

.cm-greeting-pager button {
  width: 28px;
  padding: 0;
  font-size: 12px;
  cursor: pointer;
}

.cm-greeting-pager output {
  min-width: 44px;
  color: var(--cm-muted);
  font-size: 12px;
  text-align: center;
}

.cm-greeting-pager select {
  width: 52px;
  padding: 0 6px;
  font-size: 12px;
}

.cm-greeting-pager button:hover:not(:disabled),
.cm-greeting-pager button:focus-visible,
.cm-greeting-pager select:focus-visible {
  border-color: var(--cm-accent);
  background: var(--cm-panel-2);
}

.cm-greeting-pager button:focus-visible,
.cm-greeting-pager select:focus-visible {
  outline: 1px solid var(--cm-accent);
  outline-offset: 2px;
}

.cm-greeting-pager button:disabled {
  cursor: not-allowed;
  opacity: 0.42;
}

.cm-settings-backdrop {
  position: fixed;
  inset: 0;
  z-index: 10;
  display: grid;
  place-items: center;
  padding: 18px;
  background: var(--cm-backdrop);
}

.cm-settings {
  width: min(560px, 100%);
  max-height: min(620px, calc(100vh - 36px));
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  border: 1px solid var(--cm-border);
  border-radius: 8px;
  background: var(--cm-panel);
  color: var(--cm-text);
  overflow: hidden;
}

.cm-settings > header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--cm-border);
}

.cm-settings h2,
.cm-settings h3 {
  margin: 0;
  letter-spacing: 0;
}

.cm-settings h2 {
  font-size: 18px;
}

.cm-settings header p,
.cm-settings-group p {
  margin: 4px 0 0;
  color: var(--cm-muted);
  line-height: 1.45;
}

.cm-settings-group {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 16px;
  align-items: center;
  padding: 16px;
}

.cm-settings-group h3 {
  font-size: 14px;
}

.cm-segmented {
  display: inline-flex;
  gap: 3px;
  padding: 3px;
  border: 1px solid var(--cm-border);
  border-radius: 8px;
  background: var(--cm-control-bg);
}

.cm-segmented button {
  min-width: 58px;
  height: 30px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--cm-muted);
  cursor: pointer;
  font-weight: 700;
}

.cm-segmented button.active {
  background: var(--cm-accent);
  color: var(--cm-accent-contrast);
}

@media (max-width: 1080px) {
  .cm-workspace {
    --cm-left-rail-width: 230px;
    grid-template-columns: minmax(200px, 230px) minmax(320px, 1fr);
  }

  .cm-workspace:not(.right-collapsed) .cm-preview {
    grid-column: 1 / -1;
  }
}

@media (max-width: 720px) {
  .cm-shell {
    padding: 10px;
  }

  .cm-workspace {
    display: flex;
    flex-direction: column;
    grid-template-columns: 1fr;
    align-items: start;
    overflow: auto;
  }

  .cm-panel-toggle {
    display: none;
  }

  .cm-workspace.left-collapsed,
  .cm-workspace.right-collapsed,
  .cm-workspace.left-collapsed.right-collapsed {
    grid-template-columns: 1fr;
  }

  .cm-controls,
  .cm-list-panel,
  .cm-preview {
    width: 100%;
    height: auto;
    max-height: none;
  }

  .cm-list-panel {
    display: block;
    overflow: hidden;
  }

  .cm-list-panel.import-mode {
    display: grid;
    grid-template-rows: minmax(0, 1fr);
  }

  .cm-import-sourcebar {
    grid-template-columns: 1fr;
    padding: 10px;
  }

  .cm-import-summary {
    flex-wrap: wrap;
  }

  .cm-import-summary button {
    margin-left: 0;
  }

  .cm-import-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .cm-import-dialog {
    width: min(100%, calc(100vw - 20px));
    max-height: calc(100vh - 20px);
  }

  .cm-import-dialog-body {
    grid-template-columns: 1fr;
    overflow: auto;
  }

  .cm-import-mini-preview {
    max-height: none;
    overflow: visible;
  }

  .cm-header {
    align-items: flex-start;
  }

  .cm-header-actions {
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .cm-card-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    max-height: min(78vh, 680px);
    overflow: auto;
  }

  .cm-card {
    width: 100%;
    max-width: none;
  }

  .cm-list-head {
    flex-wrap: wrap;
  }

  .cm-list-status,
  .cm-search-field,
  .cm-sort-field,
  .cm-list-tools,
  .cm-gallery-tools {
    flex: 1 1 100%;
  }

  .cm-meta-list {
    grid-template-columns: 1fr;
  }

  .cm-meta-list div,
  .cm-meta-list div:nth-child(odd) {
    border-right: 0;
  }

  .cm-meta-list div:nth-last-child(2) {
    border-bottom: 1px solid var(--cm-border);
  }

  .cm-settings-group {
    grid-template-columns: 1fr;
  }
}
</style>

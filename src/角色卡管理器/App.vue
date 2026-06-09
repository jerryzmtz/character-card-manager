<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { filterCharacters, getFilterCounts, sortCharacters } from './filters';
import { applyTagMutation, loadCharacterOriginalImage, readCharacterDetail, readCharacterList } from './host';
import { getTagCounts, previewTagMutation } from './tags';
import type {
  CharacterDetail,
  CharacterFilter,
  CharacterSort,
  CharacterSummary,
  CharacterTag,
  TagFilterMode,
  TagMutationAction,
  TagMutationPreview,
} from './types';

const DETAIL_LOADING_DELAY_MS = 180;
const TAG_FILTER_MODE_KEY = 'character-card-manager:tag-filter-mode';

const filters: { id: CharacterFilter; label: string }[] = [
  { id: 'all', label: '全部' },
  { id: 'favorite', label: '收藏' },
  { id: 'worldBook', label: '世界书' },
  { id: 'missingGreeting', label: '缺开场白' },
  { id: 'untagged', label: '未打标签' },
  { id: 'error', label: '读取异常' },
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
const selectionMode = ref(false);
const selectedFiles = ref<Set<string>>(new Set());
const tagAction = ref<TagMutationAction>('add');
const selectedTagId = ref('');
const newTagName = ref('');
const tagPreview = ref<TagMutationPreview | null>(null);
const tagStatus = ref('');
const applyingTags = ref(false);
const avatarUrlIndex = ref<Record<string, number>>({});
const originalAvatarUrls = ref<Record<string, string>>({});
const loadingOriginalAvatars = new Set<string>();
const cardSizes = [
  { label: '小', width: 132 },
  { label: '中', width: 168 },
  { label: '大', width: 216 },
  { label: '特大', width: 268 },
];
let detailRequestId = 0;
let detailLoadingTimer: ReturnType<typeof setTimeout> | undefined;

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
const previewAltGreetingCount = computed(() => {
  if (!detailPreview.value) return 0;
  return 'alternate_greetings' in detailPreview.value
    ? detailPreview.value.alternate_greetings.length
    : detailPreview.value.altGreetingCount;
});
const cardSize = computed(() => cardSizes[cardSizeIndex.value]);
const cardGridStyle = computed(() => ({ '--cm-card-min': `${cardSize.value.width}px` }));

onMounted(() => {
  void refreshList();
});

onUnmounted(() => {
  clearDetailLoadingTimer();
});

async function refreshList() {
  loadingList.value = true;
  selectedDetail.value = null;
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
  if (filter !== 'all') activeTagIds.value = [];
}

function activateTagFilter(tagId: string) {
  activeTagIds.value = activeTagIds.value.includes(tagId)
    ? activeTagIds.value.filter(id => id !== tagId)
    : [...activeTagIds.value, tagId];
  if (activeTagIds.value.length > 0) activeFilter.value = 'all';
}

async function selectCharacter(character: CharacterSummary) {
  const requestId = detailRequestId + 1;
  detailRequestId = requestId;
  selectedFile.value = character.fileName;
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
    return localStorage.getItem(TAG_FILTER_MODE_KEY) === 'and' ? 'and' : 'or';
  } catch {
    return 'or';
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

function changeCardSize(delta: number) {
  cardSizeIndex.value = Math.min(Math.max(cardSizeIndex.value + delta, 0), cardSizes.length - 1);
}

function toggleSelectionMode() {
  selectionMode.value = !selectionMode.value;
  clearTagPreview();
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
}

function selectVisibleCharacters() {
  selectedFiles.value = new Set([...selectedFiles.value, ...visibleCharacters.value.map(character => character.fileName)]);
  clearTagPreview();
}

function clearSelection() {
  selectedFiles.value = new Set();
  clearTagPreview();
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
    originalAvatarUrls.value = {
      ...originalAvatarUrls.value,
      [character.fileName]: url,
    };
  } catch {
    // 继续使用普通 URL 和缩略图兜底。
  } finally {
    loadingOriginalAvatars.delete(character.fileName);
  }
}

function requestClose() {
  window.parent?.postMessage({ source: 'character-card-manager', type: 'close' }, '*');
}
</script>

<template>
  <main class="cm-shell" aria-label="角色卡管理器">
    <header class="cm-header">
      <div>
        <h1>角色卡管理器</h1>
      </div>
      <div class="cm-header-actions" aria-label="面板操作">
        <button
          class="cm-icon-button"
          type="button"
          title="设置"
          :aria-pressed="settingsOpen"
          @click="settingsOpen = true"
        >
          ⚙
        </button>
        <button
          class="cm-icon-button"
          type="button"
          :title="leftCollapsed ? '展开左栏' : '收起左栏'"
          :aria-pressed="leftCollapsed"
          @click="leftCollapsed = !leftCollapsed"
        >
          ◧
        </button>
        <button
          class="cm-icon-button"
          type="button"
          :title="rightCollapsed ? '展开右栏' : '收起右栏'"
          :aria-pressed="rightCollapsed"
          @click="rightCollapsed = !rightCollapsed"
        >
          ◨
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
      <aside class="cm-controls" aria-label="筛选和排序" :aria-hidden="leftCollapsed">
        <label class="cm-field">
          <span>搜索</span>
          <input v-model="query" type="search" placeholder="名称、作者、文件名、描述" />
        </label>

        <label class="cm-field">
          <span>排序</span>
          <select v-model="sortBy">
            <option value="date_added">导入时间</option>
            <option value="date_last_chat">最后聊天</option>
            <option value="name">名称</option>
          </select>
        </label>

        <div class="cm-filter-list" role="tablist" aria-label="角色筛选">
          <button
            v-for="item in filters"
            :key="item.id"
            type="button"
            :class="{ active: activeFilter === item.id }"
            @click="activateFilter(item.id)"
          >
            <span>{{ item.label }}</span>
            <strong>{{ filterCounts[item.id] }}</strong>
          </button>
        </div>

        <section class="cm-tag-filter" aria-label="标签筛选">
          <div class="cm-side-heading">
            <strong>标签</strong>
          </div>
          <div v-if="tavernTags.length === 0" class="cm-side-empty">暂无酒馆标签</div>
          <button
            v-for="tag in tavernTags"
            :key="tag.id"
            type="button"
            :class="{ active: activeTagIds.includes(tag.id) }"
            :aria-pressed="activeTagIds.includes(tag.id)"
            @click="activateTagFilter(tag.id)"
          >
            <span>
              <i :style="{ background: tag.color || 'oklch(62% 0.16 250)' }"></i>
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

      <section class="cm-list-panel" aria-label="角色缩略图列表">
        <div class="cm-list-head">
          <strong>{{ visibleCharacters.length }} 个匹配项</strong>
          <span v-if="loadingList">正在刷新...</span>
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

        <div v-else class="cm-card-grid" :style="cardGridStyle">
          <article
            v-for="character in visibleCharacters"
            :key="character.fileName"
            role="button"
            tabindex="0"
            class="cm-card"
            :class="{ active: selectedFile === character.fileName, selected: selectedFiles.has(character.fileName) }"
            @click="selectCharacter(character)"
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
              <span class="cm-card-badges" aria-hidden="true">
                <b v-if="character.fav" title="收藏">★</b>
                <b v-if="character.tags.length">{{ character.tags.length }}</b>
              </span>
            </span>
            <span class="cm-card-text">
              <strong>{{ character.name }}</strong>
              <small v-if="character.tags.length">
                {{ character.tags.slice(0, 2).map(tag => tag.name).join('、') }}
              </small>
            </span>
          </article>
        </div>
      </section>

      <section class="cm-preview" aria-label="角色详情预览" :aria-hidden="rightCollapsed">
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
          </div>

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
        <template v-else>
          <div class="cm-preview-head">
            <img :src="getAvatarSrc(activePreview)" :alt="activePreview.name" @error="handleAvatarError(activePreview)" />
            <div>
              <h2>{{ activePreview.name }}</h2>
              <p>{{ activePreview.fav ? '已收藏' : '未收藏' }}</p>
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
            <span v-for="tag in activePreview.tags" v-else :key="tag.id">{{ tag.name }}</span>
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

          <article class="cm-section">
            <h3>主开场白</h3>
            <p>{{ truncate(previewFirstMessage, '无内容', 160) }}</p>
          </article>

          <article class="cm-section">
            <h3>备选开场白</h3>
            <p>{{ previewAltGreetingCount }} 条</p>
          </article>
        </template>
      </section>
    </section>

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
            <p>选择多个标签时，决定角色需要命中任意标签还是全部标签。</p>
          </div>
          <div class="cm-segmented" role="radiogroup" aria-label="标签过滤逻辑">
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
  --cm-border: oklch(34% 0.018 248);
  --cm-text: oklch(91% 0.01 248);
  --cm-muted: oklch(70% 0.018 248);
  --cm-weak: oklch(55% 0.018 248);
  --cm-accent: oklch(62% 0.16 250);
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

.cm-header p,
.cm-preview p,
.cm-list-head > span {
  color: var(--cm-muted);
}

.cm-header p {
  margin: 3px 0 0;
  font-size: 12px;
}

.cm-icon-button {
  width: 34px;
  height: 34px;
  border: 1px solid var(--cm-border);
  border-radius: 6px;
  background: var(--cm-panel-2);
  color: var(--cm-text);
  cursor: pointer;
}

.cm-icon-button:disabled {
  cursor: wait;
  opacity: 0.65;
}

.cm-icon-button[aria-pressed='true'] {
  border-color: var(--cm-accent);
  color: oklch(87% 0.06 250);
}

.cm-icon-button.danger {
  font-size: 20px;
}

.cm-workspace {
  display: grid;
  grid-template-columns: minmax(260px, 300px) minmax(420px, 1fr) minmax(300px, 360px);
  gap: 12px;
  margin-top: 12px;
  min-height: 0;
  align-items: start;
  transition: grid-template-columns 160ms ease;
}

.cm-workspace.left-collapsed {
  grid-template-columns: 0 minmax(420px, 1fr) minmax(300px, 360px);
}

.cm-workspace.right-collapsed {
  grid-template-columns: minmax(260px, 300px) minmax(420px, 1fr) 0;
}

.cm-workspace.left-collapsed.right-collapsed {
  grid-template-columns: 0 minmax(420px, 1fr) 0;
}

.cm-controls,
.cm-list-panel,
.cm-preview {
  min-height: 0;
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
  background: var(--cm-bg);
  color: var(--cm-text);
  padding: 0 10px;
}

.cm-filter-list,
.cm-tag-filter {
  display: grid;
  gap: 6px;
}

.cm-tag-filter {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--cm-border);
}

.cm-side-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2px;
  color: var(--cm-muted);
  font-size: 12px;
}

.cm-side-empty {
  color: var(--cm-weak);
  font-size: 12px;
  line-height: 1.5;
}

.cm-filter-list button,
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

.cm-filter-list button.active,
.cm-tag-filter button.active {
  border-color: var(--cm-accent);
  color: oklch(87% 0.06 250);
}

.cm-tag-filter span {
  min-width: 0;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cm-tag-filter i {
  flex: 0 0 auto;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.cm-filter-list strong,
.cm-tag-filter strong {
  color: var(--cm-muted);
  font-size: 12px;
}

.cm-issue-box,
.cm-risk-list {
  margin-top: 12px;
  border: 1px solid var(--cm-border);
  border-radius: 6px;
  background: var(--cm-bg);
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
  overflow: auto;
}

.cm-list-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 11px 12px;
  border-bottom: 1px solid var(--cm-border);
}

.cm-list-head > span {
  margin-left: auto;
}

.cm-list-tools {
  min-width: 0;
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
  background: var(--cm-bg);
  color: var(--cm-text);
  padding: 0 9px;
  font-size: 12px;
}

.cm-list-tools button {
  cursor: pointer;
}

.cm-selection-toggle[aria-pressed='true'] {
  border-color: var(--cm-accent);
  color: oklch(87% 0.06 250);
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
  background: var(--cm-bg);
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
  grid-template-columns: repeat(auto-fill, minmax(var(--cm-card-min, 168px), 1fr));
  gap: 12px;
  padding: 12px;
}

.cm-card {
  position: relative;
  min-width: 0;
  display: grid;
  grid-template-rows: auto minmax(24px, auto);
  gap: 8px;
  width: 100%;
  padding: 8px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: var(--cm-bg);
  color: var(--cm-text);
  text-align: left;
  cursor: pointer;
}

.cm-card:hover,
.cm-card.active,
.cm-card.selected {
  border-color: var(--cm-accent);
  background: oklch(24% 0.025 250);
}

.cm-card.selected {
  box-shadow: inset 0 0 0 1px var(--cm-accent);
}

.cm-card-check {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 1;
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: oklch(13% 0.012 248 / 84%);
  cursor: pointer;
}

.cm-card-check input {
  width: 16px;
  height: 16px;
  accent-color: var(--cm-accent);
}

.cm-thumb {
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 3 / 4;
  border-radius: 6px;
  overflow: hidden;
  background: oklch(13% 0.01 248);
}

.cm-thumb img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  image-rendering: auto;
  background: oklch(13% 0.01 248);
}

.cm-card-badges {
  position: absolute;
  right: 6px;
  bottom: 6px;
  display: inline-flex;
  gap: 4px;
}

.cm-card-badges b {
  min-width: 18px;
  height: 18px;
  display: inline-grid;
  place-items: center;
  border-radius: 999px;
  background: oklch(13% 0.012 248 / 82%);
  color: oklch(86% 0.07 250);
  font-size: 11px;
  line-height: 1;
}

.cm-preview-head img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  image-rendering: auto;
  background: oklch(13% 0.01 248);
}

.cm-card-text {
  min-width: 0;
}

.cm-card-text strong {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 24px;
}

.cm-card-text small {
  display: block;
  margin-top: -3px;
  overflow: hidden;
  color: var(--cm-weak);
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
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
}

.cm-preview-head {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr);
  align-items: center;
  gap: 10px;
}

.cm-preview-head img {
  width: 48px;
  height: 48px;
  border-radius: 6px;
}

.cm-preview-head h2 {
  font-size: 17px;
  line-height: 1.25;
  overflow-wrap: anywhere;
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
  background: var(--cm-bg);
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
.cm-tag-editor,
.cm-mutation-preview,
.cm-selection-summary {
  border: 1px solid var(--cm-border);
  border-radius: 6px;
  background: var(--cm-bg);
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

.cm-detail-tags span {
  border: 1px solid var(--cm-border);
  border-radius: 999px;
  color: var(--cm-muted);
  padding: 2px 7px;
  font-size: 12px;
}

.cm-tag-editor {
  display: grid;
  gap: 10px;
}

.cm-tag-editor .cm-field {
  margin-bottom: 0;
}

.cm-primary-action {
  min-height: 32px;
  border: 1px solid var(--cm-accent);
  border-radius: 6px;
  background: oklch(28% 0.055 250);
  color: var(--cm-text);
  cursor: pointer;
}

.cm-primary-action:disabled {
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

.cm-section p {
  margin: 5px 0 0;
  color: var(--cm-muted);
  line-height: 1.5;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.cm-settings-backdrop {
  position: fixed;
  inset: 0;
  z-index: 10;
  display: grid;
  place-items: center;
  padding: 18px;
  background: oklch(8% 0.01 248 / 76%);
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
  background: var(--cm-bg);
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
  background: oklch(72% 0.045 92);
  color: oklch(18% 0.014 248);
}

@media (max-width: 1080px) {
  .cm-workspace {
    grid-template-columns: minmax(260px, 320px) minmax(320px, 1fr);
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
    grid-template-columns: 1fr;
  }

  .cm-workspace.left-collapsed,
  .cm-workspace.right-collapsed,
  .cm-workspace.left-collapsed.right-collapsed {
    grid-template-columns: 1fr;
  }

  .cm-header {
    align-items: flex-start;
  }

  .cm-header-actions {
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .cm-card-grid {
    grid-template-columns: repeat(auto-fill, minmax(min(var(--cm-card-min, 168px), 100%), 1fr));
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

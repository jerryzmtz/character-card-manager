<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { filterCharacters, getFilterCount, sortCharacters } from './filters';
import { loadCharacterOriginalImage, readCharacterDetail, readCharacterList } from './host';
import type { CharacterDetail, CharacterFilter, CharacterSort, CharacterSummary } from './types';

const filters: { id: CharacterFilter; label: string }[] = [
  { id: 'all', label: '全部' },
  { id: 'favorite', label: '收藏' },
  { id: 'worldBook', label: '世界书' },
  { id: 'missingGreeting', label: '缺开场白' },
  { id: 'error', label: '读取异常' },
];

const characters = ref<CharacterSummary[]>([]);
const selectedFile = ref('');
const selectedDetail = ref<CharacterDetail | null>(null);
const loadingList = ref(false);
const loadingDetail = ref(false);
const query = ref('');
const activeFilter = ref<CharacterFilter>('all');
const sortBy = ref<CharacterSort>('date_added');
const globalIssues = ref<string[]>([]);
const leftCollapsed = ref(false);
const rightCollapsed = ref(false);
const cardSizeIndex = ref(1);
const avatarUrlIndex = ref<Record<string, number>>({});
const originalAvatarUrls = ref<Record<string, string>>({});
const loadingOriginalAvatars = new Set<string>();
const cardSizes = [
  { label: '小', width: 132 },
  { label: '中', width: 168 },
  { label: '大', width: 216 },
  { label: '特大', width: 268 },
];

const visibleCharacters = computed(() =>
  sortCharacters(filterCharacters(characters.value, query.value, activeFilter.value), sortBy.value),
);

const selectedSummary = computed(() => characters.value.find(character => character.fileName === selectedFile.value));

const issueCount = computed(() => characters.value.reduce((count, character) => count + character.issues.length, 0));

const activePreview = computed(() => selectedDetail.value || selectedSummary.value || null);
const previewRiskIssues = computed(() => activePreview.value?.issues.filter(issue => issue.level !== 'info') || []);
const cardSize = computed(() => cardSizes[cardSizeIndex.value]);
const cardGridStyle = computed(() => ({ '--cm-card-min': `${cardSize.value.width}px` }));

onMounted(() => {
  void refreshList();
});

async function refreshList() {
  loadingList.value = true;
  selectedDetail.value = null;
  globalIssues.value = [];
  try {
    const result = await readCharacterList();
    characters.value = result.characters;
    globalIssues.value = result.issues.map(issue => issue.message);
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

async function selectCharacter(character: CharacterSummary) {
  selectedFile.value = character.fileName;
  selectedDetail.value = null;
  loadingDetail.value = true;
  try {
    selectedDetail.value = await readCharacterDetail(character.fileName, character);
  } finally {
    loadingDetail.value = false;
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
        <p>{{ characters.length }} 个角色，{{ issueCount }} 条提示</p>
      </div>
      <div class="cm-header-actions" aria-label="面板操作">
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
            @click="activeFilter = item.id"
          >
            <span>{{ item.label }}</span>
            <strong>{{ getFilterCount(characters, item.id) }}</strong>
          </button>
        </div>

        <div v-if="globalIssues.length" class="cm-issue-box" role="status">
          <strong>读取提示</strong>
          <p v-for="issue in globalIssues" :key="issue">{{ issue }}</p>
        </div>
      </aside>

      <section class="cm-list-panel" aria-label="角色缩略图列表">
        <div class="cm-list-head">
          <strong>{{ visibleCharacters.length }} 个匹配项</strong>
          <span v-if="loadingList">正在刷新...</span>
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
          <button
            v-for="character in visibleCharacters"
            :key="character.fileName"
            type="button"
            class="cm-card"
            :class="{ active: selectedFile === character.fileName }"
            @click="selectCharacter(character)"
          >
            <span class="cm-thumb">
              <img
                :src="getAvatarSrc(character)"
                :alt="character.name"
                loading="lazy"
                @error="handleAvatarError(character)"
              />
            </span>
            <span class="cm-card-text">
              <strong>{{ character.name }}</strong>
            </span>
          </button>
        </div>
      </section>

      <section class="cm-preview" aria-label="角色详情预览" :aria-hidden="rightCollapsed">
        <div v-if="!activePreview" class="cm-empty">请选择一个角色查看详情。</div>
        <template v-else>
          <div class="cm-preview-head">
            <img :src="getAvatarSrc(activePreview)" :alt="activePreview.name" @error="handleAvatarError(activePreview)" />
            <div>
              <h2>{{ activePreview.name }}</h2>
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

          <div v-if="loadingDetail" class="cm-inline-status">正在读取详情...</div>

          <div v-if="previewRiskIssues.length" class="cm-risk-list">
            <p v-for="issue in previewRiskIssues" :key="issue.message" :class="issue.level">
              {{ issue.message }}
            </p>
          </div>

          <article class="cm-section">
            <h3>描述</h3>
            <p>{{ truncate(selectedDetail?.description || activePreview.desc, '无内容', 160) }}</p>
          </article>

          <article class="cm-section">
            <h3>主开场白</h3>
            <p>{{ truncate(selectedDetail?.first_mes || activePreview.firstMes, '无内容', 160) }}</p>
          </article>

          <article class="cm-section">
            <h3>备选开场白</h3>
            <p>{{ selectedDetail?.alternate_greetings.length ?? activePreview.altGreetingCount }} 条</p>
          </article>
        </template>
      </section>
    </section>
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
.cm-list-head span {
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

.cm-filter-list {
  display: grid;
  gap: 6px;
}

.cm-filter-list button {
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

.cm-filter-list button.active {
  border-color: var(--cm-accent);
  color: oklch(87% 0.06 250);
}

.cm-filter-list strong {
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
  min-width: 0;
  display: grid;
  grid-template-rows: auto 24px;
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
.cm-card.active {
  border-color: var(--cm-accent);
  background: oklch(24% 0.025 250);
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
}
</style>

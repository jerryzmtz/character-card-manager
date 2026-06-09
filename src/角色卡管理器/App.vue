<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { filterCharacters, getFilterCount, sortCharacters } from './filters';
import { readCharacterDetail, readCharacterList } from './host';
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

const visibleCharacters = computed(() =>
  sortCharacters(filterCharacters(characters.value, query.value, activeFilter.value), sortBy.value),
);

const selectedSummary = computed(() => characters.value.find(character => character.fileName === selectedFile.value));

const issueCount = computed(() => characters.value.reduce((count, character) => count + character.issues.length, 0));

const activePreview = computed(() => selectedDetail.value || selectedSummary.value || null);

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

function truncate(text: string, fallback = '无内容'): string {
  if (!text) return fallback;
  return text.length > 180 ? `${text.slice(0, 180)}...` : text;
}
</script>

<template>
  <main class="cm-shell" aria-label="角色卡管理器">
    <header class="cm-header">
      <div>
        <h1>角色卡管理器</h1>
        <p>{{ characters.length }} 个角色，{{ issueCount }} 条提示</p>
      </div>
      <button class="cm-icon-button" type="button" title="刷新列表" :disabled="loadingList" @click="refreshList">
        ↻
      </button>
    </header>

    <section class="cm-workspace">
      <aside class="cm-controls" aria-label="筛选和排序">
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

      <section class="cm-list-panel" aria-label="角色列表">
        <div class="cm-list-head">
          <strong>{{ visibleCharacters.length }} 个匹配项</strong>
          <span v-if="loadingList">正在刷新...</span>
        </div>

        <div v-if="!loadingList && visibleCharacters.length === 0" class="cm-empty">
          没有匹配的角色卡，调整搜索或刷新列表。
        </div>

        <button
          v-for="character in visibleCharacters"
          :key="character.fileName"
          type="button"
          class="cm-row"
          :class="{ active: selectedFile === character.fileName }"
          @click="selectCharacter(character)"
        >
          <img :src="character.avatarUrl" :alt="character.name" loading="lazy" />
          <span class="cm-row-main">
            <strong>{{ character.name }}</strong>
            <small>{{ character.fileName }}</small>
          </span>
          <span class="cm-row-tags">
            <em v-if="character.fav">收藏</em>
            <em v-if="character.character_book">世界书</em>
            <em v-if="!character.firstMes" class="warning">缺开场白</em>
          </span>
        </button>
      </section>

      <section class="cm-preview" aria-label="角色详情预览">
        <div v-if="!activePreview" class="cm-empty">请选择一个角色查看详情。</div>
        <template v-else>
          <div class="cm-preview-head">
            <img :src="activePreview.avatarUrl" :alt="activePreview.name" />
            <div>
              <h2>{{ activePreview.name }}</h2>
              <p>{{ activePreview.fileName }}</p>
            </div>
          </div>

          <div class="cm-meta-grid">
            <span><strong>作者</strong>{{ activePreview.creator || '未知' }}</span>
            <span><strong>版本</strong>{{ activePreview.character_version || '未知' }}</span>
            <span><strong>世界书</strong>{{ activePreview.character_book || '无' }}</span>
            <span><strong>Token</strong>{{ activePreview.tokens || '未知' }}</span>
            <span><strong>导入时间</strong>{{ formatDate(activePreview.date_added) }}</span>
            <span><strong>最后聊天</strong>{{ formatDate(activePreview.date_last_chat) }}</span>
          </div>

          <div v-if="loadingDetail" class="cm-inline-status">正在读取详情...</div>

          <div v-if="activePreview.issues.length" class="cm-risk-list">
            <p v-for="issue in activePreview.issues" :key="issue.message" :class="issue.level">
              {{ issue.message }}
            </p>
          </div>

          <article class="cm-section">
            <h3>描述</h3>
            <p>{{ truncate(selectedDetail?.description || activePreview.desc) }}</p>
          </article>

          <article class="cm-section">
            <h3>主开场白</h3>
            <p>{{ truncate(selectedDetail?.first_mes || activePreview.firstMes) }}</p>
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
.cm-row small,
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

.cm-workspace {
  display: grid;
  grid-template-columns: minmax(280px, 330px) minmax(320px, 1fr) minmax(320px, 430px);
  gap: 12px;
  margin-top: 12px;
  min-height: 0;
  align-items: start;
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
  justify-content: space-between;
  padding: 11px 12px;
  border-bottom: 1px solid var(--cm-border);
}

.cm-row {
  display: grid;
  grid-template-columns: 46px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 64px;
  padding: 8px 12px;
  border: 0;
  border-bottom: 1px solid var(--cm-border);
  background: transparent;
  color: var(--cm-text);
  text-align: left;
  cursor: pointer;
}

.cm-row.active {
  background: oklch(28% 0.035 250);
}

.cm-row img,
.cm-preview-head img {
  width: 46px;
  height: 46px;
  border-radius: 6px;
  object-fit: cover;
  background: var(--cm-bg);
}

.cm-row-main {
  min-width: 0;
  display: grid;
  gap: 3px;
}

.cm-row-main strong,
.cm-row-main small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cm-row-tags {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 4px;
}

.cm-row-tags em {
  border: 1px solid var(--cm-border);
  border-radius: 999px;
  padding: 2px 7px;
  color: var(--cm-muted);
  font-style: normal;
  font-size: 11px;
}

.cm-row-tags .warning {
  color: var(--cm-warning);
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
  gap: 12px;
}

.cm-preview-head {
  display: grid;
  grid-template-columns: 58px minmax(0, 1fr);
  align-items: center;
  gap: 12px;
}

.cm-preview-head img {
  width: 58px;
  height: 58px;
}

.cm-preview-head h2 {
  font-size: 17px;
  overflow-wrap: anywhere;
}

.cm-preview-head p {
  margin: 4px 0 0;
  overflow-wrap: anywhere;
  font-size: 12px;
}

.cm-meta-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.cm-meta-grid span {
  min-width: 0;
  border: 1px solid var(--cm-border);
  border-radius: 6px;
  background: var(--cm-bg);
  padding: 8px;
  color: var(--cm-muted);
  overflow-wrap: anywhere;
}

.cm-meta-grid strong {
  display: block;
  margin-bottom: 3px;
  color: var(--cm-weak);
  font-size: 11px;
}

.cm-section {
  border-top: 1px solid var(--cm-border);
  padding-top: 10px;
}

.cm-section h3 {
  font-size: 13px;
}

.cm-section p {
  margin: 6px 0 0;
  line-height: 1.6;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

@media (max-width: 1080px) {
  .cm-workspace {
    grid-template-columns: minmax(260px, 320px) minmax(320px, 1fr);
  }

  .cm-preview {
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

  .cm-row {
    grid-template-columns: 42px minmax(0, 1fr);
  }

  .cm-row-tags {
    grid-column: 2;
    justify-content: flex-start;
  }

  .cm-meta-grid {
    grid-template-columns: 1fr;
  }
}
</style>

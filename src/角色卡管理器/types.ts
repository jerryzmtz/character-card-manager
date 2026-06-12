export type CharacterFilter = 'all' | 'favorite' | 'worldBook' | 'missingGreeting' | 'untagged' | 'error';

export type CharacterSort = 'date_added' | 'date_last_chat' | 'name';

export type TagFilterMode = 'exclusive' | 'or' | 'and';

export interface CharacterIssue {
  level: 'info' | 'warning' | 'error';
  message: string;
}

export interface CharacterTag {
  id: string;
  name: string;
  color?: string;
}

export interface CharacterSummary {
  fileName: string;
  name: string;
  avatarUrl: string;
  avatarFallbackUrls: string[];
  fav: boolean;
  tagIds: string[];
  tags: CharacterTag[];
  date_added: number;
  date_last_chat: number;
  creator: string;
  character_version: string;
  character_book: string;
  sourceUrl: string;
  firstMes: string;
  altGreetingCount: number;
  tokens: number;
  desc: string;
  issues: CharacterIssue[];
  detailLoaded: boolean;
  readError?: string;
}

export interface CharacterDetail extends CharacterSummary {
  description: string;
  personality: string;
  scenario: string;
  first_mes: string;
  alternate_greetings: string[];
  mes_example: string;
  system_prompt: string;
  creator_notes: string;
  post_history_instructions: string;
}

export interface CharacterListState {
  characters: CharacterSummary[];
  tags: CharacterTag[];
  tagMap: Record<string, string[]>;
  issues: CharacterIssue[];
}

export type TagMutationAction = 'add' | 'remove' | 'create';

export interface TagMutationDraft {
  action: TagMutationAction;
  fileNames: string[];
  tagId?: string;
  tagName?: string;
  tagColor?: string;
}

export interface TagMutationPreview {
  action: TagMutationAction;
  tagId: string;
  tagName: string;
  tagColor?: string;
  createsTag: boolean;
  targetFileNames: string[];
  changedFileNames: string[];
  unchangedFileNames: string[];
  errors: string[];
}

export interface TagMutationResult {
  success: boolean;
  message: string;
  preview: TagMutationPreview;
  tags: CharacterTag[];
  tagMap: Record<string, string[]>;
}

export interface CharacterFavoriteMutationResult {
  success: boolean;
  message: string;
  fileName: string;
  fav: boolean;
}

export interface CharacterRenamePreview {
  oldFileName: string;
  oldName: string;
  inputName: string;
  sanitizedName: string;
  targetFileName: string;
  tagIdsToMove: string[];
  errors: string[];
  warnings: string[];
}

export interface CharacterRenameResult {
  success: boolean;
  message: string;
  oldFileName: string;
  newFileName?: string;
  preview: CharacterRenamePreview;
}

export interface CharacterExportResult {
  success: boolean;
  message: string;
  fileName: string;
}

export interface CharacterZipExportResult {
  success: boolean;
  message: string;
  zipFileName: string;
  exportedFileNames: string[];
  failedFileNames: string[];
}

export interface CharacterSourceUrlMutationResult {
  success: boolean;
  message: string;
  fileName: string;
  sourceUrl: string;
}

export type CharacterImportSourceKind = 'file' | 'url';

export type CharacterImportFormat = 'json' | 'png';

export type CharacterImportSourceFormat = CharacterImportFormat | 'zip';

export type CharacterImportAction = 'create' | 'update';

export type CharacterImportStatus = 'ready' | 'error' | 'success' | 'failed';

export interface CharacterImportCandidate {
  id: string;
  sourceKind: CharacterImportSourceKind;
  sourceName: string;
  fileName: string;
  format: CharacterImportFormat;
  blob: Blob;
  raw: Record<string, any>;
  card: Record<string, any>;
  summary: CharacterSummary;
  action: CharacterImportAction;
  status: CharacterImportStatus;
  issues: CharacterIssue[];
  nameConflict?: CharacterSummary;
  match?: CharacterSummary;
  existingDetail?: CharacterDetail;
  mergedRaw: Record<string, any>;
  importBlob: Blob;
  diff: CharacterImportDiffGroup[];
  resultMessage?: string;
}

export interface CharacterImportDiffGroup {
  id: string;
  title: string;
  rows: CharacterImportDiffRow[];
}

export interface CharacterImportDiffRow {
  label: string;
  oldValue: string;
  newValue: string;
  finalValue: string;
  changed: boolean;
  preserved?: boolean;
}

export interface CharacterImportParseInput {
  sourceKind: CharacterImportSourceKind;
  sourceName: string;
  blob: Blob;
  contentType?: string;
}

export interface CharacterImportApplyResult {
  id: string;
  fileName: string;
  success: boolean;
  message: string;
}

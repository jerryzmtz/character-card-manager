export type CharacterFilter = 'all' | 'favorite' | 'worldBook' | 'missingGreeting' | 'untagged' | 'error';

export type CharacterSort = 'date_added' | 'date_last_chat' | 'name';

export type TagFilterMode = 'or' | 'and';

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

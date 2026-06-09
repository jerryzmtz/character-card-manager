export type CharacterFilter = 'all' | 'favorite' | 'worldBook' | 'missingGreeting' | 'error';

export type CharacterSort = 'date_added' | 'date_last_chat' | 'name';

export interface CharacterIssue {
  level: 'info' | 'warning' | 'error';
  message: string;
}

export interface CharacterSummary {
  fileName: string;
  name: string;
  avatarUrl: string;
  avatarFallbackUrls: string[];
  fav: boolean;
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
  issues: CharacterIssue[];
}

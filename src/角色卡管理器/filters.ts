import type { CharacterFilter, CharacterSort, CharacterSummary, TagFilterMode } from './types';
import { isArchivedCharacter } from './tags';

export function filterCharacters(
  characters: CharacterSummary[],
  query: string,
  filter: CharacterFilter,
  activeTagIds: string[] = [],
  tagFilterMode: TagFilterMode = 'exclusive',
): CharacterSummary[] {
  const keyword = query.trim().toLocaleLowerCase('zh-CN');
  return characters.filter(character => {
    const archived = isArchivedCharacter(character);
    if (filter === 'archived') {
      if (!archived) return false;
    } else {
      if (archived) return false;
      if (!matchesFilter(character, filter)) return false;
      if (!matchesTags(character, activeTagIds, tagFilterMode)) return false;
    }
    if (!keyword) return true;
    return getSearchText(character).toLocaleLowerCase('zh-CN').includes(keyword);
  });
}

export function sortCharacters(characters: CharacterSummary[], sortBy: CharacterSort): CharacterSummary[] {
  return [...characters].sort((lhs, rhs) => {
    if (sortBy === 'name') {
      return lhs.name.localeCompare(rhs.name, 'zh-CN');
    }
    return (rhs[sortBy] || 0) - (lhs[sortBy] || 0);
  });
}

export function getFilterCount(characters: CharacterSummary[], filter: CharacterFilter): number {
  if (filter === 'archived') return characters.filter(isArchivedCharacter).length;
  return characters.filter(character => !isArchivedCharacter(character) && matchesFilter(character, filter)).length;
}

export function getFilterCounts(characters: CharacterSummary[]): Record<CharacterFilter, number> {
  const visibleCharacters = characters.filter(character => !isArchivedCharacter(character));
  const counts: Record<CharacterFilter, number> = {
    all: visibleCharacters.length,
    favorite: 0,
    archived: characters.length - visibleCharacters.length,
    worldBook: 0,
    missingGreeting: 0,
    untagged: 0,
    error: 0,
  };

  visibleCharacters.forEach(character => {
    if (matchesFilter(character, 'favorite')) counts.favorite += 1;
    if (matchesFilter(character, 'worldBook')) counts.worldBook += 1;
    if (matchesFilter(character, 'missingGreeting')) counts.missingGreeting += 1;
    if (matchesFilter(character, 'untagged')) counts.untagged += 1;
    if (matchesFilter(character, 'error')) counts.error += 1;
  });

  return counts;
}

function matchesFilter(character: CharacterSummary, filter: CharacterFilter): boolean {
  if (filter === 'favorite') return character.fav;
  if (filter === 'worldBook') return Boolean(character.character_book);
  if (filter === 'missingGreeting') return !character.firstMes;
  if (filter === 'untagged') return character.tagIds.length === 0;
  if (filter === 'error') return character.issues.some(issue => issue.level === 'error');
  return true;
}

function matchesTags(character: CharacterSummary, activeTagIds: string[], tagFilterMode: TagFilterMode): boolean {
  if (activeTagIds.length === 0) return true;
  if (tagFilterMode === 'exclusive') {
    return character.tagIds.includes(activeTagIds[0]);
  }
  if (tagFilterMode === 'and') {
    return activeTagIds.every(id => character.tagIds.includes(id));
  }
  return activeTagIds.some(id => character.tagIds.includes(id));
}

function getSearchText(character: CharacterSummary): string {
  return [
    character.name,
    character.fileName,
    character.creator,
    character.character_version,
    character.character_book,
    ...character.tags.map(tag => tag.name),
    character.desc,
    character.firstMes,
  ].join(' ');
}

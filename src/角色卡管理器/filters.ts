import type { CharacterFilter, CharacterSort, CharacterSummary } from './types';

export function filterCharacters(
  characters: CharacterSummary[],
  query: string,
  filter: CharacterFilter,
): CharacterSummary[] {
  const keyword = query.trim().toLocaleLowerCase('zh-CN');
  return characters.filter(character => {
    if (!matchesFilter(character, filter)) return false;
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
  return characters.filter(character => matchesFilter(character, filter)).length;
}

function matchesFilter(character: CharacterSummary, filter: CharacterFilter): boolean {
  if (filter === 'favorite') return character.fav;
  if (filter === 'worldBook') return Boolean(character.character_book);
  if (filter === 'missingGreeting') return !character.firstMes;
  if (filter === 'error') return character.issues.some(issue => issue.level === 'error');
  return true;
}

function getSearchText(character: CharacterSummary): string {
  return [
    character.name,
    character.fileName,
    character.creator,
    character.character_version,
    character.character_book,
    character.desc,
    character.firstMes,
  ].join(' ');
}

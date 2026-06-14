import type {
  CharacterSummary,
  CharacterTag,
  TagMutationDraft,
  TagMutationPreview,
} from './types';

export const ARCHIVE_TAG_NAME = '归档';

export function normalizeTavernTags(rawTags: unknown): CharacterTag[] {
  if (!Array.isArray(rawTags)) return [];

  return rawTags
    .map((raw, index) => {
      if (!raw || typeof raw !== 'object') return null;
      const record = raw as Record<string, unknown>;
      const id = stringValue(record.id || record.key || record.uid || index.toString());
      const name = stringValue(record.name || record.label || record.tag || record.title);
      if (!id || !name) return null;
      return {
        id,
        name,
        color: stringValue(record.color) || undefined,
      };
    })
    .filter((tag): tag is CharacterTag => Boolean(tag));
}

export function normalizeTagMap(rawTagMap: unknown): Record<string, string[]> {
  if (!rawTagMap || typeof rawTagMap !== 'object') return {};

  return Object.entries(rawTagMap as Record<string, unknown>).reduce<Record<string, string[]>>((result, [fileName, ids]) => {
    result[fileName] = Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string') : [];
    return result;
  }, {});
}

export function attachTagsToCharacters(
  characters: CharacterSummary[],
  tags: CharacterTag[],
  tagMap: Record<string, string[]>,
): CharacterSummary[] {
  const tagsById = new Map(tags.map(tag => [tag.id, tag]));
  return characters.map(character => {
    const tagIds = tagMap[character.fileName] || [];
    return {
      ...character,
      tagIds,
      tags: tagIds.map(id => tagsById.get(id)).filter((tag): tag is CharacterTag => Boolean(tag)),
    };
  });
}

export function getUnknownTagIds(tags: CharacterTag[], tagMap: Record<string, string[]>): string[] {
  const knownIds = new Set(tags.map(tag => tag.id));
  const unknownIds = new Set<string>();
  Object.values(tagMap).forEach(ids => {
    ids.forEach(id => {
      if (!knownIds.has(id)) unknownIds.add(id);
    });
  });
  return [...unknownIds].sort((lhs, rhs) => lhs.localeCompare(rhs, 'zh-CN'));
}

export function getTagCounts(characters: CharacterSummary[]): Record<string, number> {
  return characters.reduce<Record<string, number>>((counts, character) => {
    if (isArchivedCharacter(character)) return counts;
    character.tags.forEach(tag => {
      if (isArchiveTag(tag)) return;
      counts[tag.id] = (counts[tag.id] || 0) + 1;
    });
    return counts;
  }, {});
}

export function getArchiveTag(tags: CharacterTag[]): CharacterTag | undefined {
  return tags.find(isArchiveTag);
}

export function isArchivedCharacter(character: CharacterSummary): boolean {
  return character.tags.some(isArchiveTag);
}

export function isArchiveTag(tag: CharacterTag): boolean {
  return tag.name.trim().toLocaleLowerCase('zh-CN') === ARCHIVE_TAG_NAME;
}

export function previewTagMutation(
  tags: CharacterTag[],
  tagMap: Record<string, string[]>,
  draft: TagMutationDraft,
): TagMutationPreview {
  const targetFileNames = Array.from(new Set(draft.fileNames.filter(Boolean)));
  const resolvedTag = resolveMutationTag(tags, draft);
  const errors: string[] = [];

  if (targetFileNames.length === 0) {
    errors.push('没有选择角色。');
  }
  if (!resolvedTag.id || !resolvedTag.name) {
    errors.push(draft.action === 'create' ? '请输入新标签名称。' : '请选择标签。');
  }

  const changedFileNames: string[] = [];
  const unchangedFileNames: string[] = [];
  targetFileNames.forEach(fileName => {
    const ids = tagMap[fileName] || [];
    const hasTag = ids.includes(resolvedTag.id);
    const willChange = draft.action === 'remove' ? hasTag : !hasTag;
    if (willChange) {
      changedFileNames.push(fileName);
    } else {
      unchangedFileNames.push(fileName);
    }
  });

  return {
    action: draft.action,
    tagId: resolvedTag.id,
    tagName: resolvedTag.name,
    tagColor: resolvedTag.color,
    createsTag: draft.action === 'create' && !tags.some(tag => tag.id === resolvedTag.id),
    targetFileNames,
    changedFileNames,
    unchangedFileNames,
    errors,
  };
}

export function buildUpdatedTagState(
  tags: CharacterTag[],
  tagMap: Record<string, string[]>,
  preview: TagMutationPreview,
): { tags: CharacterTag[]; tagMap: Record<string, string[]> } {
  const nextTags = preview.createsTag
    ? [...tags, { id: preview.tagId, name: preview.tagName, color: preview.tagColor }]
    : [...tags];
  const nextTagMap = Object.fromEntries(Object.entries(tagMap).map(([fileName, ids]) => [fileName, [...ids]]));

  preview.changedFileNames.forEach(fileName => {
    const ids = nextTagMap[fileName] ? [...nextTagMap[fileName]] : [];
    if (preview.action === 'remove') {
      nextTagMap[fileName] = ids.filter(id => id !== preview.tagId);
    } else if (!ids.includes(preview.tagId)) {
      nextTagMap[fileName] = [...ids, preview.tagId];
    }
  });

  return { tags: nextTags, tagMap: nextTagMap };
}

export function createTagId(name: string): string {
  const normalized = name.trim().toLocaleLowerCase('zh-CN').replace(/\s+/g, '-');
  const safeName = normalized.replace(/[^\p{L}\p{N}-]+/gu, '').slice(0, 24) || 'tag';
  return `cm-${Date.now().toString(36)}-${safeName}`;
}

function resolveMutationTag(tags: CharacterTag[], draft: TagMutationDraft): CharacterTag {
  if (draft.action === 'create') {
    const name = (draft.tagName || '').trim();
    const existing = tags.find(tag => tag.name.toLocaleLowerCase('zh-CN') === name.toLocaleLowerCase('zh-CN'));
    return existing || { id: draft.tagId || (name ? createTagId(name) : ''), name, color: draft.tagColor };
  }

  return tags.find(tag => tag.id === draft.tagId) || { id: draft.tagId || '', name: '' };
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

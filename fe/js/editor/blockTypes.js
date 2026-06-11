// Block-type metadata + (de)serialization for the detail editor.

export const TYPES = [
  ['paragraph', '문단'], ['heading_1', '제목 1'], ['heading_2', '제목 2'],
  ['heading_3', '제목 3'], ['bulleted_list_item', '• 목록'],
  ['numbered_list_item', '1. 목록'], ['quote', '인용'], ['to_do', '체크박스'],
  ['callout', '콜아웃'], ['code', '코드'], ['divider', '구분선'], ['image', '이미지'],
];
export const EDITABLE = new Set(TYPES.map((t) => t[0]));
export const LABELS = Object.fromEntries(TYPES);

// Types we render read-only and preserve verbatim on save.
export function isComplex(type) {
  return !EDITABLE.has(type);
}

// Plain text from a block's rich spans (or code text).
export function textOf(b) {
  return (b.rich || []).map((s) => s.text).join('');
}

// Build a normalized block from editor fields. `orig` keeps unknown keys.
export function makeBlock(type, fields) {
  if (type === 'divider') return { type };
  if (type === 'image') {
    const node = { type, src: fields.src };
    if (fields.caption) node.caption = [{ text: fields.caption }];
    return node;
  }
  const b = { type, rich: fields.text ? [{ text: fields.text }] : [] };
  if (type === 'callout') b.icon = fields.icon || '💡';
  if (type === 'code') b.lang = fields.lang || '';
  if (type === 'to_do') b.checked = !!fields.checked;
  return b;
}

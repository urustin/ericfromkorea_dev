// Render a Notion block array, grouping consecutive list items into <ul>/<ol>.
import { el } from '../dom.js';
import { richText } from './richtext.js';
import { renderBlock } from './blocks.js';

const LIST = { bulleted_list_item: 'ul', numbered_list_item: 'ol' };
const HEADING = new Set(['heading_1', 'heading_2', 'heading_3']);
const plain = (b) => (b.rich || []).map((s) => s.text).join('').trim();

function listItem(b) {
  return el('li', {}, richText(b.rich), b.children ? renderBlocks(b.children) : null);
}

// 목차(요약 보기) — 같은 레벨의 헤딩들로 점프 링크를 만든다 (Notion table_of_contents)
function renderToc(blocks) {
  const items = blocks
    .map((b, i) => (HEADING.has(b.type) && plain(b)
      ? el('a', { class: `nb-toc__i lv${b.type.slice(-1)}`, href: `#h-${i}` }, plain(b)) : null))
    .filter(Boolean);
  if (!items.length) return null;
  return el('details', { class: 'nb-toc', open: 'open' },
    el('summary', {}, '📋 목차 · 요약 보기'), ...items);
}

export function renderBlocks(blocks) {
  const frag = document.createDocumentFragment();
  let i = 0;
  while (i < blocks.length) {
    const b = blocks[i];
    const listTag = LIST[b.type];
    if (listTag) {
      const items = [];
      while (i < blocks.length && blocks[i].type === b.type) {
        items.push(listItem(blocks[i]));
        i += 1;
      }
      frag.append(el(listTag, { class: 'notion-list' }, items));
      continue;
    }
    if (b.type === 'table_of_contents') {
      const toc = renderToc(blocks);
      if (toc) frag.append(toc);
      i += 1;
      continue;
    }
    const node = renderBlock(b, renderBlocks);
    if (node) {
      if (HEADING.has(b.type)) node.id = `h-${i}`; // 목차 점프 앵커
      frag.append(node);
    }
    i += 1;
  }
  return frag;
}

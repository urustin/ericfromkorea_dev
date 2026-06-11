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

// 목차(요약 보기) — 헤딩/접이식 섹션으로 점프 링크를 만든다 (Notion table_of_contents)
function renderToc(blocks) {
  const items = blocks
    .map((b, i) => {
      const sec = b.type === 'collapsed_section';
      if (!(sec || HEADING.has(b.type)) || !plain(b)) return null;
      return el('a', {
        class: `nb-toc__i lv${sec ? 2 : b.type.slice(-1)}`, href: `#h-${i}`,
        onClick: () => { // 접힌 섹션으로 점프하면 자동으로 펼친다
          const t = document.getElementById(`h-${i}`);
          if (t && t.tagName === 'DETAILS') t.open = true;
        },
      }, plain(b));
    })
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
      if (HEADING.has(b.type) || b.type === 'collapsed_section') node.id = `h-${i}`; // 목차 점프 앵커
      frag.append(node);
    }
    i += 1;
  }
  return frag;
}

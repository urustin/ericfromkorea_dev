// Render a Notion block array, grouping consecutive list items into <ul>/<ol>.
import { el } from '../dom.js';
import { richText } from './richtext.js';
import { renderBlock } from './blocks.js';

const LIST = { bulleted_list_item: 'ul', numbered_list_item: 'ol' };

function listItem(b) {
  return el('li', {}, richText(b.rich), b.children ? renderBlocks(b.children) : null);
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
    const node = renderBlock(b, renderBlocks);
    if (node) frag.append(node);
    i += 1;
  }
  return frag;
}

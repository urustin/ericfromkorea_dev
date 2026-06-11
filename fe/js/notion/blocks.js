// Single Notion block -> DOM node. `kids` renders a child block array.
import { el } from '../dom.js';
import { richText, colorStyle } from './richtext.js';

const HEADING = { heading_1: 'h2', heading_2: 'h3', heading_3: 'h4' };

// 블록 자체 색상(글자색/배경색)을 요소 스타일로 적용
function tinted(node, color) {
  const style = colorStyle(color);
  if (node && style) Object.assign(node.style, style);
  return node;
}

function bgClass(color) {
  return color && color.endsWith('_background')
    ? color.replace('_background', '') : null;
}

export function renderBlock(b, kids) {
  const t = b.type;
  if (HEADING[t]) return tinted(el(HEADING[t], { class: 'nb-h' }, richText(b.rich)), b.color);

  if (t === 'paragraph') return tinted(el('p', {}, richText(b.rich)), b.color);

  if (t === 'quote')
    return el('blockquote', { class: 'nb-quote' }, richText(b.rich),
      b.children ? kids(b.children) : null);

  if (t === 'callout')
    return el('div', { class: 'nb-callout', dataset: { c: bgClass(b.color) || 'gray' } },
      el('div', { class: 'nb-callout__icon' }, b.icon || '💡'),
      el('div', { class: 'nb-callout__body' },
        el('p', {}, richText(b.rich)), b.children ? kids(b.children) : null));

  if (t === 'code')
    return el('pre', { class: 'codeblock' },
      el('code', {}, (b.rich || []).map((s) => s.text).join('')));

  if (t === 'divider') return el('hr', { class: 'divider' });

  if (t === 'image')
    return el('figure', { class: 'nb-figure' },
      el('img', { src: b.src, loading: 'lazy', alt: '' }),
      b.caption && b.caption.length
        ? el('figcaption', {}, richText(b.caption)) : null);

  if (t === 'toggle')
    return el('details', { class: 'nb-toggle' },
      el('summary', {}, richText(b.rich)),
      b.children ? kids(b.children) : null);

  if (t === 'to_do')
    return el('label', { class: 'nb-todo' },
      el('input', { type: 'checkbox', disabled: 'disabled', ...(b.checked ? { checked: 'checked' } : {}) }),
      el('span', { class: b.checked ? 'done' : '' }, richText(b.rich)));

  if (t === 'column_list')
    return el('div', { class: 'nb-columns' }, b.children ? kids(b.children) : null);

  if (t === 'column')
    return el('div', { class: 'nb-column' }, b.children ? kids(b.children) : null);

  if (t === 'table') return renderTable(b);

  if (t === 'bookmark')
    return b.url ? el('a', { class: 'nb-bookmark', href: b.url, target: '_blank', rel: 'noopener' },
      el('span', { class: 'nb-bookmark__ic' }, '🔖'),
      el('span', { class: 'nb-bookmark__url' }, b.url),
      b.caption && b.caption.length
        ? el('span', { class: 'nb-bookmark__cap' }, richText(b.caption)) : null) : null;
  return null;
}

function renderTable(b) {
  const rows = (b.children || []).filter((r) => r.type === 'table_row');
  const head = b.has_col_header && rows.length ? rows[0] : null;
  const body = head ? rows.slice(1) : rows;
  const cell = (c, tag) => el(tag, {}, richText(c));
  return el('div', { class: 'nb-table-wrap' }, el('table', { class: 'nb-table' },
    head ? el('thead', {}, el('tr', {}, head.cells.map((c) => cell(c, 'th')))) : null,
    el('tbody', {}, body.map((r) => el('tr', {}, r.cells.map((c) => cell(c, 'td')))))));
}

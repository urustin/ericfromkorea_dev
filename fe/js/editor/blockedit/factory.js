// Build/convert/serialize editor block elements.
import { el } from '../../dom.js';
import { renderBlocks } from '../../notion/render.js';
import { EDITSET, spansToHtml, htmlToSpans } from './model.js';

const ORIG = new WeakMap(); // preserved complex blocks -> original JSON
export const isEditable = (t) => EDITSET.has(t);

const content = (html) => el('div', { class: 'ne-content', contenteditable: 'true', html: html || '' });

function mainFor(b) {
  const t = b.type;
  if (t === 'divider') return el('hr', { class: 'ne-hr' });
  if (t === 'image') {
    const fig = el('div', { class: 'ne-img' });
    if (b.src) fig.append(el('img', { src: b.src, alt: '' }));
    fig.append(el('div', { class: 'ne-imgbar' },
      el('label', { class: 'btn btn--sm' }, '이미지 업로드',
        el('input', { type: 'file', accept: 'image/*', hidden: 'hidden', class: 'ne-file' })),
      el('span', { class: 'ne-cap', contenteditable: 'true', 'data-ph': '캡션…' },
        b.caption ? spansToHtml(b.caption) : '')));
    return fig;
  }
  const c = content(spansToHtml(b.rich));
  if (t === 'code') {
    c.classList.add('ne-code');
    c.textContent = (b.rich || []).map((s) => s.text).join('');
    return el('div', { class: 'ne-codewrap' },
      el('input', { class: 'ne-lang f-in', value: b.lang || '', placeholder: '언어' }), c);
  }
  if (t === 'callout') {
    return el('div', { class: 'ne-callout', dataset: { c: 'gray' } },
      el('span', { class: 'ne-cic', contenteditable: 'true' }, b.icon || '💡'), c);
  }
  if (t === 'to_do') {
    return el('label', { class: 'ne-todo' },
      el('input', { type: 'checkbox', ...(b.checked ? { checked: 'checked' } : {}) }), c);
  }
  return c;
}

function gutter() {
  return el('div', { class: 'ne-gutter' },
    el('button', { class: 'ne-add', title: '아래에 추가', type: 'button' }, '＋'),
    el('button', { class: 'ne-handle', title: '블록 메뉴', type: 'button' }, '⠿'));
}

export function makeBlockEl(b) {
  const wrap = el('div', { class: 'ne-block', dataset: { type: b.type } });
  wrap.append(gutter());
  if (!isEditable(b.type)) {
    ORIG.set(wrap, b);
    wrap.append(el('div', { class: 'ne-main' },
      el('div', { class: 'ne-lock' }, '🔒 유지되는 블록'),
      el('div', { class: 'ne-ro' }, renderBlocks([b]))));
  } else {
    if (b.src) wrap.dataset.src = b.src;
    wrap.append(el('div', { class: 'ne-main' }, mainFor(b)));
  }
  return wrap;
}

// Change a block's type in place, preserving text. Returns element to focus.
export function convertType(wrap, type) {
  const prev = wrap.querySelector('.ne-content');
  const rich = prev && !wrap.dataset.type.startsWith('code') ? htmlToSpans(prev) : null;
  wrap.dataset.type = type;
  const main = wrap.querySelector('.ne-main');
  main.replaceChildren(mainFor({ type, rich }));
  return main.querySelector('.ne-content');
}

export function blockToData(wrap) {
  if (ORIG.has(wrap)) return ORIG.get(wrap);
  const t = wrap.dataset.type;
  if (t === 'divider') return { type: t };
  if (t === 'image') {
    const img = wrap.querySelector('img');
    const cap = wrap.querySelector('.ne-cap');
    const b = { type: t, src: wrap.dataset.src || (img ? img.getAttribute('src') : '') };
    const cs = cap ? htmlToSpans(cap) : [];
    if (cs.length) b.caption = cs;
    return b;
  }
  const c = wrap.querySelector('.ne-content');
  if (t === 'code') return { type: t, lang: wrap.querySelector('.ne-lang').value, rich: [{ text: c.innerText }] };
  const rich = htmlToSpans(c);
  if (t === 'callout') return { type: t, icon: wrap.querySelector('.ne-cic').textContent.trim() || '💡', rich };
  if (t === 'to_do') return { type: t, checked: wrap.querySelector('input').checked, rich };
  return { type: t, rich };
}

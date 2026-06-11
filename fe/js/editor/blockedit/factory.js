// Build/convert/serialize editor block elements.
import { el } from '../../dom.js';
import { renderBlocks } from '../../notion/render.js';
import { EDITSET, spansToHtml, htmlToSpans } from './model.js';
import { COMPLEX, buildComplex, serializeComplex, kidsEl } from './complex.js';

const ORIG = new WeakMap(); // preserved unknown blocks -> original JSON
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
      el('span', { class: 'ne-cap', contenteditable: 'true', 'data-ph': '캡션…',
        html: b.caption ? spansToHtml(b.caption) : '' })));
    return fig;
  }
  const c = content(spansToHtml(b.rich));
  if (t === 'code') {
    c.classList.add('ne-code');
    c.style.whiteSpace = 'pre-wrap'; // CSS 미로딩 환경에서도 innerText 개행 보존
    c.textContent = (b.rich || []).map((s) => s.text).join('');
    return el('div', { class: 'ne-codewrap' },
      el('input', { class: 'ne-lang f-in', value: b.lang || '', placeholder: '언어' }), c);
  }
  if (t === 'callout') {
    const tone = (b.color || '').replace('_background', '') || 'gray';
    return el('div', { class: 'ne-callout', dataset: { c: tone } },
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
    el('button', { class: 'ne-handle', title: '블록 메뉴', type: 'button', draggable: 'true' }, '⠿'));
}

export function makeBlockEl(b) {
  const wrap = el('div', { class: 'ne-block', dataset: { type: b.type } });
  wrap.append(gutter());
  if (!isEditable(b.type)) {
    ORIG.set(wrap, b);
    wrap.append(el('div', { class: 'ne-main' },
      el('div', { class: 'ne-lock' }, '🔒 유지되는 블록'),
      el('div', { class: 'ne-ro' }, renderBlocks([b]))));
    return wrap;
  }
  if (b.src) wrap.dataset.src = b.src;
  if (b.color) wrap.dataset.color = b.color; // 블록 색상은 저장 시 그대로 보존
  const main = el('div', { class: 'ne-main' });
  if (COMPLEX.has(b.type)) {
    main.append(buildComplex(b, makeBlockEl));
  } else {
    main.append(mainFor(b));
    // 목록/문단 등의 하위(children) 블록도 그대로 편집 가능하게 중첩 렌더링
    if (b.children && b.children.length) main.append(kidsEl(b.children, makeBlockEl));
  }
  wrap.append(main);
  return wrap;
}

// 자신의 .ne-main 바로 아래(중첩 블록 제외)에서 셀렉터 탐색
const own = (main, sel) => main.querySelector(`:scope > ${sel}, :scope > * > ${sel}`);

// Change a block's type in place, preserving text. Returns element to focus.
export function convertType(wrap, type) {
  const main = wrap.querySelector(':scope > .ne-main');
  const prevC = own(main, '.ne-content');
  const rich = prevC && wrap.dataset.type !== 'code' ? htmlToSpans(prevC) : null;
  wrap.dataset.type = type;
  main.replaceChildren(COMPLEX.has(type)
    ? buildComplex({ type, rich: rich || [] }, makeBlockEl)
    : mainFor({ type, rich }));
  return own(main, '.ne-content');
}

export function blockToData(wrap) {
  if (ORIG.has(wrap)) return ORIG.get(wrap);
  const t = wrap.dataset.type;
  const main = wrap.querySelector(':scope > .ne-main');
  if (COMPLEX.has(t)) return serializeComplex(main, t, blockToData);
  if (t === 'divider') return { type: t };
  if (t === 'image') {
    const img = own(main, 'img') || main.querySelector('.ne-img img');
    const cap = main.querySelector('.ne-cap');
    const b = { type: t, src: wrap.dataset.src || (img ? img.getAttribute('src') : '') };
    const cs = cap ? htmlToSpans(cap) : [];
    if (cs.length) b.caption = cs;
    return b;
  }
  const c = own(main, '.ne-content');
  const b = (() => {
    if (t === 'code') return { type: t, lang: main.querySelector('.ne-lang').value, rich: [{ text: c.innerText }] };
    const rich = htmlToSpans(c);
    if (t === 'callout') return { type: t, icon: main.querySelector('.ne-cic').textContent.trim() || '💡', rich };
    if (t === 'to_do') return { type: t, checked: main.querySelector(':scope > .ne-todo > input').checked, rich };
    return { type: t, rich };
  })();
  if (wrap.dataset.color) b.color = wrap.dataset.color;
  const k = main.querySelector(':scope > .ne-kids');
  if (k) {
    const children = [...k.querySelectorAll(':scope > .ne-block')].map(blockToData);
    if (children.length) b.children = children;
  }
  return b;
}

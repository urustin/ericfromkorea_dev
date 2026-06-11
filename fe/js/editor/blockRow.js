// One editable block row for the detail editor.
import { el } from '../dom.js';
import { TYPES, LABELS, EDITABLE, isComplex, textOf, makeBlock } from './blockTypes.js';
import { input, textarea } from './fields.js';
import { uploadImage } from './api.js';

// fields for a given type -> { node, collect() }
function typeFields(type, b) {
  if (type === 'divider') return { node: el('p', { class: 'muted' }, '— 구분선 —'), collect: () => ({}) };
  if (type === 'image') {
    const state = { src: b.src || '' };
    const cap = input('캡션', b.caption ? textOf({ rich: b.caption }) : '');
    const prev = el('img', { class: 'blk-prev', src: state.src, alt: '' });
    const file = el('input', { type: 'file', accept: 'image/*', class: 'f-in' });
    file.addEventListener('change', async () => {
      if (!file.files[0]) return;
      const r = await uploadImage(file.files[0]);
      state.src = r.src; prev.src = r.src;
    });
    return {
      node: el('div', {}, state.src ? prev : null, file, cap.node),
      collect: () => ({ src: state.src, caption: cap.value() }),
    };
  }
  const ta = textarea('내용', textOf(b));
  const extra = [];
  let icon, lang, chk;
  if (type === 'callout') { icon = input('아이콘', b.icon || '💡'); extra.push(icon.node); }
  if (type === 'code') { lang = input('언어', b.lang || ''); extra.push(lang.node); }
  if (type === 'to_do') {
    chk = el('input', { type: 'checkbox', ...(b.checked ? { checked: 'checked' } : {}) });
    extra.push(el('label', { class: 'f-row' }, '완료', chk));
  }
  return {
    node: el('div', {}, ...extra, ta.node),
    collect: () => ({ text: ta.value(), icon: icon && icon.value(), lang: lang && lang.value(), checked: chk && chk.checked }),
  };
}

export function blockRow(b, h) {
  const wrap = el('div', { class: 'blk' });
  if (isComplex(b.type)) {
    wrap.append(el('div', { class: 'blk-head' },
      el('span', { class: 'blk-lock' }, `🔒 ${b.type} — 그대로 유지`), controls(h, wrap)));
    return { wrap, value: () => b };
  }
  let cur = b.type;
  let fld = typeFields(cur, b);
  const body = el('div', { class: 'blk-body' }, fld.node);
  const sel = el('select', { class: 'f-sel blk-type' },
    TYPES.map(([v, l]) => el('option', { value: v, ...(v === cur ? { selected: 'selected' } : {}) }, l)));
  sel.addEventListener('change', () => {
    cur = sel.value; fld = typeFields(cur, b); body.replaceChildren(fld.node);
  });
  wrap.append(el('div', { class: 'blk-head' }, sel, controls(h, wrap)), body);
  return { wrap, value: () => makeBlock(cur, fld.collect()) };
}

function controls(h, wrap) {
  return el('span', { class: 'blk-ctl' },
    el('button', { class: 'btn btn--sm', onClick: () => h.move(wrap, -1) }, '↑'),
    el('button', { class: 'btn btn--sm', onClick: () => h.move(wrap, 1) }, '↓'),
    el('button', { class: 'btn btn--sm btn--danger', onClick: () => h.remove(wrap) }, '✕'));
}

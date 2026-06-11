// Small form-field factories. Each returns { node, value() }.
import { el } from '../dom.js';

export function input(label, val = '', cls = 'f-in') {
  const inp = el('input', { class: cls, value: val });
  const node = label
    ? el('div', { class: 'f-row' }, el('label', {}, label), inp)
    : inp;
  return { node, el: inp, value: () => inp.value };
}

export function textarea(label, val = '') {
  const ta = el('textarea', { class: 'f-ta' }, val || '');
  const node = label ? el('div', { class: 'f-row' }, el('label', {}, label), ta) : ta;
  return { node, el: ta, value: () => ta.value };
}

export function select(label, val, options) {
  const sel = el('select', { class: 'f-sel' },
    options.map((o) => el('option', { value: o, ...(o === val ? { selected: 'selected' } : {}) }, o)));
  const node = label ? el('div', { class: 'f-row' }, el('label', {}, label), sel) : sel;
  return { node, el: sel, value: () => sel.value };
}

// Editable list of simple string items. value() -> array of strings.
export function stringList(label, items = []) {
  const rows = [];
  const box = el('div', {});
  const add = (v = '') => {
    const f = input(null, v);
    const row = el('div', { class: 'list-item' }, f.node,
      el('button', { class: 'btn btn--sm btn--danger', onClick: () => remove(entry) }, '✕'));
    const entry = { row, f };
    rows.push(entry);
    box.append(row);
  };
  const remove = (entry) => {
    rows.splice(rows.indexOf(entry), 1);
    entry.row.remove();
  };
  items.forEach(add);
  const node = el('div', { class: 'editor-section' },
    el('h3', {}, label), box,
    el('button', { class: 'btn btn--sm add-row', onClick: () => add() }, '＋ 추가'));
  return { node, value: () => rows.map((r) => r.f.value()).filter((v) => v.trim()) };
}

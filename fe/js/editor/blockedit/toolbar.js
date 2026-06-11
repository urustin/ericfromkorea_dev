// Floating inline-format toolbar shown over a text selection.
import { el } from '../../dom.js';
import { COLORS } from './model.js';

function btn(label, on, title) {
  return el('button', {
    class: 'ne-tb__b', type: 'button', title: title || '',
    onMousedown: (e) => { e.preventDefault(); on(); },
  }, label);
}

export function wrapCode() {
  const sel = getSelection();
  if (!sel.rangeCount || sel.isCollapsed) return;
  const r = sel.getRangeAt(0);
  const code = document.createElement('code');
  try { r.surroundContents(code); }
  catch { code.appendChild(r.extractContents()); r.insertNode(code); }
}

// 선택 영역에 색을 입힌다. val: 'blue' | 'blue_background' | null(색 제거)
function applyColor(val) {
  const sel = getSelection();
  if (!sel.rangeCount || sel.isCollapsed) return;
  const r = sel.getRangeAt(0);
  const frag = r.extractContents();
  frag.querySelectorAll('[data-c],[data-bg]').forEach((s) => {
    s.removeAttribute('data-c'); s.removeAttribute('data-bg');
    if (s.tagName === 'SPAN' && !s.attributes.length) s.replaceWith(...s.childNodes);
  });
  if (!val) return void r.insertNode(frag);
  const span = document.createElement('span');
  if (val.endsWith('_background')) span.dataset.bg = val.replace('_background', '');
  else span.dataset.c = val;
  span.appendChild(frag);
  r.insertNode(span);
}

// Notion식 색상 패널: 글자색 줄 + 배경색 줄.
function colorPanel() {
  const sw = (val, label) => el('button', {
    class: 'ne-cp__sw', type: 'button', title: label,
    dataset: val.endsWith('_background')
      ? { bg: val.replace('_background', '') } : { c: val },
    onMousedown: (e) => { e.preventDefault(); applyColor(val); },
  }, 'A');
  return el('div', { class: 'ne-cp hidden' },
    el('div', { class: 'ne-cp__row' },
      btn('⌫', () => applyColor(null), '색 제거'),
      COLORS.map((c) => sw(c, `${c} 글자색`))),
    el('div', { class: 'ne-cp__row' },
      el('span', { class: 'ne-cp__pad' }),
      COLORS.map((c) => sw(`${c}_background`, `${c} 배경색`))));
}

const EDITABLE_SEL = '.ne-content,.ne-cell,.ne-cap';

export function createToolbar() {
  const panel = colorPanel();
  const bar = el('div', { class: 'ne-tb hidden' },
    btn('B', () => document.execCommand('bold'), '굵게 ⌘B'),
    btn('I', () => document.execCommand('italic'), '기울임 ⌘I'),
    btn('U', () => document.execCommand('underline'), '밑줄 ⌘U'),
    btn('S', () => document.execCommand('strikeThrough'), '취소선 ⌘⇧X'),
    btn('</>', wrapCode, '인라인 코드 ⌘E'),
    btn('🔗', () => { const u = prompt('링크 URL'); if (u) document.execCommand('createLink', false, u); }, '링크 ⌘K'),
    btn('A▾', () => panel.classList.toggle('hidden'), '글자색/배경색'),
    panel);

  function hide() { bar.classList.add('hidden'); panel.classList.add('hidden'); }
  function show() {
    const sel = getSelection();
    const anchor = sel.anchorNode && sel.anchorNode.parentElement;
    if (!sel.rangeCount || sel.isCollapsed || !anchor || !anchor.closest(EDITABLE_SEL)) return hide();
    const r = sel.getRangeAt(0).getBoundingClientRect();
    bar.style.left = `${Math.max(8, r.left + r.width / 2 - 120)}px`;
    bar.style.top = `${r.top + scrollY - 44}px`;
    bar.classList.remove('hidden');
  }
  document.addEventListener('selectionchange', () => {
    if (document.activeElement && document.activeElement.closest(EDITABLE_SEL)) show();
    else hide();
  });
  return { el: bar };
}

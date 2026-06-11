// Keydown handling: Enter / Backspace / inline marks / Tab 들여쓰기.
import { el } from '../../dom.js';
import { caretAtStart, splitAtCaret, placeCaret } from './caret.js';
import { wrapCode } from './toolbar.js';

const LIST = new Set(['bulleted_list_item', 'numbered_list_item', 'to_do']);
const MARK = { b: 'bold', i: 'italic', u: 'underline' };
// 하위 블록(children)을 가질 수 있는 타입 (Notion 동작 기준)
const CANKIDS = new Set(['paragraph', 'bulleted_list_item', 'numbered_list_item',
  'to_do', 'toggle', 'quote', 'callout']);

// 블록을 앞 형제의 하위(.ne-kids)로 들여쓰기
function indent(block) {
  const prev = block.previousElementSibling;
  if (!prev || !prev.classList.contains('ne-block') || !CANKIDS.has(prev.dataset.type)) return;
  const main = prev.querySelector(':scope > .ne-main');
  let kids = prev.dataset.type === 'toggle'
    ? main.querySelector(':scope > .ne-toggle > .ne-kids')
    : main.querySelector(':scope > .ne-kids');
  if (!kids) { kids = el('div', { class: 'ne-kids' }); main.append(kids); }
  kids.append(block);
}

// 하위에서 부모 블록 다음으로 내어쓰기
function outdent(block) {
  const kids = block.parentElement;
  if (!kids.classList.contains('ne-kids')) return;
  const host = kids.closest('.ne-block');
  if (host) host.after(block);
}

// 표 셀에서 Tab → 다음/이전 셀로 이동
function moveCell(cell, back) {
  const cells = [...cell.closest('table').querySelectorAll('.ne-cell')];
  const next = cells[cells.indexOf(cell) + (back ? -1 : 1)];
  if (next) placeCaret(next, false);
}

function shortcut(e) {
  const k = e.key.toLowerCase();
  if (MARK[k] && !e.shiftKey) return () => document.execCommand(MARK[k]);
  if (k === 'x' && e.shiftKey) return () => document.execCommand('strikeThrough');
  if (k === 'e') return wrapCode;
  if (k === 'k') return () => { const u = prompt('링크 URL'); if (u) document.execCommand('createLink', false, u); };
  return null;
}

export function onKeydown(e, api) {
  const s = api.slash;
  if (s.isOpen()) {
    if (e.key === 'ArrowDown') { e.preventDefault(); return s.move(1); }
    if (e.key === 'ArrowUp') { e.preventDefault(); return s.move(-1); }
    if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); return s.confirm(); }
    if (e.key === 'Escape') { e.preventDefault(); return s.close(); }
  }
  const cell = e.target.closest && e.target.closest('.ne-cell');
  const content = e.target.closest && e.target.closest('.ne-content');
  const block = e.target.closest && e.target.closest('.ne-block');
  if (!block) return;

  if (e.metaKey || e.ctrlKey) {
    const fn = shortcut(e);
    if (fn) { e.preventDefault(); return fn(); }
  }
  if (cell && e.key === 'Tab') { e.preventDefault(); return moveCell(cell, e.shiftKey); }
  if (!content) return;
  const type = block.dataset.type;

  if (e.key === 'Tab') {
    e.preventDefault();
    if (type === 'code') return document.execCommand('insertText', false, '  ');
    return e.shiftKey ? outdent(block) : indent(block);
  }

  if (e.key === 'Enter' && !e.shiftKey) {
    if (type === 'code') {
      e.preventDefault();
      return document.execCommand('insertText', false, '\n');
    }
    e.preventDefault();
    const empty = content.textContent.trim() === '';
    if (LIST.has(type) && empty) return void api.convert(block, 'paragraph');
    const after = splitAtCaret(content);
    const nextType = LIST.has(type) ? type : 'paragraph';
    api.newAfter(block, nextType, after);
    return;
  }

  if (e.key === 'Backspace' && caretAtStart(content)) {
    const empty = content.textContent === '';
    // toggle은 자동 변환 시 하위 블록이 사라지므로 제외
    if (!empty && type !== 'paragraph' && type !== 'toggle') { e.preventDefault(); return void api.convert(block, 'paragraph'); }
    if (empty) {
      const prev = api.prevContent(block);
      e.preventDefault();
      api.remove(block);
      if (prev) placeCaret(prev, false);
      return;
    }
    const prev = api.prevContent(block);
    if (prev) { e.preventDefault(); api.mergeInto(prev, content); api.remove(block); }
  }
}

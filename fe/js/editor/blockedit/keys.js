// Keydown handling for the block editor: Enter / Backspace / inline marks.
import { caretAtStart, splitAtCaret, placeCaret } from './caret.js';

const LIST = new Set(['bulleted_list_item', 'numbered_list_item', 'to_do']);
const MARK = { b: 'bold', i: 'italic', u: 'underline' };

export function onKeydown(e, api) {
  const s = api.slash;
  if (s.isOpen()) {
    if (e.key === 'ArrowDown') { e.preventDefault(); return s.move(1); }
    if (e.key === 'ArrowUp') { e.preventDefault(); return s.move(-1); }
    if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); return s.confirm(); }
    if (e.key === 'Escape') { e.preventDefault(); return s.close(); }
  }
  const content = e.target.closest && e.target.closest('.ne-content');
  const block = e.target.closest && e.target.closest('.ne-block');
  if (!block) return;

  if ((e.metaKey || e.ctrlKey) && MARK[e.key.toLowerCase()]) {
    e.preventDefault();
    return document.execCommand(MARK[e.key.toLowerCase()]);
  }
  if (!content) return;
  const type = block.dataset.type;

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
    if (!empty && type !== 'paragraph') { e.preventDefault(); return void api.convert(block, 'paragraph'); }
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

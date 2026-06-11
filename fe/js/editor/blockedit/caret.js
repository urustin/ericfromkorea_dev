// Caret / selection helpers for the contenteditable block editor.

export function placeCaret(el, atStart = false) {
  el.focus();
  const r = document.createRange();
  r.selectNodeContents(el);
  r.collapse(atStart);
  const s = getSelection();
  s.removeAllRanges();
  s.addRange(r);
}

function rangeText(el, side) {
  const s = getSelection();
  if (!s.rangeCount) return null;
  const cur = s.getRangeAt(0);
  const r = document.createRange();
  r.selectNodeContents(el);
  if (side === 'start') r.setEnd(cur.startContainer, cur.startOffset);
  else r.setStart(cur.endContainer, cur.endOffset);
  return r.toString();
}

// Caret is at the very beginning of el (no text before it).
export function caretAtStart(el) {
  const t = rangeText(el, 'start');
  return t !== null && t.length === 0;
}

export function caretAtEnd(el) {
  const t = rangeText(el, 'end');
  return t !== null && t.length === 0;
}

// Extract everything after the caret out of `el`; return it as HTML.
export function splitAtCaret(el) {
  const s = getSelection();
  if (!s.rangeCount) return '';
  const r = s.getRangeAt(0);
  const after = document.createRange();
  after.selectNodeContents(el);
  after.setStart(r.endContainer, r.endOffset);
  const frag = after.extractContents();
  const tmp = document.createElement('div');
  tmp.appendChild(frag);
  return tmp.innerHTML;
}

// Plain text from caret back to block start (used for markdown triggers).
export function textBeforeCaret(el) {
  return rangeText(el, 'start') || '';
}

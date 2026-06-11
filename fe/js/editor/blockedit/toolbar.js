// Floating inline-format toolbar shown over a text selection.
import { el } from '../../dom.js';

function btn(label, on) {
  return el('button', {
    class: 'ne-tb__b', type: 'button',
    onMousedown: (e) => { e.preventDefault(); on(); },
  }, label);
}

function wrapCode() {
  const sel = getSelection();
  if (!sel.rangeCount || sel.isCollapsed) return;
  const r = sel.getRangeAt(0);
  const code = document.createElement('code');
  try { r.surroundContents(code); }
  catch { code.appendChild(r.extractContents()); r.insertNode(code); }
}

export function createToolbar() {
  const bar = el('div', { class: 'ne-tb hidden' },
    btn('B', () => document.execCommand('bold')),
    btn('I', () => document.execCommand('italic')),
    btn('S', () => document.execCommand('strikeThrough')),
    btn('</>', wrapCode),
    btn('🔗', () => { const u = prompt('링크 URL'); if (u) document.execCommand('createLink', false, u); }));

  function hide() { bar.classList.add('hidden'); }
  function show() {
    const sel = getSelection();
    const anchor = sel.anchorNode && sel.anchorNode.parentElement;
    if (!sel.rangeCount || sel.isCollapsed || !anchor || !anchor.closest('.ne-content')) return hide();
    const r = sel.getRangeAt(0).getBoundingClientRect();
    bar.style.left = `${Math.max(8, r.left + r.width / 2 - 90)}px`;
    bar.style.top = `${r.top + scrollY - 44}px`;
    bar.classList.remove('hidden');
  }
  document.addEventListener('selectionchange', () => {
    if (document.activeElement && document.activeElement.closest('.ne-content')) show();
    else hide();
  });
  return { el: bar };
}

// Notion-style slash command menu.
import { el } from '../../dom.js';
import { TYPES } from './model.js';

// "페이지" creates a brand-new project page (handled specially in the editor).
const PAGE = { action: 'page', label: '페이지', icon: '📄', cmd: 'page 페이지 새 하위 sub new' };
const CMDS = [PAGE, ...TYPES];

export function createSlash(onPick) {
  const menu = el('div', { class: 'ne-slash hidden' });
  let items = [], idx = 0, q = '', open = false;

  function render() {
    const ql = q.toLowerCase();
    items = CMDS.filter((t) => !ql || t.cmd.includes(ql) || t.label.toLowerCase().includes(ql));
    if (!items.length) {
      menu.replaceChildren(el('div', { class: 'ne-slash__empty' }, '결과 없음'));
      return;
    }
    menu.replaceChildren(...items.map((t, i) => el('div', {
      class: 'ne-slash__it' + (i === idx ? ' on' : ''),
      onMousedown: (e) => { e.preventDefault(); pick(i); },
      onMouseenter: () => { idx = i; paint(); },
    }, el('span', { class: 'ne-slash__ic' }, t.icon), el('span', {}, t.label))));
  }

  function paint() {
    [...menu.children].forEach((c, i) => c.classList.toggle('on', i === idx));
  }

  function pick(i) {
    const it = items[i];
    close();
    if (it) onPick(it);
  }

  function place(rect) {
    const top = rect.bottom + 6;
    menu.style.left = `${Math.min(rect.left, innerWidth - 240)}px`;
    menu.style.top = `${Math.min(top, innerHeight - 320) + scrollY}px`;
  }

  function close() { open = false; menu.classList.add('hidden'); }

  return {
    el: menu,
    isOpen: () => open,
    open(rect, query) { open = true; idx = 0; q = query || ''; render(); place(rect); menu.classList.remove('hidden'); },
    setQuery(query) { q = query; idx = 0; render(); },
    move(d) { if (!open || !items.length) return; idx = (idx + d + items.length) % items.length; paint(); },
    confirm() { if (open) pick(idx); },
    close,
  };
}

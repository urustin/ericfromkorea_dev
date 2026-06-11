// Block action menu (opened from the ⠿ handle).
import { el } from '../../dom.js';
import { makeBlockEl } from './factory.js';
import { blockToData } from './factory.js';

let openMenu = null;
document.addEventListener('click', (e) => {
  if (openMenu && !e.target.closest('.ne-menu') && !e.target.closest('.ne-handle')) {
    openMenu.remove(); openMenu = null;
  }
});

export function openBlockMenu(block, anchor) {
  if (openMenu) { openMenu.remove(); openMenu = null; }
  const item = (label, fn) => el('div', {
    class: 'ne-menu__it',
    onClick: () => { fn(); close(); },
  }, label);
  const close = () => { if (openMenu) { openMenu.remove(); openMenu = null; } };

  const menu = el('div', { class: 'ne-menu' },
    item('🗑  삭제', () => block.remove()),
    item('⧉  복제', () => block.after(makeBlockEl(blockToData(block)))),
    item('↑  위로', () => { const p = block.previousElementSibling; if (p) p.before(block); }),
    item('↓  아래로', () => { const n = block.nextElementSibling; if (n) n.after(block); }));
  const r = anchor.getBoundingClientRect();
  menu.style.left = `${r.left + scrollX}px`;
  menu.style.top = `${r.bottom + scrollY + 4}px`;
  document.body.append(menu);
  openMenu = menu;
}

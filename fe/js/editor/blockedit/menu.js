// Block action menu (opened from the ⠿ handle).
import { el } from '../../dom.js';
import { makeBlockEl, blockToData, convertType } from './factory.js';
import { TYPES } from './model.js';
import { placeCaret } from './caret.js';

let openMenu = null;
document.addEventListener('click', (e) => {
  if (openMenu && !e.target.closest('.ne-menu') && !e.target.closest('.ne-handle')) {
    openMenu.remove(); openMenu = null;
  }
});

const close = () => { if (openMenu) { openMenu.remove(); openMenu = null; } };

function place(menu, anchor) {
  const r = anchor.getBoundingClientRect();
  menu.style.left = `${r.left + scrollX}px`;
  menu.style.top = `${r.bottom + scrollY + 4}px`;
  document.body.append(menu);
  openMenu = menu;
}

// 전환(turn into) 서브메뉴 — Notion처럼 블록 타입을 바꾼다.
function showTurnInto(block, anchor) {
  close();
  const menu = el('div', { class: 'ne-menu' },
    TYPES.filter((t) => t.type !== 'image').map((t) => el('div', {
      class: 'ne-menu__it',
      onClick: () => {
        const c = convertType(block, t.type);
        close();
        if (c) placeCaret(c, true);
      },
    }, el('span', { class: 'ne-slash__ic' }, t.icon), ` ${t.label}`)));
  place(menu, anchor);
}

export function openBlockMenu(block, anchor) {
  close();
  const item = (label, fn) => el('div', {
    class: 'ne-menu__it',
    onClick: () => { fn(); close(); },
  }, label);

  const menu = el('div', { class: 'ne-menu' },
    el('div', {
      class: 'ne-menu__it',
      onClick: () => showTurnInto(block, anchor),
    }, '↻  전환…'),
    item('🗑  삭제', () => block.remove()),
    item('⧉  복제', () => block.after(makeBlockEl(blockToData(block)))),
    item('↑  위로', () => { const p = block.previousElementSibling; if (p) p.before(block); }),
    item('↓  아래로', () => { const n = block.nextElementSibling; if (n) n.after(block); }));
  place(menu, anchor);
}

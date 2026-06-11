// 블록 드래그 정렬 — 파란 인디케이터로 위치 표시, 좌/우 드롭 시 컬럼 생성 (Notion 방식).
import { el } from '../../dom.js';
import { makeBlockEl } from './factory.js';
import { newColEl } from './complex.js';

const EDGE = 0.18; // 블록 폭의 양끝 18%는 좌/우(컬럼) 드롭 영역

function kidsOf(col) { return col.querySelector(':scope > .ne-kids'); }

// 이동 후 빈 컬럼 정리: 빈 col 제거, 1개만 남으면 column_list를 풀어 헤친다
function cleanup(origin) {
  const col = origin && origin.closest && origin.closest('.ne-col');
  if (!col || kidsOf(col).querySelector('.ne-block')) return;
  const cols = col.parentElement;
  col.remove();
  const left = cols.querySelectorAll(':scope > .ne-col');
  if (left.length > 1) return;
  const listBlock = cols.closest('.ne-block');
  if (left.length === 1) {
    [...kidsOf(left[0]).querySelectorAll(':scope > .ne-block')]
      .forEach((b) => listBlock.before(b));
  }
  listBlock.remove();
}

// target 좌/우에 드롭 → 컬럼 생성/추가
function dropSide(target, dragging, side) {
  const col = target.closest('.ne-col');
  const nc = newColEl(makeBlockEl);
  kidsOf(nc).replaceChildren(dragging);
  if (col) { // 이미 컬럼 안 → 같은 줄에 새 컬럼 추가 (2열→3열)
    if (side === 'left') col.before(nc); else col.after(nc);
    return;
  }
  const wrap = makeBlockEl({ type: 'column_list', children: [{ type: 'column' }, { type: 'column' }] });
  target.before(wrap);
  const [a, b] = wrap.querySelectorAll('.ne-col');
  kidsOf(side === 'left' ? a : b).replaceChildren(dragging);
  kidsOf(side === 'left' ? b : a).replaceChildren(target);
}

export function enableDnd(surface) {
  let dragging = null, drop = null; // drop: {target, pos}
  const line = el('div', { class: 'ne-dropline hidden' });
  document.body.append(line);

  function showLine(target, pos) {
    const r = target.getBoundingClientRect();
    const vertical = pos === 'left' || pos === 'right';
    line.classList.toggle('v', vertical);
    if (vertical) {
      line.style.left = `${(pos === 'left' ? r.left - 4 : r.right + 1) + scrollX}px`;
      line.style.top = `${r.top + scrollY}px`;
      line.style.width = '3px'; line.style.height = `${r.height}px`;
    } else {
      line.style.left = `${r.left + scrollX}px`;
      line.style.top = `${(pos === 'before' ? r.top - 2 : r.bottom + 1) + scrollY}px`;
      line.style.width = `${r.width}px`; line.style.height = '3px';
    }
    line.classList.remove('hidden');
  }
  const hideLine = () => line.classList.add('hidden');

  surface.addEventListener('dragstart', (e) => {
    const h = e.target.closest && e.target.closest('.ne-handle');
    if (!h) return e.preventDefault();
    dragging = h.closest('.ne-block');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', '');
    dragging.classList.add('ne-dragging');
  });

  surface.addEventListener('dragover', (e) => {
    if (!dragging) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const over = e.target.closest && e.target.closest('.ne-block');
    if (!over || over === dragging || dragging.contains(over)) { drop = null; return hideLine(); }
    const r = over.getBoundingClientRect();
    let pos;
    if (e.clientX < r.left + r.width * EDGE) pos = 'left';
    else if (e.clientX > r.right - r.width * EDGE) pos = 'right';
    else pos = e.clientY < r.top + r.height / 2 ? 'before' : 'after';
    // 컬럼 리스트 자체를 다시 컬럼으로 감싸는 중첩은 Notion처럼 금지
    if ((pos === 'left' || pos === 'right')
        && over.dataset.type === 'column_list' && !over.closest('.ne-col'))
      pos = e.clientY < r.top + r.height / 2 ? 'before' : 'after';
    drop = { target: over, pos };
    showLine(over, pos);
  });

  surface.addEventListener('drop', (e) => {
    if (!dragging || !drop) return;
    e.preventDefault();
    const origin = dragging.parentElement;
    const { target, pos } = drop;
    if (pos === 'before') target.before(dragging);
    else if (pos === 'after') target.after(dragging);
    else dropSide(target, dragging, pos);
    cleanup(origin);
  });

  surface.addEventListener('dragend', () => {
    if (dragging) dragging.classList.remove('ne-dragging');
    dragging = null; drop = null; hideLine();
  });
}

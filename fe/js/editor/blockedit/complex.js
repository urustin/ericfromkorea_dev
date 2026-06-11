// 복합 블록(토글/컬럼/표/북마크) 편집 UI 구성과 직렬화.
// 순환 import 방지: makeBlockEl(mk) / blockToData(ser)는 factory가 인자로 넘긴다.
import { el } from '../../dom.js';
import { spansToHtml, htmlToSpans } from './model.js';

export const COMPLEX = new Set(['toggle', 'table', 'column_list', 'bookmark']);

// 자식 블록 편집 영역 (재귀). 비어 있으면 빈 문단 하나로 시작.
export function kidsEl(children, mk) {
  const list = children && children.length ? children : [{ type: 'paragraph', rich: [] }];
  return el('div', { class: 'ne-kids' }, list.map(mk));
}

// 내용 없는 placeholder 문단은 저장하지 않는다 (추출기와 동일한 규칙)
const isEmptyPara = (b) =>
  b.type === 'paragraph' && !(b.rich && b.rich.length) && !b.children;

const kidsData = (root, ser) =>
  [...root.querySelectorAll(':scope > .ne-block')].map(ser).filter((b) => !isEmptyPara(b));

// ---- 토글 -----------------------------------------------------------------
function buildToggle(b, mk) {
  const head = el('div', { class: 'ne-toggle__head' },
    el('button', {
      class: 'ne-tgl', type: 'button', title: '접기/펼치기',
      onClick: (e) => e.target.closest('.ne-toggle').classList.toggle('closed'),
    }, '▾'),
    el('div', { class: 'ne-content', contenteditable: 'true', 'data-ph': '토글 제목', html: spansToHtml(b.rich) }));
  return el('div', { class: 'ne-toggle' }, head, kidsEl(b.children, mk));
}

function serToggle(main, ser) {
  const b = {
    type: 'toggle',
    rich: htmlToSpans(main.querySelector(':scope > .ne-toggle > .ne-toggle__head > .ne-content')),
  };
  const kids = kidsData(main.querySelector(':scope > .ne-toggle > .ne-kids'), ser);
  if (kids.length) b.children = kids;
  return b;
}

// ---- 컬럼 -----------------------------------------------------------------
function colEl(children, mk) {
  return el('div', { class: 'ne-col' },
    el('button', {
      class: 'ne-col__x', type: 'button', title: '컬럼 삭제',
      onClick: (e) => e.target.closest('.ne-col').remove(),
    }, '✕'),
    kidsEl(children, mk));
}

function buildCols(b, mk) {
  const cols = (b.children && b.children.length ? b.children : [{}, {}])
    .map((c) => colEl(c.children, mk));
  const wrap = el('div', { class: 'ne-cols' }, cols);
  wrap.append(el('button', {
    class: 'ne-cols__add', type: 'button', title: '컬럼 추가',
    onClick: () => wrap.insertBefore(colEl(null, mk), wrap.lastElementChild),
  }, '＋'));
  return wrap;
}

function serCols(main, ser) {
  // 빈 컬럼도 레이아웃으로 보존한다 (Notion과 동일)
  const cols = [...main.querySelectorAll(':scope > .ne-cols > .ne-col')].map((c) => {
    const col = { type: 'column' };
    const kids = kidsData(c.querySelector(':scope > .ne-kids'), ser);
    if (kids.length) col.children = kids;
    return col;
  });
  return { type: 'column_list', children: cols };
}

// ---- 표 -------------------------------------------------------------------
const cellEl = (spans) =>
  el('td', { class: 'ne-cell', contenteditable: 'true', html: spansToHtml(spans) });

function rowEl(cells) {
  return el('tr', {}, cells.map(cellEl),
    el('td', { class: 'ne-row__x' }, el('button', {
      type: 'button', title: '행 삭제', class: 'ne-xbtn',
      onClick: (e) => e.target.closest('tr').remove(),
    }, '✕')));
}

function buildTable(b) {
  const rows = (b.children && b.children.length ? b.children : [{}, {}, {}])
    .map((r) => rowEl(r.cells || [[], []].map(() => [])));
  const tbody = el('tbody', {}, rows);
  const colCount = () => tbody.rows[0] ? tbody.rows[0].cells.length - 1 : 0;
  const bar = el('div', { class: 'ne-tablebar' },
    el('label', { class: 'ne-thead' },
      el('input', { type: 'checkbox', class: 'ne-hasheader', ...(b.has_col_header ? { checked: 'checked' } : {}) }),
      ' 머리글 행'),
    el('button', { class: 'btn btn--sm', type: 'button', onClick: () => tbody.append(rowEl(Array.from({ length: colCount() }, () => []))) }, '＋ 행'),
    el('button', { class: 'btn btn--sm', type: 'button', onClick: () => [...tbody.rows].forEach((tr) => tr.insertBefore(cellEl([]), tr.lastElementChild)) }, '＋ 열'),
    el('button', { class: 'btn btn--sm', type: 'button', onClick: () => colCount() > 1 && [...tbody.rows].forEach((tr) => tr.cells[colCount() - 1].remove()) }, '－ 열'));
  return el('div', { class: 'ne-tablewrap' }, bar, el('table', { class: 'ne-table' }, tbody));
}

function serTable(main) {
  const rows = [...main.querySelectorAll(':scope > .ne-tablewrap > .ne-table > tbody > tr')]
    .map((tr) => ({ type: 'table_row', cells: [...tr.querySelectorAll('.ne-cell')].map(htmlToSpans) }))
    .filter((r) => r.cells.length);
  return {
    type: 'table',
    has_col_header: main.querySelector('.ne-hasheader').checked,
    children: rows,
  };
}

// ---- 북마크 ---------------------------------------------------------------
function buildBookmark(b) {
  return el('div', { class: 'ne-bm' }, '🔖',
    el('input', { class: 'f-in ne-bm__url', value: b.url || '', placeholder: 'https://…' }));
}

const serBookmark = (main) =>
  ({ type: 'bookmark', url: main.querySelector('.ne-bm__url').value.trim() });

// ---- 라우팅 ---------------------------------------------------------------
export function buildComplex(b, mk) {
  if (b.type === 'toggle') return buildToggle(b, mk);
  if (b.type === 'column_list') return buildCols(b, mk);
  if (b.type === 'table') return buildTable(b);
  return buildBookmark(b);
}

export function serializeComplex(main, type, ser) {
  if (type === 'toggle') return serToggle(main, ser);
  if (type === 'column_list') return serCols(main, ser);
  if (type === 'table') return serTable(main);
  return serBookmark(main);
}

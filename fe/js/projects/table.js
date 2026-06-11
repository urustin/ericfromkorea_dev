// Renders the projects database as a Notion-like table.
import { el } from '../dom.js';
import { statusPill, tag, tagRow } from '../components.js';
import { statusColors, typeColors } from '../data/skillColors.js';

const COLS = ['이름', 'Status', 'Type', 'Date', 'Skill & Library', 'Client', 'Summary'];

const fmtDate = (d) => (d ? d.replace(/-/g, '. ').replace(/\. $/, '') : '—');

function row(p) {
  return el('tr', { id: p.id },
    el('td', { class: 'c-name' },
      el('a', { class: 'row-link', href: `project.html?id=${p.id}` }, p.name)),
    el('td', {}, statusPill(p.status, statusColors[p.status])),
    el('td', {}, p.type ? tag(p.type, typeColors[p.type]) : el('span', { class: 'muted' }, '—')),
    el('td', { class: 'hide-sm' }, fmtDate(p.date)),
    el('td', { class: 'c-skills' }, tagRow(p.skills)),
    el('td', { class: 'c-client' }, p.client || el('span', { class: 'muted' }, '—')),
    el('td', { class: 'c-summary' }, p.summary || el('span', { class: 'muted' }, '—')));
}

// Build the table element; returns { table, render(list) } for re-rendering rows.
export function buildTable() {
  const tbody = el('tbody');
  const table = el('table', { class: 'db-table' },
    el('thead', {}, el('tr', {}, COLS.map((c) => el('th', {}, c)))),
    tbody);

  function render(list) {
    tbody.replaceChildren();
    if (!list.length) {
      tbody.append(el('tr', {}, el('td', { class: 'empty', colspan: COLS.length },
        '조건에 맞는 프로젝트가 없습니다.')));
      return;
    }
    tbody.append(...list.map(row));
  }
  return { table, render };
}

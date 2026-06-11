// Editable table for the All Projects database.
import { el } from '../dom.js';
import { getProjectsRaw } from '../data/store.js';
import { input, select } from './fields.js';
import { editActions } from './bar.js';
import { saveProjects } from './api.js';

const STATUS = ['Not started', 'In progress', 'Done'];
const TYPE = ['', 'Main', 'Optional', 'Hidden'];
const slugify = (s) => (s || 'project').toLowerCase().replace(/[^a-z0-9가-힣]+/g, '-')
  .replace(/^-+|-+$/g, '').slice(0, 40) || 'project-' + Date.now();

function rowEditor(p, onDelete) {
  const f = {
    name: input(null, p.name || ''), status: select(null, p.status || 'Not started', STATUS),
    type: select(null, p.type || '', TYPE), date: input(null, p.date || ''),
    client: input(null, p.client || ''), summary: input(null, p.summary || ''),
    skills: input(null, (p.skills || []).join(', ')),
  };
  f.date.el.placeholder = 'YYYY-MM-DD';
  f.skills.el.placeholder = '쉼표로 구분';
  const tr = el('tr', {},
    el('td', {}, f.name.node), el('td', {}, f.status.node), el('td', {}, f.type.node),
    el('td', {}, f.date.node), el('td', {}, f.client.node), el('td', {}, f.summary.node),
    el('td', {}, f.skills.node),
    el('td', {}, el('button', { class: 'btn btn--sm btn--danger', onClick: () => onDelete(entry) }, '✕')));
  const entry = {
    tr,
    value: () => ({
      id: p.id || slugify(f.name.value()), name: f.name.value(), status: f.status.value(),
      type: f.type.value(), date: f.date.value(), client: f.client.value(),
      summary: f.summary.value(),
      skills: f.skills.value().split(',').map((s) => s.trim()).filter(Boolean),
    }),
  };
  return entry;
}

export async function editProjects() {
  window.__editing = true;
  const rows = await getProjectsRaw();
  const entries = [];
  const tbody = el('tbody');
  const del = (e) => { entries.splice(entries.indexOf(e), 1); e.tr.remove(); };
  const addRow = (p) => { const e = rowEditor(p, del); entries.push(e); tbody.append(e.tr); };
  rows.forEach(addRow);

  const head = ['이름', 'Status', 'Type', 'Date', 'Client', 'Summary', 'Skills', ''];
  const table = el('table', { class: 'db-table edit-table' },
    el('thead', {}, el('tr', {}, head.map((h) => el('th', {}, h)))), tbody);

  document.querySelector('#app').replaceChildren(
    el('h1', {}, 'Projects 편집'),
    el('button', { class: 'btn btn--sm add-row', onClick: () => addRow({}) }, '＋ 프로젝트 추가'),
    el('div', { class: 'db-card', style: { marginTop: '12px', overflowX: 'auto' } }, table));

  const save = async (msg) => {
    msg.textContent = '저장 중…';
    try { await saveProjects(entries.map((e) => e.value())); location.href = 'projects.html'; }
    catch (e) { msg.textContent = e.message; }
  };
  editActions({ onSave: save, onCancel: () => location.reload() });
}

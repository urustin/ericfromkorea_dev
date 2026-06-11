// All Projects 인라인 편집 — 보기와 같은 표에서 셀을 바로 수정한다 (Notion 방식).
import { el } from '../dom.js';
import { getProjectsRaw } from '../data/store.js';
import { select } from './fields.js';
import { editActions } from './bar.js';
import { saveProjects } from './api.js';

const STATUS = ['Not started', 'In progress', 'Done'];
const TYPE = ['', 'Main', 'Optional', 'Hidden'];
const slugify = (s) => (s || 'project').toLowerCase().replace(/[^a-z0-9가-힣]+/g, '-')
  .replace(/^-+|-+$/g, '').slice(0, 40) || 'project-' + Date.now();

// 셀 자체가 편집 영역 (칸 교체 없이 표 안에서 바로 입력)
const cell = (val, ph) => el('td', {
  class: 'ec', contenteditable: 'true', 'data-ph': ph || '',
}, val || '');

function rowEditor(p, onDelete) {
  const status = select(null, p.status || 'Not started', STATUS);
  const type = select(null, p.type || '', TYPE);
  const c = {
    name: cell(p.name, '이름'),
    date: cell(p.date, 'YYYY-MM-DD'),
    skills: cell((p.skills || []).join(', '), '쉼표로 구분'),
    client: cell(p.client),
    summary: cell(p.summary),
  };
  const tr = el('tr', {}, c.name,
    el('td', {}, status.node), el('td', {}, type.node),
    c.date, c.skills, c.client, c.summary,
    el('td', { class: 'ec-x' }, el('button', {
      class: 'ne-xbtn', type: 'button', title: '행 삭제',
      onClick: () => onDelete(entry),
    }, '✕')));
  const entry = {
    tr,
    value: () => ({
      id: p.id || slugify(c.name.textContent),
      name: c.name.textContent.trim(),
      status: status.value(), type: type.value(),
      date: c.date.textContent.trim(), client: c.client.textContent.trim(),
      summary: c.summary.textContent.trim(),
      skills: c.skills.textContent.split(',').map((s) => s.trim()).filter(Boolean),
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

  const head = ['이름', 'Status', 'Type', 'Date', 'Skill & Library', 'Client', 'Summary', ''];
  const table = el('table', { class: 'db-table db-table--edit' },
    el('thead', {}, el('tr', {}, head.map((h) => el('th', {}, h)))), tbody);

  document.querySelector('#app').replaceChildren(
    el('h1', {}, '🗂️ All Projects'),
    el('p', { class: 'muted' }, '셀을 클릭해 바로 수정하세요. 행 위에 올리면 삭제(✕)가 보입니다.'),
    el('button', { class: 'btn btn--sm add-row', onClick: () => addRow({}) }, '＋ 프로젝트 추가'),
    el('div', { class: 'db-card', style: { marginTop: '12px', overflowX: 'auto' } }, table));

  const save = async (msg) => {
    msg.textContent = '저장 중…';
    try { await saveProjects(entries.map((e) => e.value())); location.href = 'projects.html'; }
    catch (e) { msg.textContent = e.message; }
  };
  editActions({ onSave: save, onCancel: () => location.reload() });
}

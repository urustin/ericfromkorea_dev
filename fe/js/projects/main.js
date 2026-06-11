// Entry point for the All Projects database page.
import { el, mount } from '../dom.js';
import { getProjects } from '../data/store.js';
import { buildTable } from './table.js';
import { buildToolbar, applyFilters } from './filters.js';
import { mountBar } from '../editor/bar.js';
import { isAuthed } from '../editor/auth.js';

document.title = 'All Projects — 손승우';

async function newPage() {
  const name = (prompt('새 페이지 제목', '제목 없음') || '제목 없음').trim();
  const { createPage } = await import('../editor/api.js');
  try {
    const row = await createPage(name);
    location.href = `project.html?id=${row.id}`;
  } catch (e) { alert(e.message); }
}

const projects = await getProjects();
const sorted = [...projects].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

const state = { q: '', type: 'All', status: 'All' };
const { table, render } = buildTable();
const count = el('span', { class: 'count' });

function refresh() {
  const list = applyFilters(sorted, state);
  count.textContent = `${list.length} / ${projects.length} projects`;
  render(list);
}

const header = el('div', { class: 'db-header' },
  el('h1', {}, '🗂️ All Projects'),
  el('p', { class: 'muted' }, '지금까지 진행한 개발 프로젝트 데이터베이스입니다.'),
  isAuthed()
    ? el('button', { class: 'btn btn--primary', style: { marginTop: '12px' }, onClick: newPage }, '＋ 새 페이지')
    : null);

mount('#app', header, buildToolbar(state, refresh), count,
  el('div', { class: 'db-card' }, table));
refresh();

mountBar(async () => {
  const { editProjects } = await import('../editor/projectsEditor.js');
  editProjects();
});

// Search + chip filters for the projects DB. Decoupled, state via callback.
import { el } from '../dom.js';

// Apply current filter state to the project list.
export function applyFilters(projects, state) {
  const q = state.q.trim().toLowerCase();
  return projects.filter((p) => {
    if (state.type !== 'All' && p.type !== state.type) return false;
    if (state.status !== 'All' && p.status !== state.status) return false;
    if (!q) return true;
    const hay = [p.name, p.summary, p.client, ...p.skills.map((s) => s.name)]
      .join(' ').toLowerCase();
    return hay.includes(q);
  });
}

function chipGroup(values, current, onPick) {
  const chips = values.map((v) =>
    el('button', {
      class: 'chip' + (v === current() ? ' active' : ''),
      onClick: (e) => {
        onPick(v);
        e.currentTarget.parentElement.querySelectorAll('.chip')
          .forEach((c) => c.classList.remove('active'));
        e.currentTarget.classList.add('active');
      },
    }, v));
  return el('div', { class: 'chips' }, chips);
}

// Build the toolbar UI. `onChange` runs whenever a filter changes.
export function buildToolbar(state, onChange) {
  const search = el('input', {
    type: 'search', placeholder: '프로젝트 검색…',
    onInput: (e) => { state.q = e.target.value; onChange(); },
  });
  const types = chipGroup(['All', 'Main', 'Optional', 'Hidden'],
    () => state.type, (v) => { state.type = v; onChange(); });
  const statuses = chipGroup(['All', 'Done', 'In progress', 'Not started'],
    () => state.status, (v) => { state.status = v; onChange(); });

  return el('div', {},
    el('div', { class: 'toolbar' }, search, types),
    el('div', { class: 'toolbar' }, statuses));
}

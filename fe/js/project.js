// Project detail page: metadata header + Notion body blocks.
import { el, mount } from './dom.js';
import { getProjects, getDetail } from './data/store.js';
import { statusColors, typeColors } from './data/skillColors.js';
import { statusPill, tag, tagRow } from './components.js';
import { renderBlocks } from './notion/render.js';
import { mountBar } from './editor/bar.js';

const id = new URLSearchParams(location.search).get('id');

function prop(label, value) {
  return el('div', { class: 'prop' },
    el('div', { class: 'prop__k' }, label),
    el('div', { class: 'prop__v' }, value));
}

function header(p) {
  const fmt = (d) => (d ? d.replace(/-/g, '. ') : '—');
  return el('header', { class: 'detail-head' },
    el('a', { class: 'back', href: 'projects.html' }, '← All Projects'),
    el('h1', {}, p.name),
    p.summary ? el('p', { class: 'detail-summary' }, p.summary) : null,
    el('div', { class: 'props' },
      prop('Status', statusPill(p.status, statusColors[p.status])),
      prop('Type', p.type ? tag(p.type, typeColors[p.type]) : '—'),
      prop('Date', fmt(p.date)),
      prop('Client', p.client || '—'),
      prop('Skill & Library', tagRow(p.skills))));
}

const projects = await getProjects();
const p = projects.find((x) => x.id === id);

if (!p) {
  document.title = 'Not found';
  mount('#app', el('p', { class: 'empty' }, '프로젝트를 찾을 수 없습니다.'),
    el('a', { class: 'link', href: 'projects.html' }, '← All Projects'));
} else {
  document.title = `${p.name} — 손승우`;
  const blocks = await getDetail(p.id);
  const body = el('article', { class: 'notion-body' });
  body.append(blocks.length ? renderBlocks(blocks)
    : el('p', { class: 'muted' }, '아직 작성된 본문이 없습니다.'));
  mount('#app', header(p), body);
  mountBar(async () => {
    const { editDetail } = await import('./editor/detailEditor.js');
    editDetail(p.id, blocks);
  });
}

// Builds the profile (index) page: hero + 프로젝트 그리드 + Notion 블록 본문.
import { el, mount } from './dom.js';
import { getProfile, getProjects, getDetail } from './data/store.js';
import { contactRow, projectCard } from './components.js';
import { renderBlocks } from './notion/render.js';
import { mountBar } from './editor/bar.js';

document.title = '개발자 손승우입니다';

function hero(P) {
  return el('section', { class: 'hero' },
    el('div', { class: 'hero__photo' }, el('img', { src: P.photo, alt: P.name })),
    el('div', { class: 'hero__info contact' },
      el('h1', {}, P.name),
      el('p', {}, el('code', { class: 'inline' }, P.updated)),
      ...P.contacts.map(contactRow)));
}

function projectsSection(projects) {
  const featured = projects
    .filter((p) => p.type !== 'Hidden')
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  return el('section', {},
    el('h2', {}, 'Projects'),
    el('div', { class: 'project-grid' }, featured.map(projectCard)),
    el('a', { class: 'more-link', href: 'projects.html' }, '더 보기 →'));
}

const [P, projects, body] = await Promise.all([
  getProfile(), getProjects(), getDetail('profile-body')]);

mount('#app', hero(P), el('hr', { class: 'divider' }), projectsSection(projects),
  el('hr', { class: 'divider' }),
  el('article', { class: 'notion-body' }, renderBlocks(body)));

mountBar(async () => {
  const { editProfile } = await import('./editor/profileEditor.js');
  editProfile(P, body);
}, { sync: 'profile-body' });

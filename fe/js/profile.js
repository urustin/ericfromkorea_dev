// Builds the profile (index) page from JSON data + shared components.
import { el, mount } from './dom.js';
import { getProfile, getProjects } from './data/store.js';
import { contactRow, entry, projectCard } from './components.js';
import { mountBar } from './editor/bar.js';

document.title = '개발자 손승우입니다';

function render(P, projects) {
  const hero = el('section', { class: 'hero' },
    el('div', { class: 'hero__photo' }, el('img', { src: P.photo, alt: P.name })),
    el('div', { class: 'hero__info contact' },
      el('h1', {}, P.name),
      el('p', {}, el('code', { class: 'inline' }, P.updated)),
      ...P.contacts.map(contactRow)));

  const featured = projects
    .filter((p) => p.type !== 'Hidden')
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const projectsSection = el('section', {},
    el('h2', {}, 'Projects'),
    el('div', { class: 'project-grid' }, featured.map(projectCard)),
    el('a', { class: 'more-link', href: 'projects.html' }, '더 보기 →'));

  const skills = el('section', {},
    el('h3', {}, 'Skills'),
    el('pre', { class: 'codeblock' }, el('code', {}, P.skillsCode)));
  const about = el('section', {},
    el('h3', {}, 'About Me'),
    el('ul', { class: 'notion-list' }, P.aboutMe.map((t) => el('li', {}, t))));

  const left = el('div', { class: 'col' },
    el('h2', {}, '💼 Career'), el('hr', { class: 'divider' }),
    ...P.career.map((e) => entry(e.when, e.what)),
    el('h2', {}, '🏆 자격 / 수상'), el('hr', { class: 'divider' }),
    ...P.awards.map((e) => entry(e.when, e.what)));
  const right = el('div', { class: 'col' },
    el('h2', {}, '🏫 Education'), el('hr', { class: 'divider' }),
    ...P.education.map((e) => entry(e.when, e.what)),
    el('h2', {}, '🇺🇸 Language'), el('hr', { class: 'divider' }),
    ...P.language.map((e) => entry(e.when, e.what)),
    P.languageImage ? el('img', { class: 'ielts-shot', src: P.languageImage, alt: 'IELTS' }) : null);

  mount('#app', hero, el('hr', { class: 'divider' }), projectsSection,
    el('hr', { class: 'divider' }), skills, about,
    el('hr', { class: 'divider' }), el('section', { class: 'columns' }, left, right));
}

const [P, projects] = await Promise.all([getProfile(), getProjects()]);
render(P, projects);
mountBar(async () => {
  const { editProfile } = await import('./editor/profileEditor.js');
  editProfile(P);
});

// 갤러리 뷰 — 프로젝트를 커버 이미지 카드로 보여준다 (Notion 갤러리 뷰).
import { el, mount } from '../dom.js';
import { getProjects, getDetail } from '../data/store.js';
import { statusPill, tagRow } from '../components.js';
import { statusColors } from '../data/skillColors.js';
import { buildToolbar, applyFilters } from './filters.js';
import { viewTabs } from './views.js';
import { mountBar } from '../editor/bar.js';

document.title = 'Projects Gallery — 손승우';

// 본문 블록에서 첫 이미지를 커버로 사용 (중첩 포함)
function firstImage(blocks) {
  for (const b of blocks || []) {
    if (b.type === 'image' && b.src) return b.src;
    const hit = firstImage(b.children);
    if (hit) return hit;
  }
  return null;
}

function card(p, cover) {
  return el('a', { class: 'gallery-card', href: `project.html?id=${p.id}` },
    el('div', { class: 'gallery-card__cover' },
      cover ? el('img', { src: cover, loading: 'lazy', alt: '' })
            : el('span', { class: 'gallery-card__ph' }, '🗂️')),
    el('div', { class: 'gallery-card__body' },
      el('h4', {}, p.name),
      el('div', { class: 'gallery-card__meta' }, statusPill(p.status, statusColors[p.status])),
      tagRow(p.skills)));
}

const projects = await getProjects();
const sorted = [...projects].filter((p) => p.type !== 'Hidden')
  .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
// 커버 이미지는 각 프로젝트 본문에서 병렬로 수집
const covers = Object.fromEntries(await Promise.all(
  sorted.map(async (p) => [p.id, firstImage(await getDetail(p.id))])));

const state = { q: '', type: 'All', status: 'All' };
const grid = el('div', { class: 'gallery-grid' });
const count = el('span', { class: 'count' });

function refresh() {
  const list = applyFilters(sorted, state);
  count.textContent = `${list.length} / ${sorted.length} projects`;
  grid.replaceChildren(...list.map((p) => card(p, covers[p.id])));
}

mount('#app',
  el('div', { class: 'db-header' },
    el('h1', {}, '🗂️ All Projects'),
    el('p', { class: 'muted' }, '지금까지 진행한 개발 프로젝트 데이터베이스입니다.')),
  viewTabs('gallery'), buildToolbar(state, refresh), count, grid);
refresh();
mountBar(null, { sync: '--db-only' });

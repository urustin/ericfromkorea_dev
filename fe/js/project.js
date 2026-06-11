// Project detail page: metadata header + Notion body blocks.
import { el, mount } from './dom.js';
import { getProjects, getDetail, getSubpages } from './data/store.js';
import { statusColors, typeColors } from './data/skillColors.js';
import { statusPill, tag, tagRow } from './components.js';
import { renderBlocks } from './notion/render.js';
import { mountBar } from './editor/bar.js';
import { mountTopButton } from './topbtn.js';

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

// 긴 문서: h2 섹션을 접이식(collapsed_section)으로 묶어 기본 화면을 짧게 만든다.
// 보기 전용 변환 — 편집/저장은 원본 블록을 그대로 사용한다.
function collapseSections(view) {
  const out = [];
  let cur = null;
  for (const b of view) {
    if (b.type === 'heading_2') {
      cur = { type: 'collapsed_section', rich: b.rich, color: b.color, children: [] };
      out.push(cur);
    } else if (cur && b.type !== 'table_of_contents') {
      cur.children.push(b);
    } else {
      out.push(b);
    }
  }
  const first = out.find((b) => b.type === 'collapsed_section');
  if (first) first.open = true; // 첫 섹션(요약)은 펼친 채로
  return out;
}

// 본문 + (인증 시) 편집 버튼 마운트 — 프로젝트/서브페이지 공용
async function mountBody(slug) {
  const blocks = await getDetail(slug);
  let view = [...blocks];
  // 긴 문서(헤딩 6개 이상): 목차 자동 추가 + h2 섹션 접기
  if (view.filter((b) => b.type.startsWith('heading_')).length >= 6) {
    if (!view.some((b) => b.type === 'table_of_contents')) view.unshift({ type: 'table_of_contents' });
    view = collapseSections(view);
  }
  const body = el('article', { class: 'notion-body' });
  body.append(view.length ? renderBlocks(view)
    : el('p', { class: 'muted' }, '아직 작성된 본문이 없습니다.'));
  mount('#app', body);
  mountBar(async () => {
    const { editDetail } = await import('./editor/detailEditor.js');
    editDetail(slug, blocks);
  }, { sync: sub ? sub.parent : slug });
}

mountTopButton();
const projects = await getProjects();
const p = projects.find((x) => x.id === id);
const sub = p ? null : (await getSubpages())[id];

if (!p && sub) {
  // 서브페이지: 부모 페이지로 돌아가는 간단한 헤더만 표시
  document.title = `${sub.title} — 손승우`;
  mount('#app', el('header', { class: 'detail-head' },
    el('a', { class: 'back', href: `project.html?id=${encodeURIComponent(sub.parent)}` }, '← 상위 페이지'),
    el('h1', {}, sub.title)));
  await mountBody(id);
} else if (!p) {
  document.title = 'Not found';
  mount('#app', el('p', { class: 'empty' }, '프로젝트를 찾을 수 없습니다.'),
    el('a', { class: 'link', href: 'projects.html' }, '← All Projects'));
} else {
  document.title = `${p.name} — 손승우`;
  mount('#app', header(p));
  await mountBody(p.id);
}

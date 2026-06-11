// 서브페이지(child_page) 블록 — 제목 편집 + 새 탭 열기 링크.
import { el } from '../../dom.js';

export function buildChildPage(b) {
  return el('div', { class: 'ne-childpage', dataset: { slug: b.slug || '' } },
    el('span', { class: 'ne-childpage__ic' }, '📄'),
    el('span', { class: 'ne-content ne-childpage__t', contenteditable: 'true', 'data-ph': '제목 없음' },
      b.title || ''),
    el('a', {
      class: 'ne-childpage__go', title: '서브페이지 열기', target: '_blank',
      href: `project.html?id=${encodeURIComponent(b.slug || '')}`,
    }, '↗'));
}

export function serChildPage(main) {
  const d = main.querySelector('.ne-childpage');
  return {
    type: 'child_page',
    title: d.querySelector('.ne-childpage__t').textContent.trim() || '제목 없음',
    slug: d.dataset.slug,
  };
}

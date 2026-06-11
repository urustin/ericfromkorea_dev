// Notion식 뷰 전환 탭 (표 ⇄ 갤러리).
import { el } from '../dom.js';

export function viewTabs(active) {
  const tab = (label, href, key) => el('a', {
    class: 'view-tab' + (active === key ? ' on' : ''), href,
  }, label);
  return el('div', { class: 'view-tabs' },
    tab('▦ 표', 'projects.html', 'table'),
    tab('🖼 갤러리', '/gallery', 'gallery'));
}

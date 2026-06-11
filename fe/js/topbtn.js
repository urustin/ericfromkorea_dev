// 스크롤하면 나타나는 '맨 위로' 플로팅 버튼.
import { el } from './dom.js';

export function mountTopButton() {
  const btn = el('button', {
    class: 'top-btn hidden', type: 'button', title: '맨 위로',
    onClick: () => window.scrollTo({ top: 0, behavior: 'smooth' }),
  }, '↑');
  document.body.append(btn);
  addEventListener('scroll', () => {
    btn.classList.toggle('hidden', scrollY < 500);
  }, { passive: true });
}

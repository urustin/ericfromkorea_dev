// Floating editor bar, shown only when authenticated.
import { el } from '../dom.js';
import { isAuthed, logout, authedFetch } from './auth.js';

// Notion 동기화 트리거 후 완료까지 폴링하고 새로고침
async function runSync(slug, btn) {
  btn.disabled = true;
  btn.textContent = '⟳ 동기화 중…';
  try {
    const r = await authedFetch('api/sync', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug }),
    });
    if (!r.ok) throw new Error('동기화 시작 실패: ' + r.status);
    for (;;) {
      await new Promise((ok) => setTimeout(ok, 2000));
      const s = await (await fetch('api/sync/status')).json();
      if (!s.running) {
        if (s.ok === false) throw new Error('동기화 실패\n' + (s.log || ''));
        return location.reload();
      }
      // 추출기 마지막 로그 줄로 진행 상황 표시
      const last = (s.log || '').trim().split('\n').pop() || '';
      btn.textContent = `⟳ ${last.slice(0, 28) || '동기화 중'}… ${s.elapsed || ''}s`;
    }
  } catch (e) {
    alert(e.message);
    btn.disabled = false;
    btn.textContent = '⟳ Notion 동기화';
  }
}

// onEdit: "편집" 클릭 핸들러 (없으면 버튼 생략). opts.sync: Notion에서 다시 가져올 slug.
export function mountBar(onEdit, opts = {}) {
  if (!isAuthed()) return;
  const syncBtn = opts.sync
    ? el('button', { class: 'btn', title: 'Notion 원본에서 이 페이지를 다시 가져옵니다' }, '⟳ Notion 동기화')
    : null;
  if (syncBtn) syncBtn.addEventListener('click', () => runSync(opts.sync === true ? null : opts.sync, syncBtn));
  const bar = el('div', { class: 'edit-bar' },
    el('span', { class: 'edit-bar__tag' }, '편집 가능'),
    syncBtn,
    onEdit
      ? el('button', { class: 'btn btn--primary', onClick: onEdit }, '✎ 편집')
      : null,
    el('button', { class: 'btn', onClick: () => { logout(); location.reload(); } }, '로그아웃'));
  document.body.append(bar);
}

// A sticky action bar shown while editing (Save / Cancel).
export function editActions({ onSave, onCancel, status }) {
  const msg = el('span', { class: 'edit-bar__msg' }, status || '');
  const bar = el('div', { class: 'edit-bar edit-bar--active' },
    msg,
    el('button', { class: 'btn', onClick: onCancel }, '취소'),
    el('button', { class: 'btn btn--primary', onClick: () => onSave(msg) }, '💾 저장'));
  document.body.append(bar);
  return { bar, msg };
}

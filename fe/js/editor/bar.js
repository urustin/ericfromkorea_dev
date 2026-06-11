// Floating editor bar, shown only when authenticated.
import { el } from '../dom.js';
import { isAuthed, logout } from './auth.js';

// onEdit: called when "편집" is clicked. Pass null on pages without an editor.
export function mountBar(onEdit) {
  if (!isAuthed()) return;
  const bar = el('div', { class: 'edit-bar' },
    el('span', { class: 'edit-bar__tag' }, '편집 가능'),
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

// 프로필 편집 — 상단(사진/이름/연락처)은 필드, 본문은 Notion 블록 에디터.
import { el } from '../dom.js';
import { input } from './fields.js';
import { saveProfile, saveDetail } from './api.js';
import { mountBlockEditor } from './blockedit/editor.js';

// 연락처 줄 편집 (icon · text · href)
function contactList(items) {
  const rows = [];
  const box = el('div', {});
  const add = (c = {}) => {
    const fs = ['icon', 'text', 'href'].map((k) => {
      const f = input(null, c[k] || '');
      f.el.placeholder = k;
      return f;
    });
    const row = el('div', { class: 'list-item' }, ...fs.map((f) => f.node),
      el('button', { class: 'btn btn--sm btn--danger', type: 'button', onClick: () => {
        rows.splice(rows.indexOf(entry), 1); row.remove();
      } }, '✕'));
    const entry = { row, fs };
    rows.push(entry); box.append(row);
  };
  (items || []).forEach(add);
  const node = el('div', { class: 'editor-section' }, el('h3', {}, '연락처'), box,
    el('button', { class: 'btn btn--sm add-row', type: 'button', onClick: () => add() }, '＋ 추가'));
  const value = () => rows.map((r) => {
    const [icon, text, href] = r.fs.map((f) => f.value().trim());
    const o = { icon, text };
    if (href) o.href = href;
    return o;
  }).filter((o) => o.text);
  return { node, value };
}

export function editProfile(P, body) {
  const f = {
    name: input('이름', P.name),
    photo: input('프로필 이미지 경로', P.photo),
    updated: input('업데이트 표기', P.updated),
  };
  const contacts = contactList(P.contacts);
  const head = el('div', { class: 'editor-head' },
    f.name.node, f.photo.node, f.updated.node, contacts.node,
    el('h3', {}, '본문 (Notion 블록)'));

  mountBlockEditor('profile-body', body, {
    back: 'portfolio.html',
    title: '프로필 편집',
    head,
    onSave: async (blocks) => {
      await saveProfile({
        ...P, name: f.name.value(), photo: f.photo.value(),
        updated: f.updated.value(), contacts: contacts.value(),
      });
      await saveDetail('profile-body', blocks);
    },
  });
}

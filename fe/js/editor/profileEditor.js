// Form-based editor for the profile page.
import { el, mount } from '../dom.js';
import { input, textarea, stringList } from './fields.js';
import { editActions } from './bar.js';
import { saveProfile } from './api.js';

// Editable list of records with given field keys. value() -> array of objects.
function recordList(label, items, keys) {
  const rows = [];
  const box = el('div', {});
  const add = (obj = {}) => {
    const fs = keys.map((k) => input(null, obj[k] || ''));
    fs.forEach((f, i) => { f.el.placeholder = keys[i]; });
    const row = el('div', { class: 'list-item' }, ...fs.map((f) => f.node),
      el('button', { class: 'btn btn--sm btn--danger', onClick: () => rm(entry) }, '✕'));
    const entry = { row, fs };
    rows.push(entry); box.append(row);
  };
  const rm = (e) => { rows.splice(rows.indexOf(e), 1); e.row.remove(); };
  (items || []).forEach(add);
  const node = el('div', { class: 'editor-section' }, el('h3', {}, label), box,
    el('button', { class: 'btn btn--sm add-row', onClick: () => add() }, '＋ 추가'));
  const value = () => rows.map((r) => {
    const o = {}; keys.forEach((k, i) => { o[k] = r.fs[i].value(); });
    return o;
  }).filter((o) => keys.some((k) => (o[k] || '').trim()));
  return { node, value };
}

export function editProfile(P) {
  window.__editing = true;
  const f = {
    name: input('이름', P.name),
    photo: input('프로필 이미지 경로', P.photo),
    updated: input('업데이트 표기', P.updated),
    code: textarea('Skills 코드', P.skillsCode),
    languageImage: input('Language 이미지 경로', P.languageImage),
  };
  const contacts = recordList('연락처 (icon · text · href)', P.contacts, ['icon', 'text', 'href']);
  const about = stringList('About Me', P.aboutMe);
  const career = recordList('💼 Career (when · what)', P.career, ['when', 'what']);
  const awards = recordList('🏆 자격 / 수상 (when · what)', P.awards, ['when', 'what']);
  const edu = recordList('🏫 Education (when · what)', P.education, ['when', 'what']);
  const lang = recordList('🇺🇸 Language (when · what)', P.language, ['when', 'what']);

  const app = document.querySelector('#app');
  app.replaceChildren(el('h1', {}, '프로필 편집'),
    f.name.node, f.photo.node, f.updated.node, f.code.node, f.languageImage.node,
    contacts.node, about.node, career.node, awards.node, edu.node, lang.node);

  const save = async (msg) => {
    msg.textContent = '저장 중…';
    const next = {
      ...P, name: f.name.value(), title: P.title, photo: f.photo.value(),
      updated: f.updated.value(), skillsCode: f.code.value(),
      languageImage: f.languageImage.value(), contacts: contacts.value(),
      aboutMe: about.value(), career: career.value(), awards: awards.value(),
      education: edu.value(), language: lang.value(),
    };
    try { await saveProfile(next); location.reload(); }
    catch (e) { msg.textContent = e.message; }
  };
  editActions({ onSave: save, onCancel: () => location.reload() });
}

// Notion-style block editor orchestrator.
import { el } from '../../dom.js';
import { makeBlockEl, convertType, blockToData } from './factory.js';
import { createSlash } from './slash.js';
import { createToolbar } from './toolbar.js';
import { openBlockMenu } from './menu.js';
import { onKeydown } from './keys.js';
import { onInput } from './input.js';
import { placeCaret } from './caret.js';
import { editActions } from '../bar.js';
import { saveDetail, uploadImage, createPage } from '../api.js';

export function mountBlockEditor(slug, blocks) {
  window.__editing = true;
  const surface = el('div', { class: 'ne' });
  (blocks.length ? blocks : [{ type: 'paragraph', rich: [] }])
    .forEach((b) => surface.append(makeBlockEl(b)));

  const api = { slash: createSlash((t) => applySlash(t)), slashCtx: null };
  const toolbar = createToolbar();

  api.newAfter = (block, type = 'paragraph', html = '') => {
    const w = makeBlockEl({ type, rich: [] });
    block.after(w);
    const c = w.querySelector('.ne-content');
    if (c) { c.innerHTML = html; placeCaret(c, true); }
    return w;
  };
  api.remove = (block) => block.remove();
  api.convert = (block, type) => { const c = convertType(block, type); if (c) c.focus(); return c; };
  api.prevContent = (block) => {
    let p = block.previousElementSibling;
    while (p) { const c = p.querySelector('.ne-content'); if (c) return c; p = p.previousElementSibling; }
    return null;
  };
  api.mergeInto = (prev, content) => {
    placeCaret(prev, false);
    prev.insertAdjacentHTML('beforeend', content.innerHTML);
  };

  async function applySlash(t) {
    const ctx = api.slashCtx; api.slashCtx = null;
    if (!ctx) return;
    for (let i = 0; i < ctx.len; i += 1) document.execCommand('delete');
    const block = ctx.content.closest('.ne-block');
    if (t.action === 'page') {
      const name = (prompt('새 페이지 제목', '제목 없음') || '제목 없음').trim();
      const row = await createPage(name);
      const w = api.newAfter(block, 'paragraph', '');
      w.querySelector('.ne-content').innerHTML =
        `<a href="project.html?id=${row.id}">📄 ${name}</a>`;
      return;
    }
    if (t.type === 'divider') { api.convert(block, 'divider'); api.newAfter(block, 'paragraph', ''); }
    else { const c = api.convert(block, t.type); if (c) placeCaret(c, true); }
  }

  surface.addEventListener('keydown', (e) => onKeydown(e, api));
  surface.addEventListener('input', (e) => onInput(e, api));
  surface.addEventListener('change', async (e) => {
    const f = e.target.closest('.ne-file');
    if (!f || !f.files[0]) return;
    const block = f.closest('.ne-block');
    const r = await uploadImage(f.files[0]);
    block.dataset.src = r.src;
    const fig = block.querySelector('.ne-img');
    let img = fig.querySelector('img');
    if (!img) { img = el('img', { alt: '' }); fig.prepend(img); }
    img.src = r.src;
  });
  surface.addEventListener('click', (e) => {
    const add = e.target.closest('.ne-add');
    const handle = e.target.closest('.ne-handle');
    if (add) { const w = api.newAfter(add.closest('.ne-block'), 'paragraph', ''); w.querySelector('.ne-content').focus(); }
    else if (handle) openBlockMenu(handle.closest('.ne-block'), handle);
  });

  document.querySelector('#app').replaceChildren(
    el('a', { class: 'back', href: `project.html?id=${slug}` }, '← 보기로'),
    el('h1', {}, '본문 편집'),
    el('p', { class: 'muted ne-hint' }, "빈 줄에서 ‘/’ 입력 → 블록 메뉴 · 마크다운(#, -, 1., >, ``` , ---) 지원"),
    surface);
  document.body.append(api.slash.el, toolbar.el);

  const save = async (msg) => {
    msg.textContent = '저장 중…';
    const data = [...surface.querySelectorAll(':scope > .ne-block')].map(blockToData);
    try { await saveDetail(slug, data); location.href = `project.html?id=${slug}`; }
    catch (e) { msg.textContent = e.message; }
  };
  editActions({ onSave: save, onCancel: () => location.reload() });
}

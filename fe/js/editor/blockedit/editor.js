// Notion-style block editor orchestrator.
import { el } from '../../dom.js';
import { makeBlockEl, convertType, blockToData } from './factory.js';
import { createSlash } from './slash.js';
import { createToolbar } from './toolbar.js';
import { openBlockMenu } from './menu.js';
import { onKeydown } from './keys.js';
import { onInput } from './input.js';
import { enableDnd } from './dnd.js';
import { placeCaret } from './caret.js';
import { editActions } from '../bar.js';
import { saveDetail, uploadImage, createSubpage } from '../api.js';

export function mountBlockEditor(slug, blocks, opts = {}) {
  window.__editing = true;
  const back = opts.back || `project.html?id=${slug}`;
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
      // Notion처럼 현재 페이지 하위에 서브페이지를 만들고 child_page 블록을 삽입
      const name = (prompt('새 하위 페이지 제목', '제목 없음') || '제목 없음').trim();
      const sub = await createSubpage(name, slug);
      block.after(makeBlockEl({ type: 'child_page', title: name, slug: sub.slug }));
      return;
    }
    if (t.type === 'divider') { api.convert(block, 'divider'); api.newAfter(block, 'paragraph', ''); }
    else { const c = api.convert(block, t.type); if (c) placeCaret(c, true); }
  }

  // 이미지 드래그&드롭 / 클립보드 붙여넣기 → 업로드 후 이미지 블록 삽입
  async function insertImages(files, ref) {
    for (const f of files) {
      const r = await uploadImage(f);
      const w = makeBlockEl({ type: 'image', src: r.src });
      if (ref) ref.after(w); else surface.append(w);
      ref = w;
    }
  }
  surface.addEventListener('dragover', (e) => {
    if ([...e.dataTransfer.types].includes('Files')) e.preventDefault();
  });
  surface.addEventListener('drop', (e) => {
    const files = [...(e.dataTransfer.files || [])].filter((f) => f.type.startsWith('image/'));
    if (!files.length) return;
    e.preventDefault();
    insertImages(files, e.target.closest('.ne-block'));
  });
  surface.addEventListener('paste', (e) => {
    const files = [...(e.clipboardData.files || [])].filter((f) => f.type.startsWith('image/'));
    if (!files.length) return;
    e.preventDefault();
    insertImages(files, e.target.closest('.ne-block'));
  });

  enableDnd(surface);
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
    el('a', { class: 'back', href: back }, '← 보기로'),
    el('h1', {}, opts.title || '본문 편집'),
    opts.head || null,
    el('p', { class: 'muted ne-hint' }, "‘/’ 블록 메뉴 · 마크다운(#, -, 1., >, ```, ---) · Tab 들여쓰기 · ⠿ 드래그 정렬 · 선택 후 색상(A▾)"),
    surface);
  document.body.append(api.slash.el, toolbar.el);

  const save = async (msg) => {
    msg.textContent = '저장 중…';
    const data = [...surface.querySelectorAll(':scope > .ne-block')].map(blockToData);
    try {
      if (opts.onSave) await opts.onSave(data);
      else await saveDetail(slug, data);
      location.href = back;
    } catch (e) { msg.textContent = e.message; }
  };
  editActions({ onSave: save, onCancel: () => location.reload() });
}

// 동영상/임베드 블록 편집 UI — URL 입력 + 실시간 미리보기.
import { el } from '../../dom.js';
import { mediaEl } from '../../notion/media.js';
import { spansToHtml, htmlToSpans } from './model.js';

function build(type, b, placeholder) {
  const prev = el('div', { class: 'ne-media__prev' });
  const input = el('input', { class: 'f-in ne-media__url', value: b.url || '', placeholder });
  const render = () => {
    prev.replaceChildren();
    const m = mediaEl(input.value.trim());
    if (m) prev.append(m);
  };
  input.addEventListener('change', render);
  render();
  const wrap = el('div', { class: 'ne-media', dataset: { mtype: type } },
    el('div', { class: 'ne-media__bar' }, type === 'video' ? '🎬' : '🌐', input), prev);
  if (type === 'video') {
    wrap.append(el('span', {
      class: 'ne-cap', contenteditable: 'true', 'data-ph': '캡션…',
      html: b.caption ? spansToHtml(b.caption) : '',
    }));
  }
  return wrap;
}

export const buildVideo = (b) => build('video', b, 'YouTube / Vimeo / mp4 URL');
export const buildEmbed = (b) => build('embed', b, '임베드할 URL (iframe)');

export function serMedia(main, type) {
  const w = main.querySelector('.ne-media');
  const b = { type, url: w.querySelector('.ne-media__url').value.trim() };
  const cap = w.querySelector('.ne-cap');
  if (cap) {
    const cs = htmlToSpans(cap);
    if (cs.length) b.caption = cs;
  }
  return b;
}

// 동영상/임베드 URL → 재생 가능한 DOM 노드 (렌더러·에디터 미리보기 공용).
import { el } from '../dom.js';

function ytId(url) {
  const m = url.match(/(?:youtube\.com\/(?:watch\?[^#]*v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : null;
}

function vimeoId(url) {
  const m = url.match(/vimeo\.com\/(\d+)/);
  return m ? m[1] : null;
}

function frame(src) {
  return el('div', { class: 'nb-embed' },
    el('iframe', {
      src, loading: 'lazy', allowfullscreen: 'allowfullscreen',
      allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
    }));
}

// URL 종류에 맞는 플레이어/iframe 노드를 만든다. 알 수 없으면 일반 iframe.
export function mediaEl(url) {
  if (!url) return null;
  const yt = ytId(url);
  if (yt) return frame(`https://www.youtube.com/embed/${yt}`);
  const vm = vimeoId(url);
  if (vm) return frame(`https://player.vimeo.com/video/${vm}`);
  if (/\.(mp4|webm|mov)(\?|$)/i.test(url))
    return el('video', { class: 'nb-video', src: url, controls: 'controls', preload: 'metadata' });
  return frame(url);
}

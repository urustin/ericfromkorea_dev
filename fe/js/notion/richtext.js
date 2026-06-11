// Render Notion rich-text spans into DOM nodes.
import { el } from '../dom.js';

const WRAP = {
  bold: 'strong', italic: 'em', strikethrough: 's', underline: 'u', code: 'code',
};

function colorStyle(color) {
  if (!color) return null;
  if (color.endsWith('_background')) {
    const c = color.replace('_background', '');
    return { background: `var(--b-${c})`, padding: '0 4px', borderRadius: '3px' };
  }
  return { color: `var(--t-${color})` };
}

// Text -> fragment with <br> for newlines (Notion soft line breaks).
function textNode(text) {
  if (!text.includes('\n')) return document.createTextNode(text);
  const frag = document.createDocumentFragment();
  text.split('\n').forEach((part, i) => {
    if (i) frag.append(el('br'));
    if (part) frag.append(document.createTextNode(part));
  });
  return frag;
}

// One span -> node, applying nested annotation wrappers.
function span(s) {
  let node = textNode(s.text);
  for (const [flag, tag] of Object.entries(WRAP)) {
    if (s[flag]) {
      const w = el(tag, tag === 'code' ? { class: 'inline' } : {});
      w.append(node);
      node = w;
    }
  }
  const style = colorStyle(s.color);
  if (style) {
    const w = el('span', { style });
    w.append(node);
    node = w;
  }
  if (s.href) {
    const a = el('a', { class: 'link', href: s.href, target: '_blank', rel: 'noopener' });
    a.append(node);
    node = a;
  }
  return node;
}

// spans[] -> array of nodes (safe to spread into el()).
export function richText(spans) {
  if (!spans || !spans.length) return [];
  return spans.map(span);
}

// Input handling: slash-menu query tracking + markdown shortcuts.
import { TYPES, byMd } from './model.js';
import { textBeforeCaret, placeCaret } from './caret.js';

const MD = TYPES.filter((t) => t.md);

// Returns true if a markdown trigger fired (block converted).
function tryMarkdown(content, block, api) {
  const txt = content.textContent.replace(/ /g, ' ');
  for (const t of MD) {
    if (txt === `${t.md} `) {
      content.innerHTML = '';
      if (t.type === 'divider') {
        api.convert(block, 'divider');
        api.newAfter(block, 'paragraph', '');
      } else {
        const c = api.convert(block, t.type);
        if (c) placeCaret(c, true);
      }
      return true;
    }
  }
  return false;
}

export function onInput(e, api) {
  const content = e.target.closest && e.target.closest('.ne-content');
  if (!content || content.classList.contains('ne-code')) return;
  if (tryMarkdown(content, content.closest('.ne-block'), api)) return;

  const before = textBeforeCaret(content);
  const m = before.match(/\/([^\s/]*)$/);
  if (m) {
    const rect = getSelection().getRangeAt(0).getBoundingClientRect();
    if (api.slash.isOpen()) api.slash.setQuery(m[1]);
    else api.slash.open(rect, m[1]);
    api.slashCtx = { content, len: m[0].length };
  } else if (api.slash.isOpen()) {
    api.slash.close();
  }
}

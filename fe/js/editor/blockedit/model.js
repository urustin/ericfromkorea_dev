// Block type metadata + rich-text <-> editable-HTML serialization.

// Slash menu / markdown definitions. `cmd` words are matched by the slash filter.
export const TYPES = [
  { type: 'paragraph', label: '텍스트', icon: '¶', cmd: 'text 텍스트 문단 paragraph', md: null },
  { type: 'heading_1', label: '제목 1', icon: 'H1', cmd: 'h1 heading title 제목1 제목', md: '#' },
  { type: 'heading_2', label: '제목 2', icon: 'H2', cmd: 'h2 heading 제목2 제목', md: '##' },
  { type: 'heading_3', label: '제목 3', icon: 'H3', cmd: 'h3 heading 제목3 제목', md: '###' },
  { type: 'bulleted_list_item', label: '글머리 목록', icon: '•', cmd: 'bullet ul list 목록 글머리', md: '-' },
  { type: 'numbered_list_item', label: '번호 목록', icon: '1.', cmd: 'number ol 번호 목록', md: '1.' },
  { type: 'to_do', label: '할 일 목록', icon: '☑', cmd: 'todo check 할일 체크 태스크', md: '[]' },
  { type: 'toggle', label: '토글', icon: '▸', cmd: 'toggle 토글 접기', md: null },
  { type: 'quote', label: '인용', icon: '❝', cmd: 'quote 인용', md: '>' },
  { type: 'callout', label: '콜아웃', icon: '💡', cmd: 'callout 콜아웃 강조', md: null },
  { type: 'code', label: '코드', icon: '</>', cmd: 'code 코드', md: '```' },
  { type: 'divider', label: '구분선', icon: '—', cmd: 'divider hr 구분선', md: '---' },
  { type: 'image', label: '이미지', icon: '🖼', cmd: 'image 이미지 사진 그림', md: null },
  { type: 'table', label: '표', icon: '▦', cmd: 'table 표 테이블', md: null },
  { type: 'column_list', label: '2단 컬럼', icon: '⫼', cmd: 'column 컬럼 단 분할', md: null },
  { type: 'bookmark', label: '북마크', icon: '🔖', cmd: 'bookmark 북마크 링크 url', md: null },
];
export const EDITSET = new Set(TYPES.map((t) => t.type));
export const byMd = (s) => TYPES.find((t) => t.md === s);

// Notion color palette (text + background variants share these names).
export const COLORS = ['gray', 'brown', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'red'];

const TAG = { bold: 'strong', italic: 'em', strikethrough: 's', underline: 'u', code: 'code' };

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// spans[] -> innerHTML for a contenteditable element.
export function spansToHtml(spans) {
  if (!spans || !spans.length) return '';
  return spans.map((s) => {
    let t = esc(s.text).replace(/\n/g, '<br>');
    for (const k in TAG) if (s[k]) t = `<${TAG[k]}>${t}</${TAG[k]}>`;
    if (s.color) {
      const attr = s.color.endsWith('_background')
        ? `data-bg="${s.color.replace('_background', '')}"` : `data-c="${s.color}"`;
      t = `<span ${attr}>${t}</span>`;
    }
    if (s.href) t = `<a href="${esc(s.href).replace(/"/g, '&quot;')}">${t}</a>`;
    return t;
  }).join('');
}

function walk(node, marks, out) {
  for (const ch of node.childNodes) {
    if (ch.nodeType === 3) {
      if (ch.nodeValue) out.push({ text: ch.nodeValue, ...marks });
    } else if (ch.nodeType === 1) {
      const tag = ch.tagName.toLowerCase();
      if (tag === 'br') { out.push({ text: '\n', ...marks }); continue; }
      const m = { ...marks };
      if (tag === 'strong' || tag === 'b') m.bold = true;
      if (tag === 'em' || tag === 'i') m.italic = true;
      if (tag === 's' || tag === 'strike' || tag === 'del') m.strikethrough = true;
      if (tag === 'u') m.underline = true;
      if (tag === 'code') m.code = true;
      if (ch.dataset && ch.dataset.c) m.color = ch.dataset.c;
      if (ch.dataset && ch.dataset.bg) m.color = `${ch.dataset.bg}_background`;
      if (tag === 'a') {
        const sub = []; walk(ch, m, sub);
        const href = ch.getAttribute('href'); sub.forEach((x) => { x.href = href; });
        out.push(...sub);
      } else walk(ch, m, out);
    }
  }
}

// contenteditable element -> spans[] (Notion rich-text flat form).
export function htmlToSpans(elm) {
  const out = [];
  walk(elm, {}, out);
  return out.filter((s) => s.text !== '');
}

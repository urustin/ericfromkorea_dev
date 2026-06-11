// Reusable UI components shared across pages.
import { el } from './dom.js';

// Notion color -> CSS variable pair for tags/pills.
function colorVars(color) {
  const c = color || 'default';
  return { '--tag-ink': `var(--t-${c})`, '--tag-bg': `var(--b-${c})` };
}

// A small rounded tag (used for skills / multi-select).
export function tag(label, color) {
  return el('span', { class: 'tag', style: colorVars(color) }, label);
}

// A status pill with a leading dot.
export function statusPill(label, color) {
  if (!label) return el('span', { class: 'muted' }, '—');
  return el('span', { class: 'pill', style: colorVars(color) },
    el('span', { class: 'dot' }), label);
}

// A row of skill tags from an array of {name,color}.
export function tagRow(items) {
  if (!items || !items.length) return el('span', { class: 'muted' }, '—');
  return el('div', { class: 'tag-row' }, items.map((s) => tag(s.name, s.color)));
}

// Contact paragraph: icon + (optional link) text.
export function contactRow({ icon, text, href }) {
  const body = href
    ? el('a', { class: 'link', href, target: '_blank', rel: 'noopener' }, text)
    : text;
  return el('p', {}, `${icon}  `, body);
}

// Timeline entry: "<when> | <what>".
export function entry(when, what) {
  return el('p', { class: 'entry' },
    when ? el('span', { class: 'when' }, when) : null, what);
}

// Project preview card linking to the project detail page.
export function projectCard(p) {
  return el('a', { class: 'project-card', href: `project.html?id=${p.id}` },
    el('h4', {}, p.name),
    el('div', { class: 'summary' }, p.summary || ''),
    tagRow(p.skills));
}

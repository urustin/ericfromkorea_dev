// Async data loaders. Editable JSON is the source of truth at runtime.
import { skill } from './skillColors.js';

// Always cache-bust JSON so edits are reflected immediately after save.
const bust = () => `?t=${Date.now()}`;

export async function getProfile() {
  const res = await fetch(`js/data/profile.json${bust()}`);
  return res.json();
}

// Projects with skills resolved to {name,color} for rendering.
export async function getProjects() {
  const res = await fetch(`js/data/projects.json${bust()}`);
  const rows = await res.json();
  return rows.map((p) => ({ ...p, skills: (p.skills || []).map(skill) }));
}

// Raw project rows (skills as plain names) — for the editor.
export async function getProjectsRaw() {
  const res = await fetch(`js/data/projects.json${bust()}`);
  return res.json();
}

export async function getDetail(slug) {
  const res = await fetch(`js/data/details/${slug}.json${bust()}`);
  return res.ok ? res.json() : [];
}

// 서브페이지 레지스트리 {slug: {title, parent}}
export async function getSubpages() {
  const res = await fetch(`js/data/subpages.json${bust()}`).catch(() => null);
  return res && res.ok ? res.json() : {};
}

// Editor API calls — each PUTs a whole resource; backend overwrites the file.
import { authedFetch } from './auth.js';

async function put(path, data) {
  const res = await authedFetch(path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('저장 실패: ' + res.status);
  return res.json().catch(() => ({}));
}

export const saveProfile = (profile) => put('api/profile', profile);
export const saveProjects = (rows) => put('api/projects', rows);
export const saveDetail = (slug, blocks) => put(`api/detail/${slug}`, blocks);

// Create a subpage under a project detail. Returns { slug, title }.
export async function createSubpage(title, parent) {
  const res = await authedFetch('api/subpage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, parent }),
  });
  if (!res.ok) throw new Error('서브페이지 생성 실패: ' + res.status);
  return res.json();
}

// Create a new page (project row + empty detail). Returns the new row.
export async function createPage(name = '') {
  const res = await authedFetch('api/page', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error('페이지 생성 실패: ' + res.status);
  return res.json();
}

// Upload an image File; returns { src } relative path under assets/.
export async function uploadImage(file) {
  const res = await authedFetch(`api/upload?name=${encodeURIComponent(file.name)}`, {
    method: 'POST',
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
    body: file,
  });
  if (!res.ok) throw new Error('업로드 실패: ' + res.status);
  return res.json();
}

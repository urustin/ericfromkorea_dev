// Login page controller.
import { login, isAuthed } from './editor/auth.js';

const next = new URLSearchParams(location.search).get('next') || 'portfolio.html';
if (isAuthed()) location.replace(next);

const form = document.getElementById('form');
const pw = document.getElementById('pw');
const err = document.getElementById('err');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  err.textContent = '';
  const btn = form.querySelector('button');
  btn.disabled = true;
  btn.textContent = '확인 중…';
  try {
    const r = await login(pw.value);
    if (r.ok) location.replace(next);
    else { err.textContent = r.error; pw.value = ''; }
  } catch (e2) {
    err.textContent = '서버에 연결할 수 없습니다.';
  } finally {
    btn.disabled = false;
    btn.textContent = '로그인';
  }
});

// Client-side auth: 24h token in localStorage, attached as Bearer header.
const KEY = 'pf_session';

export function getSession() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || 'null');
  } catch {
    return null;
  }
}

export function isAuthed() {
  const s = getSession();
  return !!(s && s.token && s.exp && s.exp * 1000 > Date.now());
}

function setSession(s) {
  localStorage.setItem(KEY, JSON.stringify(s));
}

export function logout() {
  localStorage.removeItem(KEY);
}

// Returns {ok, error}. On success stores the session.
export async function login(password) {
  const res = await fetch('api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) return { ok: false, error: (await res.json().catch(() => ({}))).error || '로그인 실패' };
  setSession(await res.json());
  return { ok: true };
}

// fetch() with the Bearer token; throws on 401 so callers can react.
export async function authedFetch(url, opts = {}) {
  const s = getSession();
  const headers = { ...(opts.headers || {}), Authorization: `Bearer ${s ? s.token : ''}` };
  const res = await fetch(url, { ...opts, headers });
  if (res.status === 401) {
    logout();
    throw new Error('세션이 만료되었습니다. 다시 로그인해 주세요.');
  }
  return res;
}

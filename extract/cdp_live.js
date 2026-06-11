// Live end-to-end: login -> edit mode -> slash /h1 on a fresh block. No save.
const BASE = 'https://dev.ericfromkorea.com';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function pageWs() {
  const list = await (await fetch('http://localhost:9222/json')).json();
  return list.find((t) => t.type === 'page').webSocketDebuggerUrl;
}
function rpc(ws) {
  let id = 0; const w = new Map();
  ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id && w.has(m.id)) { w.get(m.id)(m.result); w.delete(m.id); } });
  return (method, params = {}) => new Promise((res) => { const i = ++id; w.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
}

async function main() {
  const r = await (await fetch(`${BASE}/api/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: 'asdf' }) })).json();
  const ws = new WebSocket(await pageWs());
  await new Promise((ok) => { ws.onopen = ok; });
  const send = rpc(ws);
  await send('Page.enable'); await send('Runtime.enable');
  const go = async (url) => { await send('Page.navigate', { url }); await sleep(2500); };
  const ev = (e) => send('Runtime.evaluate', { expression: e, returnByValue: true });

  await go(`${BASE}/project.html?id=agent-mcp-rag`);
  await ev(`localStorage.setItem('pf_session', JSON.stringify({token:${JSON.stringify(r.token)},exp:${r.exp}}))`);
  await go(`${BASE}/project.html?id=agent-mcp-rag`);
  const hasBar = (await ev(`!!document.querySelector('.edit-bar .btn--primary')`)).result.value;
  await ev(`document.querySelector('.edit-bar .btn--primary').click()`);
  await sleep(1500);
  const inEditor = (await ev(`!!document.querySelector('.ne')`)).result.value;
  // add a fresh block and slash it
  await ev(`(()=>{const a=document.querySelector('.ne-add');a.click();})()`);
  await sleep(300);
  await ev(`(()=>{const b=document.querySelectorAll('.ne-block');const c=b[1].querySelector('.ne-content');c.focus();const r=document.createRange();r.selectNodeContents(c);r.collapse(true);getSelection().removeAllRanges();getSelection().addRange(r);})()`);
  await send('Input.insertText', { text: '/h1' });
  await sleep(300);
  await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Enter', windowsVirtualKeyCode: 13 });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', windowsVirtualKeyCode: 13 });
  await sleep(300);
  const t = (await ev(`document.querySelectorAll('.ne-block')[1].dataset.type`)).result.value;
  console.log(JSON.stringify({ hasBar, inEditor, slash: t }));
  ws.close();
}
main().catch((e) => { console.error(e); process.exit(1); });

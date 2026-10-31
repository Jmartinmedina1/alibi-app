// Plays a full multiplayer game against the local server with N scripted players.
const BASE = process.env.BASE || 'http://127.0.0.1:8787';
const N = Number(process.env.N || 4);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const host = { id: 'p0', name: 'Host', emoji: '🦊' };
const res = await fetch(BASE + '/api/rooms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ host, settings: { rounds: 2, pack: process.env.PACK || 'party' } }) });
const { code } = await res.json();
console.log('room', code);
let problems = 0; const t0 = Date.now();
const clients = [];
function connect(i) {
  return new Promise((resolve) => {
    const ws = new WebSocket(`${BASE.replace('http', 'ws')}/api/rooms/${code}/ws?pid=p${i}&name=P${i}&emoji=%F0%9F%A6%8A`);
    const c = { i, ws, view: null, acted: '' };
    ws.onmessage = (e) => {
      const m = JSON.parse(e.data);
      if (m.t === 'error') { console.log(`p${i} error`, m.error); }
      if (m.t === 'view') { c.view = m.view; check(c); act(c); }
    };
    ws.onopen = () => resolve(c);
  });
}
function check(c) {
  const v = c.view;
  if (v.role === 'liar' && !['result', 'gameover'].includes(v.phase) && v.locationId) { problems++; console.log('LEAK: liar has locationId in', v.phase); }
  if (v.role === 'liar' && v.current?.options?.some((o) => 'real' in o)) { problems++; console.log('LEAK: liar options have real flags'); }
  if (!['reveal', 'guess', 'result', 'gameover'].includes(v.phase) && v.liarId) { problems++; console.log('LEAK: liarId before reveal'); }
}
async function act(c) {
  const v = c.view; const me = v.me;
  const key = v.rev + ':' + v.phase; if (c.acted === key) return; c.acted = key;
  await sleep(150 + Math.random() * 500);
  if (c.view.rev !== v.rev) return; // stale
  const send = (action) => c.ws.send(JSON.stringify({ t: 'act', action }));
  const meP = v.players.find((p) => p.id === me);
  switch (v.phase) {
    case 'lobby': if (me === v.hostId && v.players.length === N) send({ type: 'start' }); break;
    case 'intro': case 'case': case 'reveal': case 'result': if (!meP.ready) send({ type: 'ready' }); break;
    case 'pick': if (v.allowedTargets) send({ type: 'pickTarget', targetId: v.allowedTargets[0], topic: v.current.topicChoices[1] }); break;
    case 'answer': if (v.current?.options) send({ type: 'answer', cardId: v.current.options[Math.floor(Math.random() * 6)].id }); break;
    case 'react': if (v.current?.targetId !== me && !v.current?.reactions[me]) send({ type: 'react', reaction: 'sus' }); break;
    case 'vote': if (!v.myVote) send({ type: 'vote', targetId: v.players.find((p) => p.id !== me).id }); break;
    case 'objection': if (v.accusedId === me && v.excuseIdx == null) send({ type: 'excuse', idx: v.excuseChoices[0] }); break;
    case 'guess': if (v.guessChoices && v.liarId === me) send({ type: 'guess', locationId: v.guessChoices[0] }); break;
  }
}
for (let i = 0; i < N; i++) clients.push(await connect(i));
const phases = new Set();
while (Date.now() - t0 < 240000) {
  await sleep(500);
  const v = clients[0].view; if (v) phases.add(v.phase);
  if (v?.phase === 'gameover') break;
}
const v = clients[0].view;
console.log('final phase', v?.phase, 'seconds', ((Date.now() - t0) / 1000).toFixed(0));
console.log('phases seen', [...phases].join(','));
console.log('scores', v?.players.map((p) => p.name + ':' + p.score).join(' '));
console.log('awards', JSON.stringify(v?.awards));
console.log(problems ? problems + ' PROBLEMS' : 'NO LEAKS');
clients.forEach((c) => c.ws.close());
process.exit(v?.phase === 'gameover' && !problems ? 0 : 1);

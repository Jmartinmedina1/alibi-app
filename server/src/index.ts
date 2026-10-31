// ALIBI game server: a Cloudflare Worker + one Durable Object per room.
// The room runs the shared engine and sends every player only their own view.

import { DurableObject } from 'cloudflare:workers';
import {
  addPlayer,
  apply,
  createGame,
  GameError,
  gameSummary,
  leave,
  validSettings,
  nextWake,
  setConnected,
  tick,
} from '../../app/src/engine/engine';
import { viewFor } from '../../app/src/engine/view';
import type { Action, Game, Settings } from '../../app/src/engine/types';

export interface Env {
  ROOMS: DurableObjectNamespace<Room>;
}

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
// Keep room codes family-friendly.
const BLOCKED = new Set(['DAMN', 'HELL', 'SHIT', 'FUCK', 'PISS', 'CUNT', 'DICK', 'COCK', 'TITS', 'SLUT', 'PUTA', 'PUTO', 'CACA', 'PEDO', 'CULO', 'MOCO', 'NAZI', 'KILL', 'DEAD', 'SEXY', 'ANAL', 'PORN']);

function randomCode(): string {
  for (;;) {
    let c = '';
    const bytes = crypto.getRandomValues(new Uint8Array(4));
    for (const b of bytes) c += CODE_ALPHABET[b % CODE_ALPHABET.length];
    if (!BLOCKED.has(c)) return c;
  }
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...CORS } });

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });

    if (url.pathname === '/api/health') return json({ ok: true });

    // A player reports another player's name. Kept in the Worker logs for review; no account data exists.
    if (url.pathname === '/api/report' && request.method === 'POST') {
      const b = (await request.json().catch(() => ({}))) as Record<string, unknown>;
      const str = (x: unknown, n: number) => String(x ?? '').slice(0, n);
      console.log(JSON.stringify({ event: 'report', code: str(b.code, 4), name: str(b.name, 24), reason: str(b.reason, 40), at: new Date().toISOString() }));
      return json({ ok: true });
    }

    // Anonymous end-of-game numbers from Practice games (they run on the device).
    if (url.pathname === '/api/event' && request.method === 'POST') {
      const b = (await request.json().catch(() => ({}))) as Record<string, unknown>;
      const allowed = ['players', 'humans', 'bots', 'rounds', 'pack', 'difficulty', 'joker', 'pace', 'practice', 'coach', 'liarCaught', 'liarEscaped', 'humanLiarEscaped', 'humanLiarRounds', 'minutes'];
      const clean: Record<string, unknown> = { event: 'game_end' };
      for (const k of allowed) if (k in b && ['number', 'string', 'boolean'].includes(typeof b[k])) clean[k] = typeof b[k] === 'string' ? String(b[k]).slice(0, 12) : b[k];
      console.log(JSON.stringify(clean));
      return json({ ok: true });
    }

    if (url.pathname === '/api/rooms' && request.method === 'POST') {
      const body = (await request.json().catch(() => ({}))) as {
        host?: { id: string; name: string; emoji: string };
        settings?: Partial<Settings>;
      };
      if (!body.host?.id) return json({ error: 'missing_host' }, 400);
      for (let attempt = 0; attempt < 8; attempt++) {
        const code = randomCode();
        const stub = env.ROOMS.get(env.ROOMS.idFromName(code));
        const res = await stub.init(code, body.host, body.settings ?? {});
        if (res.ok) return json({ code });
      }
      return json({ error: 'no_code' }, 503);
    }

    const m = url.pathname.match(/^\/api\/rooms\/([A-Z]{4})(\/ws)?$/);
    if (m) {
      const stub = env.ROOMS.get(env.ROOMS.idFromName(m[1]));
      if (m[2]) {
        if (request.headers.get('Upgrade') !== 'websocket') return json({ error: 'expected_websocket' }, 426);
        return stub.fetch(request);
      }
      return json(await stub.info());
    }
    return json({ error: 'not_found' }, 404);
  },
};

const ROOM_TTL_MS = 6 * 60 * 60 * 1000;

export class Room extends DurableObject<Env> {
  private game: Game | null | undefined;

  private async load(): Promise<Game | null> {
    if (this.game === undefined) this.game = (await this.ctx.storage.get<Game>('game')) ?? null;
    return this.game;
  }

  private async save(g: Game) {
    if (g.phase === 'gameover' && !g.endLogged) {
      // Anonymous balancing numbers, readable in the Worker logs.
      g.endLogged = true;
      const minutes = g.startedAt ? Math.round((Date.now() - g.startedAt) / 6000) / 10 : null;
      console.log(JSON.stringify({ event: 'game_end', ...gameSummary(g), minutes }));
    }
    this.game = g;
    await this.ctx.storage.put('game', g);
    await this.ctx.storage.put('touched', Date.now());
    const wake = nextWake(g);
    await this.ctx.storage.setAlarm(wake ?? Date.now() + ROOM_TTL_MS);
  }

  async init(code: string, host: { id: string; name: string; emoji: string }, settings: Partial<Settings>) {
    if (await this.load()) return { ok: false };
    const g = createGame({ code, host, settings: { ...validSettings(settings), practice: false }, now: Date.now() });
    await this.save(g);
    return { ok: true };
  }

  async info() {
    const g = await this.load();
    if (!g) return { exists: false };
    return {
      exists: true,
      phase: g.phase,
      players: g.players.length,
      pack: g.settings.pack,
      // Mid-game arrivals can join too: they watch and play from the next round.
      joinable: g.players.length + (g.waiting?.length ?? 0) < 8,
    };
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const pid = url.searchParams.get('pid') ?? '';
    const name = (url.searchParams.get('name') ?? '').slice(0, 18);
    const emoji = url.searchParams.get('emoji') ?? '🦊';
    const { 0: client, 1: server } = new WebSocketPair();
    this.ctx.acceptWebSocket(server, [pid]);
    server.serializeAttachment({ pid });

    const g = await this.load();
    const now = Date.now();
    if (!g) {
      server.send(JSON.stringify({ t: 'error', error: 'room_not_found' }));
      server.close(4404, 'room_not_found');
    } else if (!pid) {
      server.close(4400, 'missing_pid');
    } else {
      try {
        addPlayer(g, { id: pid, name, emoji });
        tick(g, now);
        await this.save(g);
        this.broadcast(g);
      } catch (e) {
        const error = e instanceof GameError ? e.message : 'join_failed';
        server.send(JSON.stringify({ t: 'error', error }));
        server.close(4409, error);
      }
    }
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    const { pid } = ws.deserializeAttachment() as { pid: string };
    let msg: { t: string; action?: Action; rev?: number };
    try {
      msg = JSON.parse(typeof message === 'string' ? message : new TextDecoder().decode(message));
    } catch {
      return;
    }
    const g = await this.load();
    if (!g) return;
    const now = Date.now();
    if (msg.t === 'ping') {
      ws.send(JSON.stringify({ t: 'pong', serverNow: now }));
      return;
    }
    try {
      if (msg.t === 'act' && msg.action) apply(g, pid, msg.action, now);
      if (msg.action?.type === 'kick') {
        // Close the kicked player's connections right away.
        for (const s of this.ctx.getWebSockets(msg.action.playerId)) {
          try {
            s.send(JSON.stringify({ t: 'error', error: 'kicked' }));
            s.close(4403, 'kicked');
          } catch {
            /* already closed */
          }
        }
      }
      else if (msg.t === 'leave') {
        leave(g, pid);
        ws.close(1000, 'left');
      }
      tick(g, now);
      await this.save(g);
      this.broadcast(g);
    } catch (e) {
      const error = e instanceof GameError ? e.message : 'action_failed';
      ws.send(JSON.stringify({ t: 'error', error }));
      // Always resend the truth so a stale client resyncs.
      ws.send(JSON.stringify({ t: 'view', view: viewFor(g, pid, now) }));
    }
  }

  async webSocketClose(ws: WebSocket) {
    await this.disconnect(ws);
  }

  async webSocketError(ws: WebSocket) {
    await this.disconnect(ws);
  }

  private async disconnect(ws: WebSocket) {
    const { pid } = (ws.deserializeAttachment() ?? {}) as { pid?: string };
    const g = await this.load();
    if (!g || !pid) return;
    const stillOpen = this.ctx.getWebSockets(pid).some((s) => s !== ws && s.readyState === WebSocket.OPEN);
    if (stillOpen) return;
    setConnected(g, pid, false);
    tick(g, Date.now());
    await this.save(g);
    this.broadcast(g);
  }

  async alarm() {
    const g = await this.load();
    if (!g) return;
    const touched = (await this.ctx.storage.get<number>('touched')) ?? 0;
    if (Date.now() - touched > ROOM_TTL_MS && this.ctx.getWebSockets().length === 0) {
      await this.ctx.storage.deleteAll();
      this.game = null;
      return;
    }
    tick(g, Date.now());
    await this.save(g);
    this.broadcast(g);
  }

  private broadcast(g: Game) {
    const now = Date.now();
    for (const ws of this.ctx.getWebSockets()) {
      const { pid } = ws.deserializeAttachment() as { pid: string };
      try {
        ws.send(JSON.stringify({ t: 'view', view: viewFor(g, pid, now) }));
      } catch {
        /* socket closing */
      }
    }
  }
}

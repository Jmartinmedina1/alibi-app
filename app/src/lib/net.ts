import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import type { Action, Settings } from '../engine/types';
import type { View } from '../engine/view';
import { LIVE_SERVER } from './config';
import type { Profile } from './profile';

/** Where the game server lives. On the web build served by the server itself, use the same origin. */
export function serverUrl(): string {
  const env = process.env.EXPO_PUBLIC_SERVER_URL;
  if (env) return env.replace(/\/$/, '');
  if (Platform.OS === 'web' && typeof location !== 'undefined' && !/:(8081|19006)$/.test(location.host)) {
    return location.origin;
  }
  // Local server only while developing; installed apps (TestFlight, stores) use the live server.
  return __DEV__ ? 'http://127.0.0.1:8787' : LIVE_SERVER;
}

export async function createRoom(host: Profile, settings: Partial<Settings>): Promise<string> {
  const res = await fetch(serverUrl() + '/api/rooms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ host: { id: host.id, name: host.name, emoji: host.emoji }, settings }),
  });
  if (!res.ok) throw new Error('create_failed');
  return (await res.json()).code;
}

export async function roomInfo(code: string): Promise<{ exists: boolean; joinable?: boolean; phase?: string }> {
  const res = await fetch(serverUrl() + '/api/rooms/' + code);
  return res.json();
}

export type Status = 'connecting' | 'open' | 'reconnecting' | 'closed' | 'error';

export interface GameConn {
  view: View | null;
  status: Status;
  error?: string;
  /** server time minus local time, so countdowns match on every phone */
  offset: number;
  send: (a: Action) => void;
  leave: () => void;
}

export function useRoom(code: string, profile: Profile | null): GameConn {
  const [view, setView] = useState<View | null>(null);
  const [status, setStatus] = useState<Status>('connecting');
  const [error, setError] = useState<string>();
  const [offset, setOffset] = useState(0);
  const ws = useRef<WebSocket | null>(null);
  const closedByUs = useRef(false);
  const retries = useRef(0);
  const lastRev = useRef(0);

  const connect = useCallback(() => {
    if (!profile) return;
    const base = serverUrl().replace(/^http/, 'ws');
    const q = `pid=${encodeURIComponent(profile.id)}&name=${encodeURIComponent(profile.name)}&emoji=${encodeURIComponent(profile.emoji)}`;
    const sock = new WebSocket(`${base}/api/rooms/${code}/ws?${q}`);
    ws.current = sock;
    sock.onopen = () => {
      retries.current = 0;
      setStatus('open');
    };
    sock.onmessage = (e) => {
      let m: any;
      try {
        m = JSON.parse(String(e.data));
      } catch {
        return;
      }
      if (m.t === 'view') {
        // Ignore anything older than what we have (out-of-order delivery).
        if (m.view.rev < lastRev.current && m.view.phase !== 'lobby') return;
        lastRev.current = m.view.rev;
        setOffset(m.view.serverNow - Date.now());
        setView(m.view);
      } else if (m.t === 'error') {
        if (['room_not_found', 'game_in_progress', 'room_full', 'missing_pid', 'kicked'].includes(m.error)) {
          setError(m.error);
          setStatus('error');
          closedByUs.current = true;
        }
      }
    };
    sock.onclose = () => {
      if (closedByUs.current) {
        setStatus((s) => (s === 'error' ? s : 'closed'));
        return;
      }
      setStatus('reconnecting');
      const delay = Math.min(5000, 400 * 2 ** retries.current++);
      setTimeout(connect, delay);
    };
  }, [code, profile]);

  useEffect(() => {
    closedByUs.current = false;
    connect();
    return () => {
      closedByUs.current = true;
      ws.current?.close();
    };
  }, [connect]);

  const send = useCallback((action: Action) => {
    const s = ws.current;
    if (s && s.readyState === WebSocket.OPEN) s.send(JSON.stringify({ t: 'act', action }));
  }, []);

  const leave = useCallback(() => {
    closedByUs.current = true;
    const s = ws.current;
    if (s && s.readyState === WebSocket.OPEN) s.send(JSON.stringify({ t: 'leave' }));
    setTimeout(() => s?.close(), 150);
  }, []);

  return { view, status, error, offset, send, leave };
}

/** Report another player's name (kept in the server logs for review). */
export function reportName(code: string, name: string, reason = 'name') {
  return fetch(serverUrl() + '/api/report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, name, reason }),
  }).catch(() => {});
}

/** Anonymous end-of-game numbers (Practice games run on the device). */
export function sendGameEvent(summary: Record<string, unknown>) {
  return fetch(serverUrl() + '/api/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(summary),
  }).catch(() => {});
}

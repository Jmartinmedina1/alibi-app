import { useCallback, useEffect, useRef, useState } from 'react';
import { addBot, apply, createGame, gameSummary, tick } from '../engine/engine';
import type { Action, Difficulty, Pace, Pack } from '../engine/types';
import { viewFor, type View } from '../engine/view';
import { sendGameEvent, type GameConn } from './net';
import type { Profile } from './profile';

/** Practice: the same engine runs on the phone, with 3 bots. No network needed. */
export function usePractice(profile: Profile, opts: { pack: Pack; startAsLiar: boolean; difficulty?: Difficulty; joker?: boolean; pace?: Pace; coach?: boolean; firstGame?: boolean }): GameConn {
  const game = useRef(
    (() => {
      const now = Date.now();
      const g = createGame({
        code: 'SOLO',
        host: { id: profile.id, name: profile.name, emoji: profile.emoji },
        settings: { practice: true, pack: opts.pack, rounds: 2, startAsLiar: opts.startAsLiar, difficulty: opts.difficulty ?? 'medium', joker: !!opts.joker, pace: opts.pace ?? 'relaxed', coach: !!opts.coach, firstGame: !!opts.firstGame },
        now,
      });
      addBot(g);
      addBot(g);
      addBot(g);
      apply(g, profile.id, { type: 'start' }, now);
      return g;
    })(),
  );
  const [view, setView] = useState<View>(() => viewFor(game.current, profile.id, Date.now()));
  const lastRev = useRef(0);

  const publish = useCallback(() => {
    const g = game.current;
    if (g.rev !== lastRev.current) {
      lastRev.current = g.rev;
      setView(viewFor(g, profile.id, Date.now()));
    }
  }, [profile.id]);

  const logged = useRef(false);
  useEffect(() => {
    const started = Date.now();
    const id = setInterval(() => {
      tick(game.current, Date.now());
      publish();
      if (game.current.phase !== 'gameover') logged.current = false;
      else if (!logged.current) {
        logged.current = true;
        sendGameEvent({ ...gameSummary(game.current), minutes: Math.round((Date.now() - started) / 6000) / 10 });
      }
    }, 150);
    return () => clearInterval(id);
  }, [publish]);

  const send = useCallback(
    (a: Action) => {
      try {
        apply(game.current, profile.id, a, Date.now());
        tick(game.current, Date.now());
      } catch {
        /* ignore invalid taps */
      }
      publish();
    },
    [profile.id, publish],
  );

  return { view, status: 'open', offset: 0, send, leave: () => {} };
}

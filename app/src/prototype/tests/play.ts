/** Test helper: play one full round with a simple scripted human. */
import { apply, current, newGame, pending, runBots, type ScenarioId, type State, canExtraFollowUp } from '../engine';
import type { Judgment } from '../knowledge';

export interface HumanPolicy {
  question?: (s: State) => string;
  answer?: (s: State, ids: string[]) => string;
  followUp?: (s: State) => boolean;
  respond?: (s: State, ids: string[]) => string;
  judge?: (s: State) => Judgment;
  extra?: (s: State) => { targetId: string; questionId?: string; followUpOf?: number };
  vote?: (s: State) => string;
  challenge?: (s: State, values: string[]) => string;
}

export function playRound(scenario: ScenarioId, seed: string, pol: HumanPolicy = {}, trace?: State[]): State {
  let s = newGame({ scenario, seed });
  const me = s.humanId;
  for (let guard = 0; guard < 400 && s.phase !== 'reveal'; guard++) {
    s = runBots(s);
    trace?.push(s);
    if (s.phase === 'reveal') break;
    if (!pending(s).includes(me)) throw new Error('stuck in ' + s.phase);
    const e = current(s);
    switch (s.phase) {
      case 'briefing': s = apply(s, { type: 'start', pid: me }); break;
      case 'ask': s = apply(s, { type: 'ask', pid: me, questionId: pol.question?.(s) ?? 'q3' }); break;
      case 'answer': s = apply(s, { type: 'answer', pid: me, claimId: pol.answer?.(s, e!.claimOrder) ?? e!.claimOrder[0] }); break;
      case 'fuDecide': s = apply(s, { type: 'fuDecide', pid: me, ask: pol.followUp?.(s) ?? true }); break;
      case 'fuAnswer': s = apply(s, { type: 'fuAnswer', pid: me, responseId: pol.respond?.(s, e!.fuOrder) ?? e!.fuOrder[0] }); break;
      case 'judge': s = apply(s, { type: 'judge', pid: me, judgment: pol.judge?.(s) ?? 'unclear' }); break;
      case 'judged': case 'review': case 'voted': case 'briefing': s = apply(s, { type: 'continue', pid: me }); break;
      case 'extraPick': {
        const x = pol.extra?.(s) ?? (() => {
          const t = s.players.find((p) => p.id !== me)!.id;
          const fu = canExtraFollowUp(s, t)[0];
          return fu ? { targetId: t, followUpOf: fu.n } : { targetId: t, questionId: 'q5' };
        })();
        s = apply(s, { type: 'extra', pid: me, ...x });
        break;
      }
      case 'vote': s = apply(s, { type: 'vote', pid: me, targetId: pol.vote?.(s) ?? s.players.find((p) => p.id !== me)!.id }); break;
      case 'challenge': s = apply(s, { type: 'challenge', pid: me, value: pol.challenge?.(s, s.challenge!.order) ?? s.challenge!.order[0] }); break;
    }
  }
  if (s.phase !== 'reveal') throw new Error('did not finish: ' + s.phase);
  return s;
}

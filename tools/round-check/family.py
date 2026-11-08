"""Hidden-setup family checker (paper analysis only).
Rules kept from Revision 1: places A wheel, B booth, C stalls, D lot (T = Prize Tent, never claimable);
claims lock; honest suspects are accurate; exactly one fabricated alibi; budget = 1 question + 1 record, either order.
Map: the booth (B) can see the wheel (A).
Question to s: "Who else was at your place? (at the booth: and who was at the Ferris wheel?)"
  honest -> the true lists; Liar -> his best answer (checked: copying the other claims is never worse).
Records: A staff 'closed, didn't watch' (no information); B/C/D list exactly who was at that place."""
import itertools
S = ['Dot', 'Leo', 'Bruno']
PLACES = 'ABCD'
WORLD_PL = 'ABCDT'

def account(w, s):
    p = w[s]
    at = frozenset(o for o in S if o != s and w[o] == p)
    seen = frozenset(o for o in S if o != s and w[o] == 'A') if p == 'B' else None
    return (at, seen)

def record(w, r):
    return None if r == 'A' else frozenset(s for s in S if w[s] == r)

def liar_answer(claims, s):
    """Mirror: say exactly what the other (true) claims imply."""
    p = claims[s]
    return (frozenset(o for o in S if o != s and claims[o] == p), frozenset(o for o in S if o != s and claims[o] == 'A') if p == 'B' else None)

def suspects(claims, obs):
    """obs: list of ('Q', s, answer) / ('R', r, result). Logical check over every world."""
    out = []
    for liar in S:
        for pos in itertools.product(WORLD_PL, repeat=3):
            w = dict(zip(S, pos))
            if w[liar] == claims[liar] or any(w[s] != claims[s] for s in S if s != liar): continue
            ok = True
            for kind, x, val in obs:
                if kind == 'R' and record(w, x) != val: ok = False; break
                if kind == 'Q' and x != liar:
                    acc = account(w, x)
                    if acc != val: ok = False; break
            if ok: out.append(liar); break
    return tuple(out)

def observe(state, action):
    w, claims, liar = state['w'], state['claims'], state['liar']
    kind, x = action
    if kind == 'R': return ('R', x, record(w, x))
    return ('Q', x, liar_answer(claims, x) if x == liar else account(w, x))

ACTIONS_Q = [('Q', s) for s in S]
ACTIONS_R = [('R', r) for r in PLACES]

def best_policies(states):
    """All adaptive policies (first action, then second action of the other type chosen per observation).
    Returns (max states identified, list of optimal policy descriptions, per-first-action detail)."""
    results = []
    for first in ACTIONS_Q + ACTIONS_R:
        seconds = ACTIONS_R if first[0] == 'Q' else ACTIONS_Q
        # group states by what the first action shows (observation must be comparable as visible text)
        by_obs = {}
        for st in states:
            o = observe(st, first)
            by_obs.setdefault((o[0], o[1], o[2]), []).append(st)
        total, choice = 0, {}
        for o, sts in by_obs.items():
            best_n, best_a = -1, []
            for a in seconds:
                n = sum(suspects(st['claims'], [o, observe(st, a)]) == (st['liar'],) for st in sts)
                if n > best_n: best_n, best_a = n, [a]
                elif n == best_n: best_a.append(a)
            total += best_n; choice[o] = (best_a, best_n, len(sts))
        results.append((total, first, choice))
    m = max(r[0] for r in results)
    return m, [r for r in results if r[0] == m], results

def make_family(setups, covers='ABCD'):
    states = []
    for sid, (liar, honest) in setups.items():
        for c in covers:
            w = dict(honest); w[liar] = 'T'
            claims = dict(honest); claims[liar] = c
            states.append({'sid': sid, 'liar': liar, 'cover': c, 'w': w, 'claims': claims})
    return states

def extended_states(claims):
    """Every logically possible hidden state with these claims (any liar, Liar anywhere else)."""
    out = []
    for liar in S:
        for p in WORLD_PL:
            if p == claims[liar]: continue
            w = dict(claims); w[liar] = p
            out.append({'sid': 'any', 'liar': liar, 'cover': claims[liar], 'w': w, 'claims': claims})
    return out

# ---- v2: the Liar's answer is a real decision; a plan counts only if it works against every answer
def liar_statements(claims, s):
    others = [o for o in S if o != s]
    subs = [frozenset(x) for k in range(len(others) + 1) for x in itertools.combinations(others, k)]
    return [(a, None) for a in subs] if claims[s] != 'B' else [(a, b) for a in subs for b in subs]

def ident(st, obs):
    return suspects(st['claims'], obs) == (st['liar'],)

def evaluate(states):
    """Best adaptive policy over these states, worst case over the Liar's answers.
    Returns list of (n_identified, first_action, description)."""
    out = []
    claims = states[0]['claims']
    # question first
    for x in S:
        honest_obs = {}
        liar_states = [st for st in states if st['liar'] == x]
        for st in states:
            if st['liar'] != x: honest_obs.setdefault(account(st['w'], x), []).append(st)
        all_obs = set(liar_statements(claims, x)) | set(honest_obs)
        best = (-1, None)
        for k in range(len(liar_states), -1, -1):
            for L in itertools.combinations(liar_states, k):
                total, plan, ok = k, {}, True
                for o in all_obs:
                    feas = [r for r in PLACES if all(ident(st, [('Q', x, o), ('R', r, record(st['w'], r))]) for st in L)]
                    if not feas: ok = False; break
                    hs = honest_obs.get(o, [])
                    sc = {r: sum(ident(st, [('Q', x, o), ('R', r, record(st['w'], r))]) for st in hs) for r in feas}
                    m = max(sc.values()); total += m; plan[o] = [r for r in feas if sc[r] == m]
                if ok and total > best[0]: best = (total, plan)
            if best[0] >= 0 and best[0] >= k + sum(len(v) for v in honest_obs.values()): break
        out.append((best[0], ('Q', x), best[1]))
    # record first, then a question chosen from what the record showed
    for r in PLACES:
        by = {}
        for st in states: by.setdefault(record(st['w'], r), []).append(st)
        total, plan = 0, {}
        for res, sts in by.items():
            sc = {}
            for x in S:
                n = 0
                for st in sts:
                    o_rec = ('R', r, res)
                    answers = liar_statements(claims, x) if st['liar'] == x else [account(st['w'], x)]
                    n += all(ident(st, [o_rec, ('Q', x, a)]) for a in answers)
                sc[x] = n
            m = max(sc.values()); total += m; plan[res] = [x for x in S if sc[x] == m]
        out.append((total, ('R', r), plan))
    return out

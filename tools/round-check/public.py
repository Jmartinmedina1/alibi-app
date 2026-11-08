"""Public possible-world model (catalogue is NOT public).
Public rules: 3 suspects claim places A-D; exactly one claim is false; honest suspects were at their claimed place
for the whole window; the Liar was somewhere else (any place A-D or elsewhere, T). Map: the booth (B) sees the wheel (A).
Detective: reasons over every world consistent with what he sees.
Liar: knows his identity and that he was at T; does not know where the others were -> reasons over every
arrangement of the two honest suspects among A-D (16)."""
import itertools, sys, json
S = ['Dot', 'Leo', 'Bruno']; PL = 'ABCD'; WPL = 'ABCDT'
VARIANTS = {
 'before': {'recs': 'BCD', 'cover': {'B': 'B', 'C': 'C', 'D': 'D'}},              # wheel record removed (was uninformative)
 'wheel-operator': {'recs': 'ABCD', 'cover': {'A': 'A', 'B': 'B', 'C': 'C', 'D': 'D'}},   # proposal: the wheel operator lists who was there
 'booth-sees-wheel': {'recs': 'BCD', 'cover': {'B': 'AB', 'C': 'C', 'D': 'D'}},   # alternative: booth attendant also lists the wheel
}
V = VARIANTS[sys.argv[1] if len(sys.argv) > 1 else 'before']
def record(w, r): return tuple(frozenset(s for s in S if w[s] == p) for p in V['cover'][r])
def account(w, s):
    p = w[s]; at = frozenset(o for o in S if o != s and w[o] == p)
    return (at, frozenset(o for o in S if o != s and w[o] == 'A') if p == 'B' else None)
SUBS = lambda others: [frozenset(x) for k in range(len(others) + 1) for x in itertools.combinations(others, k)]
def liar_statements(claims, s):
    sb = SUBS([o for o in S if o != s])
    return [(a, None) for a in sb] if claims[s] != 'B' else [(a, b) for a in sb for b in sb]
def worlds(claims):
    for liar in S:
        for p in WPL:
            if p != claims[liar]:
                w = dict(claims); w[liar] = p; yield liar, w
def suspects(claims, obs):
    out = set()
    for liar, w in worlds(claims):
        if liar in out: continue
        if all((record(w, x) == v) if k == 'R' else (x == liar or account(w, x) == v) for k, x, v in obs): out.add(liar)
    return tuple(s for s in S if s in out)
def ident(st, obs): return suspects(st['claims'], obs) == (st['liar'],)
def answers(st, x): return liar_statements(st['claims'], x) if st['liar'] == x else [account(st['w'], x)]
def evaluate(states):
    """Best player-executable policy (adaptive, either order) for one visible claim pattern; Liar answers adversarial.
    Returns {first_action: (n_identified, {observation: [optimal second actions]})}."""
    claims = states[0]['claims']; res = {}
    for x in S:
        honest = {}; liars = [st for st in states if st['liar'] == x]
        for st in states:
            if st['liar'] != x: honest.setdefault(account(st['w'], x), []).append(st)
        obs_all = set(liar_statements(claims, x)) | set(honest); best = (-1, None)
        for k in range(len(liars), -1, -1):
            for Ls in itertools.combinations(liars, k):
                tot, plan, ok = k, {}, True
                for o in obs_all:
                    feas = [r for r in V['recs'] if all(ident(st, [('Q', x, o), ('R', r, record(st['w'], r))]) for st in Ls)]
                    if not feas: ok = False; break
                    sc = {r: sum(ident(st, [('Q', x, o), ('R', r, record(st['w'], r))]) for st in honest.get(o, [])) for r in feas}
                    m = max(sc.values()); tot += m
                    if o in honest: plan[o] = [r for r in feas if sc[r] == m]
                if ok and tot > best[0]: best = (tot, plan)
            if best[0] >= 0: break   # larger liar subsets already tried first
        res['Q' + x] = best
    for r in V['recs']:
        by = {}
        for st in states: by.setdefault(record(st['w'], r), []).append(st)
        tot, plan = 0, {}
        for v, sts in by.items():
            sc = {x: sum(all(ident(st, [('R', r, v), ('Q', x, a)]) for a in answers(st, x)) for st in sts) for x in S}
            m = max(sc.values()); tot += m; plan[v] = [x for x in S if sc[x] == m]
        res['R' + r] = (tot, plan)
    return res
def classify(states, ev):
    n = len(states); m = max(v[0] for v in ev.values())
    if m == n: kind = 'guaranteed'
    elif m == 0: kind = 'no plan identifies anyone'
    elif len({v[0] for v in ev.values()}) == 1: kind = 'symmetric: every option equally good'
    else: kind = 'partial: some options better, none guaranteed'
    # does a first result change the worthwhile second step? (no single second action optimal for every result)
    adaptive = any(v[0] == m and v[1] and len(v[1]) > 1 and not set.intersection(*[set(a) for a in v[1].values()]) for v in ev.values())
    return m, kind, adaptive
if __name__ == '__main__':
    name = sys.argv[1] if len(sys.argv) > 1 else 'before'
    pats = {}
    for c in itertools.product(PL, repeat=3):
        claims = dict(zip(S, c))
        states = [{'liar': l, 'w': w, 'claims': claims} for l, w in worlds(claims)]
        ev = evaluate(states); m, kind, adaptive = classify(states, ev)
        pats[''.join(c)] = {'best': m, 'n': len(states), 'kind': kind, 'adaptive': adaptive,
                            'firsts': [k for k, v in ev.items() if v[0] == m], 'by_first': {k: v[0] for k, v in ev.items()}}
    # Liar: identity + at T; others anywhere in A-D (16 arrangements); status of each cover per arrangement
    liar_rows = {}
    for L in S:
        others = [o for o in S if o != L]
        val = {c: [] for c in PL}
        for arr in itertools.product(PL, repeat=2):
            for c in PL:
                claims = dict(zip(others, arr)); claims[L] = c
                w = dict(claims); w[L] = 'T'; st = {'liar': L, 'w': w, 'claims': claims}
                key = ''.join(claims[s] for s in S)
                if pats[key]['kind'] == 'guaranteed': v = 0
                else:
                    catch = any(all(ident(st, [('Q', x, a), ('R', r, record(w, r))]) for a in answers(st, x)) for x in S for r in V['recs']) or \
                            any(all(ident(st, [('R', r, record(w, r)), ('Q', x, a)]) for a in answers(st, x)) for x in S for r in V['recs'])
                    v = 1 if catch else 2
                val[c].append(v)
        nd = [c for c in PL if not any(d != c and all(x >= y for x, y in zip(val[d], val[c])) and val[d] != val[c] for d in PL)]
        unb = [c for c in PL if all(v == 2 for v in val[c])]
        liar_rows[L] = {'counts': {c: {'caught by a guaranteed policy': val[c].count(0), 'catchable only by a bet': val[c].count(1), 'no plan catches': val[c].count(2)} for c in PL},
                        'non_dominated': nd, 'unbeatable': unb}
    kinds = {}
    for p in pats.values(): kinds[p['kind']] = kinds.get(p['kind'], 0) + 1
    print(f"=== {name}: records {V['recs']} covering {V['cover']}")
    print('  claim patterns (64):', kinds)
    print('  every pattern guaranteed (universal policy):', all(p['kind'] == 'guaranteed' for p in pats.values()))
    print('  patterns where the first result changes the worthwhile second step:', sum(p['adaptive'] for p in pats.values()))
    for L, r in liar_rows.items(): print(f"  Liar {L}: {r['counts']} | non-dominated {r['non_dominated']} | unbeatable {r['unbeatable'] or 'none'}")
    json.dump({'pats': pats, 'liar': liar_rows}, open(f'public_{name}.json', 'w'), indent=1, default=str)

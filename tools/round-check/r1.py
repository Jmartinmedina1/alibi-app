"""Revision R1 (paper): explicit whole-window facts, free order. Analysis only."""
import itertools
S = ['Dot', 'Leo', 'Bruno']
PL = ['A', 'B', 'C', 'D', 'T']            # T = Prize Tent (never a valid alibi)
NAMES = {'A': 'Ferris wheel', 'B': 'Photo booth', 'C': 'Food stalls', 'D': 'Parking lot'}
REAL = {'Dot': 'B', 'Leo': 'C', 'Bruno': 'T'}
WORLDS = [dict(zip(S, l)) for l in itertools.product(PL, repeat=3)]
oth = lambda s: [x for x in S if x != s]
# Honest accounts (short, explicit, whole window). Dot can see the wheel; Leo sees only the stalls; nobody sees the lot.
ACCOUNT = {'Dot': lambda w: w['Dot'] == 'B' and all(w[o] not in ('A', 'B') for o in oth('Dot')),   # "Nobody else was at the booth. Nobody was at the Ferris wheel."
           'Leo': lambda w: w['Leo'] == 'C' and all(w[o] != 'C' for o in oth('Leo'))}             # "Nobody else was at the food stalls."
# Liar's possible answers when questioned (A-D), as claims about the world
LIAR_ANS = {'A': lambda w, s: True,                                               # "I didn't notice anyone."
            'B': lambda w, s: all(w[o] != w[s] for o in oth(s)),                  # "Nobody else was there."
            'C': lambda w, s: any(w[o] == w[s] for o in oth(s)),                  # "Someone else was there too."
            'D': lambda w, s: all(w[o] not in ('A',) for o in oth(s)) if True else True}  # "Nobody was at the Ferris wheel."
# Records (explicit whole-window facts)
REC = {'A': ('Ferris wheel staff', 'Closed for repairs. The staff did not watch who was nearby.', lambda w: True),
       'B': ('Photo booth attendant', 'Only Granny Dot was at the booth.', lambda w: w['Dot'] == 'B' and all(w[o] != 'B' for o in oth('Dot'))),
       'C': ('Churro vendor', 'Only the skateboarder (Leo) was at the food stalls.', lambda w: w['Leo'] == 'C' and all(w[o] != 'C' for o in oth('Leo'))),
       'D': ('Parking-lot camera', 'Nobody was in the parking lot.', lambda w: all(w[s] != 'D' for s in S))}
for k, r in REC.items(): assert r[2](REAL), k
for s in ('Dot', 'Leo'): assert ACCOUNT[s](REAL)

def suspects(claims, answers, recs):
    out = []
    for liar in S:
        for w in WORLDS:
            if w[liar] == claims[liar] or not all(REC[r][2](w) for r in recs): continue
            ok = all(w[s] == claims[s] and (s not in answers or (ACCOUNT[s](w) if s != 'Bruno' else LIAR_ANS[answers[s]](w, s))) for s in S if s != liar)
            if ok: out.append(liar); break
    return out

def plans(claims, budget):
    """All legal adaptive plans, as outcome per Liar answer. Returns list of (label, set of results across Liar answers)."""
    res = []
    targets = ['Dot', 'Leo', 'Bruno']
    for q in targets:
        for r in 'ABCD':
            outs = {}
            for a in ('ABCD' if q == 'Bruno' else ['honest']):
                ans = {q: a} if q == 'Bruno' else {q: 'honest'}
                outs[a] = tuple(suspects(claims, ans, [r]))
            res.append((f'ask {q} + record {r}', outs))
    if budget == 'one':
        res = []
        for q in targets:
            outs = {a: tuple(suspects(claims, {q: a} if q == 'Bruno' else {q: 'honest'}, [])) for a in ('ABCD' if q == 'Bruno' else ['honest'])}
            res.append((f'ask {q} only', outs))
        for r in 'ABCD': res.append((f'record {r} only', {'-': tuple(suspects(claims, {}, [r]))}))
    return res

from family import *
import json
fam3 = {'S1': ('Bruno', {'Dot': 'B', 'Leo': 'C'}), 'S2': ('Dot', {'Leo': 'C', 'Bruno': 'D'}), 'S3': ('Leo', {'Dot': 'B', 'Bruno': 'D'})}
fam = dict(fam3, S4=('Bruno', {'Dot': 'A', 'Leo': 'D'}), S5=('Dot', {'Leo': 'D', 'Bruno': 'C'}), S6=('Leo', {'Dot': 'A', 'Bruno': 'C'}), S7=('Dot', {'Leo': 'C', 'Bruno': 'B'}))
st7 = json.load(open('family7.json'))
rank = {'no plan catches it': 2, 'catchable only by a bet': 1, 'caught: guaranteed policy': 0}
print('Dominated covers (another cover is at least as good in every setup the Liar cannot tell apart, better in one):')
for liar in S:
    sids = [sid for sid, (l, _) in fam.items() if l == liar]
    val = {c: [rank[st7['status'][f'{sid}|{c}']] for sid in sids] for c in 'ABCD'}
    dom = {c: [d for d in 'ABCD' if d != c and all(x >= y for x, y in zip(val[d], val[c])) and val[d] != val[c]] for c in 'ABCD'}
    nd = [c for c in 'ABCD' if not dom[c]]
    print(f'  {liar} ({", ".join(sids)}): ' + '; '.join(f'{c} dominated by {dom[c]}' for c in 'ABCD' if dom[c]) + f' | non-dominated: {nd}')
print('\nGroups by visible claims (multi-state groups and family-only guarantees):')
for r in st7['rows']:
    if len(r['states']) > 1 or r['kind'] != 'guaranteed (any hidden state)':
        print(f"  {r['claims']} | {r['states']} | best {r['best']} (any hidden state {r['logic']}) | optimal first actions {r['first_actions']} | {r['kind']}")
# Adaptive example: where the first result changes the worthwhile second step
print('\nWhere a result changes which second step is worth taking:')
states = make_family(fam)
groups = {}
for s_ in states: groups.setdefault(tuple(s_['claims'][s] for s in S), []).append(s_)
shown = 0
for key, sts in groups.items():
    ext = extended_states(sts[0]['claims'])
    for tot, first, plan in evaluate(ext):
        if first[0] == 'R' and tot == max(e[0] for e in evaluate(ext)) and len({tuple(v) for v in plan.values()}) > 1:
            print(f"  claims {dict(zip(S, key))}: open record {first[1]} first ->", {('nobody' if not k else '+'.join(sorted(k))): v for k, v in plan.items()}, f'(identifies {tot}/{len(ext)} of all hidden states with these claims)')
            shown += 1; break
    if shown >= 3: break

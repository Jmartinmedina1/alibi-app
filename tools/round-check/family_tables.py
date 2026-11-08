from family import *
import json
fam = {'S1': ('Bruno', {'Dot': 'B', 'Leo': 'C'}), 'S2': ('Dot', {'Leo': 'C', 'Bruno': 'D'}), 'S3': ('Leo', {'Dot': 'B', 'Bruno': 'D'}),
       'S4': ('Bruno', {'Dot': 'A', 'Leo': 'D'}), 'S5': ('Dot', {'Leo': 'D', 'Bruno': 'C'}), 'S6': ('Leo', {'Dot': 'A', 'Bruno': 'C'}), 'S7': ('Dot', {'Leo': 'C', 'Bruno': 'B'})}
data = json.load(open('family7.json'))
P = {'A': 'Wheel', 'B': 'Booth', 'C': 'Stalls', 'D': 'Lot'}
lab = lambda c: ', '.join(f"{s} {P[c[s]]}" for s in S)
def kind(r):
    c = r['claims']
    if r['kind'].startswith('guaranteed (any'): return 'Guaranteed after good investigation'
    if r['kind'].startswith('guaranteed for this family'): return 'Family knowledge only: over all hidden states this is the same 1-in-3 test'
    if r['kind'] == 'no meaningful decision': return 'No meaningful decision: nothing can test the wheel claim; "insufficient evidence" is correct'
    if 'A' in c.values(): return 'Partly informed (the wheel claim is untestable), then a symmetric choice between the two testable claims'
    return 'Completely symmetric: each record tests one claim, questions add nothing'
out = ['| Visible claims | Hidden states in this group | Best result | Over every hidden state with these claims | Classification |', '|---|---|---|---|---|']
for r in data['rows']:
    out.append(f"| {lab(r['claims'])} | {'; '.join(r['states'])} | {r['best']} | {r['logic']} | {kind(r)} |")
open('groups.md', 'w').write('\n'.join(out) + '\n')
# what each investigation establishes, for the multi-state groups
states = make_family(fam)
groups = {}
for s_ in states: groups.setdefault(tuple(s_['claims'][s] for s in S), []).append(s_)
fmt = lambda v: 'nothing about people' if v is None else ('nobody' if not v else ' + '.join(sorted(v)))
det = []
for key, sts in groups.items():
    if len(sts) < 2: continue
    det.append(f"\n**Claims: {lab(dict(zip(S, key)))}**\n")
    det.append('| Investigation | ' + ' | '.join(f"{st['sid']} ({st['liar']} lies)" for st in sts) + ' |')
    det.append('|---|' + '---|' * len(sts))
    for r in 'ABCD':
        det.append(f'| Record {r} ({P[r]}) | ' + ' | '.join(f"{fmt(record(st['w'], r))} → {'/'.join(suspects(st['claims'], [('R', r, record(st['w'], r))]))}" for st in sts) + ' |')
    for x in S:
        cells = []
        for st in sts:
            if st['liar'] == x: cells.append('Liar answers as he likes')
            else:
                a = account(st['w'], x)
                cells.append(f"with me: {fmt(a[0])}" + (f"; at the wheel: {fmt(a[1])}" if a[1] is not None else '') + f" → {'/'.join(suspects(st['claims'], [('Q', x, a)]))}")
        det.append(f'| Question {x} | ' + ' | '.join(cells) + ' |')
open('detail.md', 'w').write('\n'.join(det) + '\n')
print(open('groups.md').read()[:1500]); print(open('detail.md').read())

from round import *
NAME = {'Dot': 'Dot', 'Leo': 'Leo', 'Bruno': 'Bruno'}
QLAB = {'Dot': 'A · ask Granny Dot', 'Leo': 'B · ask Skater Leo', 'Bruno': 'C · ask Chef Bruno', None: 'D · no question'}
def cell(v):
    if v == ['Bruno']: return '**Bruno only**'
    return ' or '.join(v)
lines = []
for c in 'ABCD':
    cl = {'Dot': 'B', 'Leo': 'C', 'Bruno': c}
    lines.append(f'\n#### Bruno claims {c} · {PLACES[c]}\n')
    lines.append('| Question (answer) | Record A · guard log | Record B · photo strip | Record C · vendor | Record D · gate camera |')
    lines.append('|---|---|---|---|---|')
    for q in ['Dot', 'Leo', 'Bruno', None]:
        for a in ([None] if q is None else ([HONEST[q][1]] if q != 'Bruno' else 'ABCD')):
            A = {} if q is None else {q: a}
            lab = QLAB[q] + (f' → {a}' if q == 'Bruno' else '')
            lines.append(f'| {lab} | ' + ' | '.join(cell(suspects(cl, A, [r])) for r in 'ABCD') + ' |')
open('tables.md', 'w').write('\n'.join(lines) + '\n')
print('\n'.join(lines[:12]))

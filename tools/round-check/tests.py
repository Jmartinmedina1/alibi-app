from round import *
claims_for = lambda c: {'Dot': 'B', 'Leo': 'C', 'Bruno': c}
SAFE = {}  # Liar's answers that avoid any self-refutation when he is the one asked
for c in 'ABCD':
    cl = claims_for(c)
    # best Liar answer when questioned: minimise records that would then single him out
    scores = {a: sum(suspects(cl, {'Bruno': a}, [r]) == ['Bruno'] for r in 'ABCD') + (suspects(cl, {'Bruno': a}, []) != S) for a in 'ABCD'}
    SAFE[c] = [a for a, v in scores.items() if v == min(scores.values())]
print('Liar answers that expose the least, per cover:', SAFE)
# Best Detective plan per cover, against the Liar's safest answers (Detective cannot know which claim is false)
for c in 'ABCD':
    cl = claims_for(c); wins = []
    for q in ['Dot', 'Leo', 'Bruno', None]:
        ans = [None] if q is None else ([HONEST[q][1]] if q != 'Bruno' else SAFE[c])
        for r in 'ABCD':
            if all(suspects(cl, {} if q is None else {q: a}, [r]) == ['Bruno'] for a in ans): wins.append(f"{q or 'no question'}+record {r}")
    print(f'Cover {c}: plans that always identify the Liar -> {wins or "NONE"}')
# Order test: record first, then question (chosen after seeing the record)
c = 'B'; cl = claims_for(c)
print('Cover B, record B first (Dot confirmed), then ask Dot:', suspects(cl, {'Dot': 'A'}, ['B']))
print('Cover B, ask Bruno (safe answer B) then record B:', suspects(cl, {'Bruno': 'B'}, ['B']), '| ask Dot then record B:', suspects(cl, {'Dot': 'A'}, ['B']))

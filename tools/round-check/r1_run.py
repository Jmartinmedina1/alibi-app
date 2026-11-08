from r1 import *
for budget in ('both', 'one'):
    print(f"\n######## budget: {'1 question + 1 record, any order' if budget == 'both' else 'ONE action: a question OR a record'}")
    for cover in 'ABCD':
        claims = {'Dot': 'B', 'Leo': 'C', 'Bruno': cover}
        P = plans(claims, budget)
        # a plan "wins" if it singles out Bruno whatever Bruno answers
        winning = [lab for lab, outs in P if all(v == ('Bruno',) for v in outs.values())]
        best_left = min(max(len(v) for v in outs.values()) for _, outs in P)
        shared = [s for s in ('Dot', 'Leo') if claims[s] == cover]
        print(f"cover {cover} {NAMES[cover]:12} shares place with {shared or 'nobody'} | winning plans: {winning or 'NONE'} | fewest suspects left by best plan: {best_left}")

"""Constant public lead = one extra line of sight, the same every night (does not reveal the setup).
Accounts: 'who else was at your place' + 'who was at each place you could see'."""
import itertools, sys
import family as F
S = F.S
def make(sight):
    def account(w, s):
        p = w[s]
        at = frozenset(o for o in S if o != s and w[o] == p)
        return (at,) + tuple(frozenset(o for o in S if o != s and w[o] == q) for q in sight.get(p, []))
    def liar_statements(claims, s):
        others = [o for o in S if o != s]
        subs = [frozenset(x) for k in range(len(others) + 1) for x in itertools.combinations(others, k)]
        return [t for t in itertools.product(subs, repeat=1 + len(sight.get(claims[s], [])))]
    return account, liar_statements
if __name__ == '__main__':
    name = sys.argv[1]
    sight = {'base': {'B': ['A']}, 'stalls-lot': {'B': ['A'], 'C': ['D']}, 'booth-stalls': {'B': ['A', 'C']}}[name]
    import lead as Lm
    Lm.account, Lm.liar_statements = make(sight)
    Lm.LEADS['sight'] = (lambda w: None, f'constant sightlines {sight}')
    r = Lm.run('sight', verbose=False)
    kinds = {}
    for g in r['groups']: kinds[g['kind']] = kinds.get(g['kind'], 0) + 1
    print(f'\n=== {name}: {sight} | groups {len(r["groups"])} | {kinds}')
    print('  universal winning Detective policy over the family:', r['universal_family'], '| guaranteed for every group over every hidden state:', r['universal_any'])
    print('  unbeatable Liar strategies:', r['unbeatable'] or 'none')
    for liar, lv, sids, val, nd in r['liar_rows']: print(f'  {liar} setups {sids}: {val} non-dominated {nd}')
    for g in r['groups']:
        if g['kind'] != 'guaranteed for every hidden state': print(f"   {g['claims']} {g['states']} best {g['best']}/{g['n']} any {g['any_best']}/{g['any_n']} first={g['firsts']} [{g['kind']}]")
    import json; json.dump(r, open(f'sight_{name}.json', 'w'), indent=1, default=str)

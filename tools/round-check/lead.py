"""Family checker with an optional public lead (fixed with the setup, shown to everyone before claims).
Record A (wheel staff, never informative) is removed from the menu."""
import itertools, sys, json
from family import S, WORLD_PL, account, record, liar_statements
RECS = 'BCD'
FAM = {'S1': ('Bruno', {'Dot': 'B', 'Leo': 'C'}), 'S2': ('Dot', {'Leo': 'C', 'Bruno': 'D'}), 'S3': ('Leo', {'Dot': 'B', 'Bruno': 'D'}),
       'S4': ('Bruno', {'Dot': 'A', 'Leo': 'D'}), 'S5': ('Dot', {'Leo': 'D', 'Bruno': 'C'}), 'S6': ('Leo', {'Dot': 'A', 'Bruno': 'C'}),
       'S7': ('Dot', {'Leo': 'C', 'Bruno': 'B'})}
def count_at(p): return lambda w: sum(w[s] == p for s in S)
LEADS = {
 'none': (lambda w: None, 'no lead'),
 'stalls': (count_at('C'), 'The churro vendor served N customers between 9:15 and 9:30.'),
 'booth': (count_at('B'), 'The photo booth printed strips for N different people between 9:15 and 9:30.'),
 'lot': (count_at('D'), 'The parking-lot camera counted N people in the lot between 9:15 and 9:30.'),
 'wheel': (count_at('A'), 'N people were at the Ferris wheel between 9:15 and 9:30.'),
}
def suspects(claims, obs, lead_fn, lead_val):
    out = []
    for liar in S:
        for pos in itertools.product(WORLD_PL, repeat=3):
            w = dict(zip(S, pos))
            if w[liar] == claims[liar] or any(w[s] != claims[s] for s in S if s != liar): continue
            if lead_val is not None and lead_fn(w) != lead_val: continue
            if all((record(w, x) == v) if k == 'R' else (x == liar or account(w, x) == v) for k, x, v in obs):
                out.append(liar); break
    return tuple(out)
def ident(st, obs, L): return suspects(st['claims'], obs, L, st['lead']) == (st['liar'],)
def evaluate(states, L):
    """Best player-executable policy for one visible group (lead + claims); the Liar's answers are adversarial."""
    claims = states[0]['claims']; best = []
    for x in S:   # question first
        honest = {}; liars = [st for st in states if st['liar'] == x]
        for st in states:
            if st['liar'] != x: honest.setdefault(account(st['w'], x), []).append(st)
        obs_all = set(liar_statements(claims, x)) | set(honest); top = -1
        for k in range(len(liars), -1, -1):
            for Ls in itertools.combinations(liars, k):
                tot, ok = k, True
                for o in obs_all:
                    feas = [r for r in RECS if all(ident(st, [('Q', x, o), ('R', r, record(st['w'], r))], L) for st in Ls)]
                    if not feas: ok = False; break
                    tot += max(sum(ident(st, [('Q', x, o), ('R', r, record(st['w'], r))], L) for st in honest.get(o, [])) for r in feas)
                if ok: top = max(top, tot)
        best.append((top, 'Q' + x))
    for r in RECS:   # record first
        by = {}
        for st in states: by.setdefault(record(st['w'], r), []).append(st)
        tot = 0
        for res, sts in by.items():
            tot += max(sum(all(ident(st, [('R', r, res), ('Q', x, a)], L) for a in (liar_statements(claims, x) if st['liar'] == x else [account(st['w'], x)])) for st in sts) for x in S)
        best.append((tot, 'R' + r))
    return best
def run(name, verbose=True):
    L, text = LEADS[name]
    states = []
    for sid, (liar, honest) in FAM.items():
        w = dict(honest); w[liar] = 'T'; lv = L(w)
        for c in 'ABCD':
            claims = dict(honest); claims[liar] = c
            if lv is not None and suspects(claims, [], L, lv) == (liar,):   # the lead alone already exposes this cover
                st_flag = 'exposed by the lead'
            else: st_flag = None
            states.append({'sid': sid, 'liar': liar, 'cover': c, 'w': w, 'claims': claims, 'lead': lv, 'flag': st_flag})
    groups = {}
    for st in states: groups.setdefault((st['lead'], tuple(st['claims'][s] for s in S)), []).append(st)
    res = {'lead': name, 'groups': [], 'status': {}}
    for (lv, key), sts in groups.items():
        claims = sts[0]['claims']
        ext = []
        for liar in S:
            for p in WORLD_PL:
                if p == claims[liar]: continue
                w = dict(claims); w[liar] = p
                if lv is None or L(w) == lv: ext.append({'liar': liar, 'w': w, 'claims': claims, 'lead': lv})
        ev = evaluate(sts, L); m = max(e[0] for e in ev)
        evx = evaluate(ext, L); mx = max(e[0] for e in evx)
        before = suspects(claims, [], L, lv)
        if mx == len(ext): kind = 'guaranteed for every hidden state'
        elif m == len(sts): kind = 'guaranteed only with family knowledge'
        elif m == 0: kind = 'no meaningful decision (no plan works)'
        elif len({e[0] for e in ev}) == 1: kind = 'symmetric guess (every option equally good)'
        else: kind = 'partial: some options better, best still a guess'
        res['groups'].append({'lead': lv, 'claims': dict(zip(S, key)), 'states': [f"{st['sid']}:{st['liar']}->{st['cover']}" for st in sts],
                              'possible_before': before, 'best': m, 'n': len(sts), 'any_best': mx, 'any_n': len(ext), 'firsts': [e[1] for e in ev if e[0] == m],
                              'by_first': {e[1]: e[0] for e in ev}, 'kind': kind})
        for st in sts:
            can = any(all(ident(st, [('Q', x, a), ('R', r, record(st['w'], r))], L) for a in (liar_statements(claims, x) if x == st['liar'] else [account(st['w'], x)])) for x in S for r in RECS) \
                  or any(all(ident(st, [('R', r, record(st['w'], r)), ('Q', x, a)], L) for a in (liar_statements(claims, x) if x == st['liar'] else [account(st['w'], x)])) for x in S for r in RECS)
            res['status'][f"{st['sid']}|{st['cover']}"] = (2 if not can else 0 if mx == len(ext) else 1, st['lead'])
    uni = all(g['best'] == g['n'] for g in res['groups'])
    uni_any = all(g['any_best'] == g['any_n'] for g in res['groups'])
    # Liar info sets = (identity, lead value); dominance and unbeatable strategies
    rows = []
    unbeatable = []
    for liar in S:
        infos = {}
        for sid, (l, _) in FAM.items():
            if l == liar: infos.setdefault(res['status'][f'{sid}|A'][1], []).append(sid)
        for lv, sids in infos.items():
            val = {c: [res['status'][f'{sid}|{c}'][0] for sid in sids] for c in 'ABCD'}   # 2=safe,1=bet,0=caught (higher is better for the Liar)
            nd = [c for c in 'ABCD' if not any(d != c and all(x >= y for x, y in zip(val[d], val[c])) and val[d] != val[c] for d in 'ABCD')]
            for c in 'ABCD':
                if all(v == 2 for v in val[c]): unbeatable.append((liar, lv, c))
            rows.append((liar, lv, sids, {c: val[c] for c in 'ABCD'}, nd))
    res.update({'universal_family': uni, 'universal_any': uni_any, 'liar_rows': [(a, b, c, d, e) for a, b, c, d, e in rows], 'unbeatable': unbeatable})
    if verbose:
        kinds = {}
        for g in res['groups']: kinds[g['kind']] = kinds.get(g['kind'], 0) + 1
        print(f"\n=== lead: {name} ({text}) | visible groups {len(res['groups'])} | {kinds}")
        print(f"  universal winning Detective policy over the family: {uni} | guaranteed for every visible group over every hidden state: {uni_any}")
        print(f"  unbeatable Liar strategies (cover safe in every setup the Liar cannot tell apart): {unbeatable or 'none'}")
        for liar, lv, sids, val, nd in rows:
            print(f"  {liar} sees lead={lv} -> setups {sids}; cover value per setup (2 safe,1 bet,0 caught): {val}; non-dominated {nd}")
        for g in res['groups']:
            if g['n'] > 1 or g['kind'] != 'guaranteed for every hidden state':
                print(f"   lead={g['lead']} claims={g['claims']} states={g['states']} best {g['best']}/{g['n']} any {g['any_best']}/{g['any_n']} first={g['firsts']} [{g['kind']}]")
    return res
if __name__ == '__main__':
    out = {n: run(n) for n in (sys.argv[1:] or LEADS)}
    json.dump(out, open('leads.json', 'w'), indent=1, default=str)

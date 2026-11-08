from family import *
import sys, json
fam3 = {'S1': ('Bruno', {'Dot': 'B', 'Leo': 'C'}), 'S2': ('Dot', {'Leo': 'C', 'Bruno': 'D'}), 'S3': ('Leo', {'Dot': 'B', 'Bruno': 'D'})}
fam6 = dict(fam3, **{'S4': ('Bruno', {'Dot': 'A', 'Leo': 'D'}), 'S5': ('Dot', {'Leo': 'D', 'Bruno': 'C'}), 'S6': ('Leo', {'Dot': 'A', 'Bruno': 'C'})})
fam7 = dict(fam6, S7=('Dot', {'Leo': 'C', 'Bruno': 'B'}))
fam = {'6': fam6, '7': fam7}.get((sys.argv[1:] or ['3'])[0], fam3)
states = make_family(fam)
groups = {}
for st in states: groups.setdefault(tuple(st['claims'][s] for s in S), []).append(st)
print(f'Family of {len(fam)} setups -> {len(states)} hidden states -> {len(groups)} visible claim patterns')
uni_f = uni_l = True; status = {}; rows = []
for key, sts in sorted(groups.items(), key=lambda kv: (-len(kv[1]), kv[0])):
    ev = evaluate(sts); m = max(e[0] for e in ev)
    ext = extended_states(sts[0]['claims']); evx = evaluate(ext); mx = max(e[0] for e in evx)
    uni_f &= m == len(sts); uni_l &= mx == len(ext)
    firsts = [f"{e[1][0]}{e[1][1]}" for e in ev if e[0] == m]
    spread = sorted(set(e[0] for e in ev))
    kind = ('guaranteed (any hidden state)' if mx == len(ext) else
            'guaranteed for this family only' if m == len(sts) else
            ('no meaningful decision' if len(spread) == 1 else 'useful uncertainty' if m > 0 else 'no plan works'))
    rows.append({'claims': dict(zip(S, key)), 'states': [f"{st['sid']} ({st['liar']} lies, cover {st['cover']})" for st in sts],
                 'best': f'{m}/{len(sts)}', 'logic': f'{mx}/{len(ext)}', 'first_actions': firsts, 'kind': kind, 'spread': spread})
    print(f"{dict(zip(S, key))}: {[r for r in rows[-1]['states']]} best {m}/{len(sts)} | any-state {mx}/{len(ext)} | optimal first: {firsts} | results by first action {spread} | {kind}")
    for st in sts:
        exposed = any(all(ident(st, [('Q', x, a), ('R', r, record(st['w'], r))]) for a in (liar_statements(st['claims'], x) if x == st['liar'] else [account(st['w'], x)])) for x in S for r in PLACES) \
            or any(all(ident(st, [('R', r, record(st['w'], r)), ('Q', x, a)]) for a in (liar_statements(st['claims'], x) if x == st['liar'] else [account(st['w'], x)])) for x in S for r in PLACES)
        status[(st['sid'], st['cover'])] = ('caught: guaranteed policy' if mx == len(ext) else 'catchable only by a bet' if exposed else 'no plan catches it')
print('\nUniversal winning Detective policy (family):', uni_f, '| logically guaranteed everywhere:', uni_l)
for liar in S:
    sids = [sid for sid, (l, _) in fam.items() if l == liar]
    print(f"{liar}: " + ' | '.join(f"{c}: " + ', '.join(f"{sid} {status[(sid, c)]}" for sid in sids) for c in 'ABCD'))
json.dump({'rows': rows, 'status': {f'{k[0]}|{k[1]}': v for k, v in status.items()}}, open(f'family{len(fam)}.json', 'w'), indent=1)

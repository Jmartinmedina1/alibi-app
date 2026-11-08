import sys, importlib
for variant in ['before', 'wheel-operator']:
    sys.argv = ['x', variant]
    import public as P; importlib.reload(P)
    print(f'\n== {variant}')
    cases = [('Dot lies, claims the wheel; Leo stalls, Bruno lot', {'Dot': 'A', 'Leo': 'C', 'Bruno': 'D'}, 'Dot'),
             ('Leo lies, claims the wheel; Dot really at the wheel, Bruno stalls', {'Dot': 'A', 'Leo': 'A', 'Bruno': 'C'}, 'Leo')]
    for label, claims, liar in cases:
        w = dict(claims); w[liar] = 'T'; st = {'liar': liar, 'w': w, 'claims': claims}
        catching = sorted({f'record {r} + ask {x}' for x in P.S for r in P.V['recs']
                           if all(P.ident(st, [('Q', x, a), ('R', r, P.record(w, r))]) for a in P.answers(st, x))
                           or all(P.ident(st, [('R', r, P.record(w, r)), ('Q', x, a)]) for a in P.answers(st, x))})
        recs = {r: P.suspects(claims, [('R', r, P.record(w, r))]) for r in P.V['recs']}
        pat = ''.join(claims[s] for s in P.S)
        import json; kind = json.load(open(f'public_{variant}.json'))['pats'][pat]['kind']
        print(f'  {label}: pattern {pat} = {kind}; records alone -> {recs}; plans that catch this state: {catching or "none"}')

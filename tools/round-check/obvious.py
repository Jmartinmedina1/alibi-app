import json, sys, itertools
name = sys.argv[1]
d = json.load(open(f'public_{name}.json'))['pats']
cat = {}
for k, p in d.items():
    distinct = len(set(k)) == 3
    shared = len(set(k)) < 3
    wb = 'A' in k and 'B' in k
    key = ('shared place' if shared else 'all different') + (', wheel+booth claimed' if wb and not shared else '')
    cat.setdefault(key, {}).setdefault(p['kind'], []).append((k, p['best'], p['n'], p['firsts']))
for key, kinds in cat.items():
    print(f'\n{key}:')
    for kind, items in kinds.items():
        print(f'  {kind}: {len(items)} patterns; best results {sorted(set(f"{b}/{n}" for _, b, n, _ in items))}; e.g. {items[0][0]} optimal first actions {items[0][3]}')

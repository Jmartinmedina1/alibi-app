"""ALIBI fixed round 'Riverside Fair' — exhaustive logic model (analysis only, not gameplay).
A world = where each suspect really was 9:15-9:30 (one spot each) + facts.
A suspect is consistent as the Liar iff some world satisfies: every revealed record, every statement
of the OTHER two suspects, and the Liar's own place claim is FALSE (exactly one fabricated alibi)."""
import itertools
S = ['Dot', 'Leo', 'Bruno']
SPOTS = {'A': ['A_ride', 'A_path'], 'B': ['B_inside', 'B_queue', 'B_bench'], 'C': ['C_counter', 'C_tables'], 'D': ['D_rows', 'D_gate'], 'O': ['O']}
ALL = [x for v in SPOTS.values() for x in v]
P = lambda spot: spot.split('_')[0]
WORLDS = [{'loc': dict(zip(S, l)), 'wheel': w, 'van': v} for l in itertools.product(ALL, repeat=3) for w in ('turning', 'stopped') for v in (True, False)]
REAL = {'loc': {'Dot': 'B_inside', 'Leo': 'C_tables', 'Bruno': 'O'}, 'wheel': 'stopped', 'van': True}
oth = lambda s: [x for x in S if x != s]
at = lambda w, s, *x: w['loc'][s] in x
inP = lambda w, s, p: P(w['loc'][s]) == p

PLACES = {'A': 'Ferris wheel', 'B': 'Photo booth', 'C': 'Food stalls', 'D': 'Parking lot'}
FOLLOW_UP = {'A': 'Where exactly were you, and what was the wheel doing?', 'B': 'What did you do at the photo booth, and who else was there?',
             'C': 'What did you do at the food stalls, and who else was there?', 'D': 'What were you doing in the lot, and who else was there?'}
ANS = {
 'A': {'A': ('I rode the wheel twice; it was running fine.', lambda w, s: at(w, s, 'A_ride') and w['wheel'] == 'turning'),
       'B': ('It was stopped for repairs, so I stood on the path outside the rope watching the crew.', lambda w, s: at(w, s, 'A_path') and w['wheel'] == 'stopped'),
       'C': ('It was stopped; I was inside the rope chatting with the repair crew.', lambda w, s: at(w, s, 'A_ride') and w['wheel'] == 'stopped'),
       'D': ('Near the wheel, looking at the lights. Nothing special.', lambda w, s: inP(w, s, 'A'))},
 'B': {'A': ('I was alone: inside the booth until 9:22, then on the bench facing the Ferris wheel. Nobody else came to the booth. The wheel was stopped and nobody was near it.',
             lambda w, s: inP(w, s, 'B') and all(not inP(w, o, 'B') and not inP(w, o, 'A') for o in oth(s)) and w['wheel'] == 'stopped'),
       'B': ('In the queue the whole time. The booth was busy.', lambda w, s: at(w, s, 'B_queue')),
       'C': ('Inside the booth taking photos with Granny Dot.', lambda w, s: at(w, s, 'B_inside') and at(w, 'Dot', 'B_inside')),
       'D': ("On the bench outside the booth. I didn't look around much.", lambda w, s: at(w, s, 'B_bench'))},
 'C': {'A': ('At the picnic tables with churros I bought at 9:14. I watched the parking lot: a white van left at 9:19. Nobody else was at the stalls or in the lot.',
             lambda w, s: at(w, s, 'C_tables') and w['van'] and all(not inP(w, o, 'C') and not inP(w, o, 'D') for o in oth(s))),
       'B': ('Buying churros at the counter, around 9:20.', lambda w, s: at(w, s, 'C_counter')),
       'C': ("At the picnic tables. I didn't notice much.", lambda w, s: at(w, s, 'C_tables')),
       'D': ('At the tables, next to the skateboarder.', lambda w, s: at(w, s, 'C_tables') and at(w, 'Leo', 'C_tables'))},
 'D': {'A': ('Restocking my food truck in the back rows.', lambda w, s: at(w, s, 'D_rows')),
       'B': ('Waiting by the gate for a friend.', lambda w, s: at(w, s, 'D_gate')),
       'C': ('The lot was empty; I was on my own.', lambda w, s: inP(w, s, 'D') and all(not inP(w, o, 'D') for o in oth(s))),
       'D': ('I saw a white van drive out.', lambda w, s: inP(w, s, 'D') and w['van'])},
}
HONEST = {'Dot': ('B', 'A'), 'Leo': ('C', 'A')}
REC = {
 'A': ('Ferris wheel guard log', 'Closed for repairs 9:05-9:40. Nobody went inside the rope.', "Covers only inside the rope; doesn't record people on the path outside.",
       lambda w: w['wheel'] == 'stopped' and all(not at(w, s, 'A_ride') for s in S)),
 'B': ('Photo booth strip', 'Printed 9:20: Granny Dot, alone, inside the booth.', "Shows only the inside of the booth at 9:20, not the queue or the bench.",
       lambda w: [s for s in S if at(w, s, 'B_inside')] == ['Dot']),
 'C': ('Churro vendor', 'Sold churros to a skateboarder at 9:14, closed the counter at 9:15, then cleaned the picnic tables until 9:30. The skateboarder was the only customer at the stalls the whole time.',
       "Covers the food stalls only. Says nothing about the parking lot or anywhere else.",
       lambda w: at(w, 'Leo', 'C_tables') and all(not inP(w, s, 'C') for s in S if s != 'Leo')),
 'D': ('Parking-lot gate camera', 'A man in a chef\'s hat walked out at 9:06. A white van drove out at 9:19. Nobody else used the gate 9:00-9:30.',
       "Shows only the gate. Someone already inside the lot before 9:00 would not appear.",
       lambda w: w['van'] and not inP(w, 'Bruno', 'D')),
}
for k, r in REC.items(): assert r[3](REAL), k
for s, (p, a) in HONEST.items(): assert ANS[p][a][1](REAL, s), s

def suspects(claims, answers, recs):
    out = []
    for liar in S:
        for w in WORLDS:
            if not all(REC[r][3](w) for r in recs): continue
            if inP(w, liar, claims[liar]): continue
            if all(inP(w, s, claims[s]) and (s not in answers or ANS[claims[s]][answers[s]][1](w, s)) for s in S if s != liar):
                out.append(liar); break
    return out

"""Build the game content bundle from the ALIBI source files.
Output: app/src/content/bundle.json (used by the app and the server)."""
import json, re, os
SRC = '/home/claude/alibi'
OUT = os.path.join(os.path.dirname(__file__), '..', 'app', 'src', 'content', 'bundle.json')
content = json.load(open(f'{SRC}/alibi-content.json'))
answers = json.load(open(f'{SRC}/alibi-answers-7topics.json'))
comedy = json.load(open(f'{SRC}/alibi-comedy.json'))
learn = json.load(open(f'{SRC}/alibi-espanol-learning.json'))
pfacts = json.load(open(f'{SRC}/alibi-party-facts.json'))['facts']

SHORT = {  # id: (emoji, short name)
 'party-roller-rink':('🛼','Roller Rink'),'party-trampoline-park':('🤸','Trampoline Park'),
 'party-ice-skating-rink':('⛸️','Ice Rink'),'party-rock-climbing-gym':('🧗','Climbing Gym'),
 'party-bowling-alley':('🎳','Bowling Alley'),'party-mini-golf':('⛳','Mini Golf'),
 'party-laser-tag':('🔫','Laser Tag'),'party-arcade':('🕹️','Arcade'),'party-escape-room':('🔐','Escape Room'),
 'party-karaoke-bar':('🎤','Karaoke Bar'),'party-comedy-club':('🎙️','Comedy Club'),
 'party-haunted-house':('👻','Haunted House'),'party-magic-show':('🎩','Magic Show'),
 'party-all-you-can-eat-buffet':('🍽️','The Buffet'),'party-fancy-restaurant':('🥂','Fancy Restaurant'),
 'party-food-truck-festival':('🚚','Food Truck Festival'),'party-ice-cream-parlor':('🍦','Ice Cream Parlor'),
 'party-sushi-conveyor-belt':('🍣','Sushi Train'),'party-airport-security':('🛂','Airport Security'),
 'party-cruise-ship':('🛳️','Cruise Ship'),'party-overnight-train':('🚆','Sleeper Train'),
 'party-crowded-subway':('🚇','Subway Station'),'party-kids-birthday':('🎂','Kids\' Birthday Party'),
 'party-wedding-reception':('💒','Wedding Reception'),'party-graduation-ceremony':('🎓','Graduation'),
 'party-surprise-retirement':('🎉','Retirement Party'),
 'espanol-zocalo-ciudad-mexico':('🇲🇽','El Zócalo'),'espanol-mercado-oaxaca':('🌶️','Mercado de Oaxaca'),
 'espanol-la-boca-buenos-aires':('💃','La Boca'),'espanol-plaza-mayor-madrid':('🏛️','Plaza Mayor'),
 'espanol-cartagena-amurallada':('🌅','Cartagena'),'espanol-quinceanera':('👗','Quinceañera'),
 'espanol-panaderia-madrugada':('🥐','La panadería'),'espanol-boda-mariachi':('🎺','Boda con mariachi'),
 'espanol-futbol-barrio':('⚽','Fútbol del barrio'),'espanol-nochebuena-andalucia':('🎄','Nochebuena'),
 'espanol-islas-galapagos':('🐢','Galápagos'),'espanol-salar-uyuni':('🪞','Salar de Uyuni'),
 'espanol-selva-costa-rica':('🦥','Selva de Costa Rica'),'espanol-patagonia-viento':('🏔️','Patagonia'),
 'espanol-cataratas-iguazu':('💦','Cataratas del Iguazú'),'espanol-chichen-itza-equinoccio':('🐍','Chichén Itzá'),
 'espanol-alhambra-granada':('🦁','La Alhambra'),'espanol-dia-muertos-ofrenda':('🕯️','Día de Muertos'),
 'espanol-camino-santiago':('🐚','Camino de Santiago'),'espanol-rapa-nui-moai':('🗿','Rapa Nui'),
}
def strip_label(s):
    return re.sub(r'^(Sight|Sound|Smell)\s*:\s*', '', s)

# Joker mode (silly answers): tools/jokers/*.json, {id: {topic: [text | {es, en}]}}
JOKERS, JOKER_TM = {}, {}
JD = os.path.join(os.path.dirname(__file__), 'jokers')
for f in sorted(os.listdir(JD)) if os.path.isdir(JD) else []:
    JOKERS.update(json.load(open(os.path.join(JD, f))))

locs = []
for l in content:
    if l['pack'] not in ('party', 'espanol') or l['id'] not in answers['locations']:
        continue
    emoji, short = SHORT[l['id']]
    cards = {t: [{'text': c['text'], 'heat': c['heat']} for c in v] for t, v in answers['locations'][l['id']].items()}
    if l['pack'] == 'party':
        facts = [{'en': f} for f in pfacts[l['id']]['facts']]
    else:
        L = learn['locations'][l['id']]
        facts = [{'es': f['es'], 'en': f['en']} for f in L['facts']]
    loc = {
        'id': l['id'], 'pack': l['pack'], 'category': l['category'], 'emoji': emoji, 'name': short,
        'fullName': l['name'], 'clues': [strip_label(d) for d in l['details']],
        'hint': l['hint'], 'hintEasy': l.get('hintEasy') or l['hint'], 'hintHard': l.get('hintHard') or l['hint'],
        'facts': facts, 'cards': cards,
    }
    if l['id'] in JOKERS:
        J = JOKERS[l['id']]
        loc['jokers'] = {t: [x['es'] if isinstance(x, dict) else x for x in J[t]] for t in cards}
        for t in cards:
            for x in J[t]:
                if isinstance(x, dict): JOKER_TM[x['es']] = x['en']
    if l['pack'] == 'espanol':
        loc['vocab'] = L['vocab']
        loc['nameEn'] = L['name']['en']
    locs.append(loc)
assert len(locs) == 46, len(locs)
assert all(len(l['cards']) == 7 and all(len(v) == 3 for v in l['cards'].values()) for l in locs)

# English translations for Spanish strings (hold-to-translate); clue text without the label prefix
tm = {}
for k, v in learn['textMap'].items():
    tm[strip_label(k)] = strip_label(v)

tm.update(JOKER_TM)
assert all('jokers' in l for l in locs), [l['id'] for l in locs if 'jokers' not in l]
bundle = {'version': 1, 'locations': locs, 'comedy': comedy, 'translations': tm}
json.dump(bundle, open(OUT, 'w'), ensure_ascii=False, separators=(',', ':'))
print('ok', len(locs), 'locations,', len(tm), 'translations,', os.path.getsize(OUT)//1024, 'KB')

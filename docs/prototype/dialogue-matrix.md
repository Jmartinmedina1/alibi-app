# Haunted House — dialogue matrix (EN / ES)

Generated from `app/src/prototype/caseData.ts` by `tools/proto-matrix.ts`. Do not edit by hand.
Kinds (compatible / contradiction / unsupported extra detail / vague) are manually reviewed authoring metadata, shown to players only at the reveal. Contradictions are justified one by one in [contradiction-audit.md](contradiction-audit.md).

## Evidence
- **A. Entrance / Entrada** — A guide collected tickets at a red curtain. Visitors entered in small groups. / Un guía recogía los boletos junto a una cortina roja. Los visitantes entraban en grupos pequeños.
- **B. Route / Recorrido** — Visitors walked through dark corridors. A green floor line marked the route. / Los visitantes recorrían pasillos oscuros. Una línea verde en el piso marcaba el camino.
- **C. Incident / Incidente** — A masked actor appeared beside a rattling cupboard. It was the only scare. The group hurried toward the exit. / Un actor con máscara apareció junto a un armario que se sacudía. Fue el único susto. El grupo se apresuró hacia la salida.

## q1 · Entrance — “What happened before you went inside?” / “¿Qué pasó antes de que entraras?”

### q1a · Compatible with the case file
- EN: “A guide took our tickets.”
- ES: “Un guía nos recogió los boletos.”
- States: tickets.collected=yes, tickets.who=guide
- Reveal EN: Compatible with: “A guide collected the tickets.”
- Reveal ES: Compatible con: “Un guía recogía los boletos.”
- Follow-up: “What did the guide do after taking your ticket?” / “¿Qué hizo el guía después de recoger tu boleto?”

| id | kind | EN | ES | states | reveal (EN) |
|---|---|---|---|---|---|
| q1a1 | Compatible with the case file | Held a red curtain open and let a few of us in. | Abrió una cortina roja y nos dejó pasar a unos pocos. | entrance.marker=red-curtain, entry.group=small | Compatible with: “Tickets were collected at a red curtain.” Compatible with: “Visitors entered in small groups.” |
| q1a2 | Contradicts the case file | Waved a big crowd in all at once. | Hizo pasar a una multitud entera a la vez. | entry.group=crowd | Contradicts: “Visitors entered in small groups.” The case file says visitors entered in small groups. Could both be true? None: a whole crowd at once is not a small group. |
| q1a3 | Vague or evasive | Said something, but I was looking at my phone. | Dijo algo, pero yo estaba mirando mi teléfono. | — | Says nothing checkable. Being vague doesn't prove anyone is lying. |

### q1b · Contradicts the case file
- EN: “We scanned our own tickets at a machine. No staff anywhere.”
- ES: “Escaneamos nuestros boletos en una máquina. No había nadie del personal.”
- States: tickets.who=machine
- Reveal EN: Contradicts: “A guide collected the tickets.” The case file says a guide collected the tickets. Could both be true? A machine could exist next to a guide, but "no staff" rules the guide out.
- Reveal ES: Contradice: “Un guía recogía los boletos.” Según el expediente, un guía recogía los boletos. ¿Pueden ser ciertas las dos cosas? Podría haber una máquina junto al guía, pero "no había personal" descarta al guía.
- Follow-up: “So how did you know when to go in?” / “¿Y cómo sabían cuándo entrar?”

| id | kind | EN | ES | states | reveal (EN) |
|---|---|---|---|---|---|
| q1b1 | Unsupported extra detail | A light flashed and a gate opened. | Parpadeó una luz y se abrió una reja. | — | Can't be checked on its own; it only keeps the earlier conflicting story going. |
| q1b2 | Compatible with the case file · correction | Actually, a guide took the tickets after the machine. | En realidad, después de la máquina un guía recogió los boletos. | tickets.collected=yes, tickets.who=guide | Compatible with: “A guide collected the tickets.” Corrects what this person said earlier. It lowers confidence, but it is not a contradiction by itself. |
| q1b3 | Vague or evasive | Everyone just walked, so I did too. | Todos caminaron, así que yo también. | — | Says nothing checkable. Being vague doesn't prove anyone is lying. |

### q1c · Compatible with the case file
- EN: “We waited at a red curtain until they let a few of us in.”
- ES: “Esperamos junto a una cortina roja hasta que dejaron pasar a unos pocos.”
- States: entrance.marker=red-curtain, entry.group=small
- Reveal EN: Compatible with: “Tickets were collected at a red curtain.” Compatible with: “Visitors entered in small groups.”
- Reveal ES: Compatible con: “Los boletos se recogían junto a una cortina roja.” Compatible con: “Los visitantes entraban en grupos pequeños.”
- Follow-up: “Who decided when your group could go in?” / “¿Quién decidía cuándo podía entrar tu grupo?”

| id | kind | EN | ES | states | reveal (EN) |
|---|---|---|---|---|---|
| q1c1 | Compatible with the case file | A guide, once they had our tickets. | Un guía, cuando ya tenía nuestros boletos. | tickets.collected=yes, tickets.who=guide | Compatible with: “A guide collected the tickets.” |
| q1c2 | Contradicts the case file | Nobody. There was no staff, just a ticket machine. | Nadie. No había personal, solo una máquina de boletos. | tickets.who=machine | Contradicts: “A guide collected the tickets.” The case file says a guide collected the tickets. Could both be true? A machine could exist next to a guide, but "no staff" rules the guide out. |
| q1c3 | Vague or evasive | I guess it was timed. | Supongo que era por tiempo. | — | Says nothing checkable. Being vague doesn't prove anyone is lying. |

### q1d · Contradicts the case file
- EN: “We waited by the doors, then the whole crowd went in together.”
- ES: “Esperamos junto a las puertas y luego entró toda la multitud junta.”
- States: entry.group=crowd
- Reveal EN: Contradicts: “Visitors entered in small groups.” The case file says visitors entered in small groups. Could both be true? None: a whole crowd at once is not a small group.
- Reveal ES: Contradice: “Los visitantes entraban en grupos pequeños.” Según el expediente, los visitantes entraban en grupos pequeños. ¿Pueden ser ciertas las dos cosas? Ninguna: toda una multitud a la vez no es un grupo pequeño.
- Follow-up: “How many people went in with you?” / “¿Cuántas personas entraron contigo?”

| id | kind | EN | ES | states | reveal (EN) |
|---|---|---|---|---|---|
| q1d1 | Contradicts the case file | Fifty or so. The whole line. | Unas cincuenta. Toda la fila. | entry.group=crowd | Contradicts: “Visitors entered in small groups.” The case file says visitors entered in small groups. Could both be true? None: a whole crowd at once is not a small group. |
| q1d2 | Compatible with the case file · correction | Hmm, maybe five or six of us. | Mmm, tal vez cinco o seis. | entry.group=small | Compatible with: “Visitors entered in small groups.” Corrects what this person said earlier. It lowers confidence, but it is not a contradiction by itself. |
| q1d3 | Vague or evasive | I didn't count. | No los conté. | — | Says nothing checkable. Being vague doesn't prove anyone is lying. |

### q1e · Unsupported extra detail
- EN: “We stood in line for a while.”
- ES: “Hicimos fila un buen rato.”
- States: —
- Reveal EN: A line is never mentioned in the case file. It can't be checked, and it isn't automatically false.
- Reveal ES: La fila no aparece en el expediente. No se puede comprobar y no es falsa por eso.
- Follow-up: “What was at the front of the line?” / “¿Qué había al frente de la fila?”

| id | kind | EN | ES | states | reveal (EN) |
|---|---|---|---|---|---|
| q1e1 | Compatible with the case file | A red curtain, and a guide taking tickets. | Una cortina roja y un guía recogiendo boletos. | entrance.marker=red-curtain, tickets.collected=yes, tickets.who=guide | Compatible with: “Tickets were collected at a red curtain.” Compatible with: “A guide collected the tickets.” |
| q1e2 | Contradicts the case file | A machine where you scanned your own ticket. No staff. | Una máquina donde escaneabas tu boleto. Nadie del personal. | tickets.who=machine | Contradicts: “A guide collected the tickets.” The case file says a guide collected the tickets. Could both be true? A machine could exist next to a guide, but "no staff" rules the guide out. |
| q1e3 | Vague or evasive | I couldn't see past the people ahead. | No veía más allá de la gente de adelante. | — | Says nothing checkable. Being vague doesn't prove anyone is lying. |

## q2 · Entrance — “Who let you in, and where?” / “¿Quién te dejó entrar, y dónde?”

### q2a · Compatible with the case file
- EN: “A guide, at a red curtain.”
- ES: “Un guía, junto a una cortina roja.”
- States: entry.staff=guide, entrance.marker=red-curtain
- Reveal EN: Compatible with: “Tickets were collected at a red curtain.” The red curtain matches. That the guide also let them in is a reasonable fit, but the case file only says the guide collected tickets.
- Reveal ES: Compatible con: “Los boletos se recogían junto a una cortina roja.” La cortina roja coincide. Que el guía también los dejara pasar encaja, pero el expediente solo dice que recogía los boletos.
- Follow-up: “Did you go in by yourself?” / “¿Entraste sin compañía?”

| id | kind | EN | ES | states | reveal (EN) |
|---|---|---|---|---|---|
| q2a1 | Compatible with the case file | No, with a small group. | No, con un grupo pequeño. | entry.group=small | Compatible with: “Visitors entered in small groups.” |
| q2a2 | Contradicts the case file | Yes, one person at a time. | Sí, de uno en uno. | entry.group=alone | Contradicts: “Visitors entered in small groups.” The case file says visitors entered in small groups. Could both be true? None: entering with no group, one person at a time, is not entering in small groups. |
| q2a3 | Vague or evasive | With whoever was standing near me. | Con quien estuviera cerca de mí. | — | Says nothing checkable. Being vague doesn't prove anyone is lying. |

### q2b · Contradicts the case file
- EN: “A ticket machine let us in. Nobody was working there.”
- ES: “Una máquina de boletos nos dejó pasar. No había nadie trabajando.”
- States: tickets.who=machine, entry.staff=none
- Reveal EN: Contradicts: “A guide collected the tickets.” The case file says a guide collected the tickets. Could both be true? A machine could exist next to a guide, but "no staff" rules the guide out.
- Reveal ES: Contradice: “Un guía recogía los boletos.” Según el expediente, un guía recogía los boletos. ¿Pueden ser ciertas las dos cosas? Podría haber una máquina junto al guía, pero "no había personal" descarta al guía.
- Follow-up: “Nobody at all?” / “¿Nadie en absoluto?”

| id | kind | EN | ES | states | reveal (EN) |
|---|---|---|---|---|---|
| q2b1 | Contradicts the case file | Nobody. Just the machine and a turnstile. | Nadie. Solo la máquina y un torniquete. | tickets.who=machine, entry.staff=none | Contradicts: “A guide collected the tickets.” The case file says a guide collected the tickets. Could both be true? A machine could exist next to a guide, but "no staff" rules the guide out. |
| q2b2 | Compatible with the case file · correction | Well, a guide took our tickets first, at a red curtain. | Bueno, primero un guía recogió los boletos, junto a una cortina roja. | tickets.collected=yes, tickets.who=guide, entry.staff=guide, entrance.marker=red-curtain | Compatible with: “A guide collected the tickets.” Compatible with: “Tickets were collected at a red curtain.” Corrects what this person said earlier. It lowers confidence, but it is not a contradiction by itself. |
| q2b3 | Vague or evasive | Maybe someone was around. It was busy. | Quizá había alguien. Había mucha gente. | — | Says nothing checkable. Being vague doesn't prove anyone is lying. |

### q2c · Compatible with the case file
- EN: “Someone sent us in a few at a time.”
- ES: “Alguien nos hacía pasar de a pocos.”
- States: entry.group=small
- Reveal EN: Compatible with: “Visitors entered in small groups.”
- Reveal ES: Compatible con: “Los visitantes entraban en grupos pequeños.”
- Follow-up: “What did you hand to that person?” / “¿Qué le entregaste a esa persona?”

| id | kind | EN | ES | states | reveal (EN) |
|---|---|---|---|---|---|
| q2c1 | Compatible with the case file | My ticket. | Mi boleto. | tickets.collected=yes | Fits part of: “A guide collected the tickets.” |
| q2c2 | Contradicts the case file | Nothing. Nobody took tickets. | Nada. Nadie recogía boletos. | tickets.collected=no | Contradicts: “A guide collected the tickets.” The case file says a guide collected the tickets. Could both be true? None: if nobody collected tickets, the guide did not collect them. |
| q2c3 | Vague or evasive | I don't remember. | No me acuerdo. | — | Says nothing checkable. Being vague doesn't prove anyone is lying. |

### q2d · Contradicts the case file
- EN: “Nobody. I went in by myself, with no group.”
- ES: “Nadie. Entré por mi cuenta, sin ningún grupo.”
- States: entry.staff=none, entry.group=alone
- Reveal EN: Contradicts: “Visitors entered in small groups.” The case file says visitors entered in small groups. Could both be true? None: entering with no group, one person at a time, is not entering in small groups.
- Reveal ES: Contradice: “Los visitantes entraban en grupos pequeños.” Según el expediente, los visitantes entraban en grupos pequeños. ¿Pueden ser ciertas las dos cosas? Ninguna: entrar sin grupo, de uno en uno, no es entrar en grupos pequeños.
- Follow-up: “Nobody checked your ticket?” / “¿Nadie revisó tu boleto?”

| id | kind | EN | ES | states | reveal (EN) |
|---|---|---|---|---|---|
| q2d1 | Contradicts the case file | Nope. Nobody was collecting tickets. | No. Nadie recogía boletos. | tickets.collected=no | Contradicts: “A guide collected the tickets.” The case file says a guide collected the tickets. Could both be true? None: if nobody collected tickets, the guide did not collect them. |
| q2d2 | Compatible with the case file · correction | Oh, a guide took it first, at the red curtain. | Ah, primero un guía lo recogió, junto a la cortina roja. | tickets.collected=yes, tickets.who=guide, entry.staff=guide, entrance.marker=red-curtain | Compatible with: “A guide collected the tickets.” Compatible with: “Tickets were collected at a red curtain.” Corrects "nobody", but the earlier "I went in by myself, with no group" still stands. Corrects what this person said earlier. It lowers confidence, but it is not a contradiction by itself. |
| q2d3 | Vague or evasive | Maybe someone did. It was busy. | Quizá alguien lo revisó. Había mucha gente. | — | Says nothing checkable. Being vague doesn't prove anyone is lying. |

### q2e · Vague or evasive
- EN: “A staff member. I didn't notice much else.”
- ES: “Alguien del personal. No me fijé en mucho más.”
- States: —
- Reveal EN: Could fit the guide, but it is too vague to check.
- Reveal ES: Podría ser el guía, pero es demasiado vago para comprobarlo.
- Follow-up: “What was that staff member standing next to?” / “¿Junto a qué estaba esa persona del personal?”

| id | kind | EN | ES | states | reveal (EN) |
|---|---|---|---|---|---|
| q2e1 | Compatible with the case file | A red curtain. | Una cortina roja. | entrance.marker=red-curtain | Compatible with: “Tickets were collected at a red curtain.” |
| q2e2 | Unsupported extra detail | A table full of rubber bats. | Una mesa llena de murciélagos de goma. | — | A table of props is never mentioned. It can't be checked, and it isn't automatically false. |
| q2e3 | Vague or evasive | I honestly didn't notice. | La verdad, no me fijé. | — | Says nothing checkable. Being vague doesn't prove anyone is lying. |

## q3 · Route — “How did you know where to go?” / “¿Cómo sabías por dónde ir?”

### q3a · Compatible with the case file
- EN: “I followed a green line on the floor.”
- ES: “Seguí una línea verde en el piso.”
- States: route.marker=green-line
- Reveal EN: Compatible with: “A green floor line marked the route.”
- Reveal ES: Compatible con: “Una línea verde en el piso marcaba el camino.”
- Follow-up: “Could you see anything else?” / “¿Podías ver algo más?”

| id | kind | EN | ES | states | reveal (EN) |
|---|---|---|---|---|---|
| q3a1 | Compatible with the case file | Not really. The corridors were dark. | No mucho. Los pasillos estaban oscuros. | route.light=dark | Fits part of: “Visitors walked through dark corridors.” |
| q3a2 | Contradicts the case file | Sure. It was bright the whole time. | Claro. Estuvo bien iluminado todo el tiempo. | route.light=bright | Contradicts: “Visitors walked through dark corridors.” The case file says the corridors were dark. Could both be true? A dark corridor can have some dim light, but "bright" describes a well-lit route, not a dark one. |
| q3a3 | Vague or evasive | Mostly the backs of people's heads. | Sobre todo la nuca de la gente. | — | Says nothing checkable. Being vague doesn't prove anyone is lying. |

### q3b · Contradicts the case file
- EN: “Nothing marked the way. We just guessed.”
- ES: “Nada marcaba el camino. Solo adivinamos.”
- States: route.marker=none
- Reveal EN: Contradicts: “A green floor line marked the route.” The case file says a green floor line marked the route. Could both be true? Someone could miss the line, but this says nothing marked the way, which the case denies.
- Reveal ES: Contradice: “Una línea verde en el piso marcaba el camino.” Según el expediente, una línea verde en el piso marcaba el camino. ¿Pueden ser ciertas las dos cosas? Alguien podría no ver la línea, pero esto afirma que nada marcaba el camino, y el expediente lo contradice.
- Follow-up: “So how didn't you get lost?” / “¿Y cómo no se perdieron?”

| id | kind | EN | ES | states | reveal (EN) |
|---|---|---|---|---|---|
| q3b1 | Unsupported extra detail | We did get lost, twice. | Sí nos perdimos, dos veces. | — | Can't be checked on its own; it only keeps the earlier conflicting story going. |
| q3b2 | Compatible with the case file · correction | Actually, there was a line on the floor. Green, I think. | En realidad, había una línea en el piso. Verde, creo. | route.marker=green-line | Compatible with: “A green floor line marked the route.” Corrects what this person said earlier. It lowers confidence, but it is not a contradiction by itself. |
| q3b3 | Vague or evasive | I just followed the others. | Solo seguí a los demás. | — | Says nothing checkable. Being vague doesn't prove anyone is lying. |

### q3c · Compatible with the case file
- EN: “I stayed close to my group in the dark.”
- ES: “Me quedé cerca de mi grupo en la oscuridad.”
- States: route.light=dark
- Reveal EN: Fits part of: “Visitors walked through dark corridors.”
- Reveal ES: Encaja con parte de: “Los visitantes recorrían pasillos oscuros.”
- Follow-up: “How many people were in your group?” / “¿Cuántas personas había en tu grupo?”

| id | kind | EN | ES | states | reveal (EN) |
|---|---|---|---|---|---|
| q3c1 | Compatible with the case file | Five or six. | Cinco o seis. | entry.group=small | Compatible with: “Visitors entered in small groups.” |
| q3c2 | Contradicts the case file | Around forty. The whole crowd. | Unas cuarenta. Toda la multitud. | entry.group=crowd | Contradicts: “Visitors entered in small groups.” The case file says visitors entered in small groups. Could both be true? None: a whole crowd at once is not a small group. |
| q3c3 | Vague or evasive | Enough to keep bumping into each other. | Suficientes para chocar todo el rato. | — | Says nothing checkable. Being vague doesn't prove anyone is lying. |

### q3d · Unsupported extra detail
- EN: “Glowing signs pointed the way.”
- ES: “Unos letreros luminosos marcaban el camino.”
- States: —
- Reveal EN: Glowing signs can exist in dark corridors, and the case file never mentions signs. It can't be checked either way, so it is not a contradiction.
- Reveal ES: Puede haber letreros luminosos en pasillos oscuros, y el expediente no menciona letreros. No se puede comprobar, así que no es una contradicción.
- Follow-up: “What did the signs say?” / “¿Qué decían los letreros?”

| id | kind | EN | ES | states | reveal (EN) |
|---|---|---|---|---|---|
| q3d1 | Unsupported extra detail | Arrows and the word EXIT. | Flechas y la palabra SALIDA. | — | Another detail the case file never mentions. Can't be checked. |
| q3d2 | Compatible with the case file | I mostly followed the green line on the floor, honestly. | La verdad, seguí sobre todo la línea verde del piso. | route.marker=green-line | Compatible with: “A green floor line marked the route.” |
| q3d3 | Contradicts the case file | Who needed signs? The hallway was brightly lit. | ¿Para qué letreros? El pasillo estaba muy iluminado. | route.light=bright | Contradicts: “Visitors walked through dark corridors.” The case file says the corridors were dark. Could both be true? A dark corridor can have some dim light, but "bright" describes a well-lit route, not a dark one. |

### q3e · Vague or evasive
- EN: “I kept watching the floor.”
- ES: “Iba mirando el piso.”
- States: —
- Reveal EN: Hints at something on the floor, but names nothing checkable.
- Reveal ES: Insinúa algo en el piso, pero no nombra nada comprobable.
- Follow-up: “What were you looking for?” / “¿Qué buscabas?”

| id | kind | EN | ES | states | reveal (EN) |
|---|---|---|---|---|---|
| q3e1 | Compatible with the case file | The green line that marked the way. | La línea verde que marcaba el camino. | route.marker=green-line | Compatible with: “A green floor line marked the route.” |
| q3e2 | Contradicts the case file | Something to follow. There wasn't anything. | Algo que seguir. No había nada. | route.marker=none | Contradicts: “A green floor line marked the route.” The case file says a green floor line marked the route. Could both be true? Someone could miss the line, but this says nothing marked the way, which the case denies. |
| q3e3 | Vague or evasive | Anything I might trip over. | Cualquier cosa con la que pudiera tropezar. | — | Says nothing checkable. Being vague doesn't prove anyone is lying. |

## q4 · Route — “What was it like walking through?” / “¿Cómo era el recorrido por dentro?”

### q4a · Compatible with the case file
- EN: “Dark corridors. I could barely see my hands.”
- ES: “Pasillos oscuros. Apenas me veía las manos.”
- States: route.mode=walked, route.light=dark
- Reveal EN: Compatible with: “Visitors walked through dark corridors.”
- Reveal ES: Compatible con: “Los visitantes recorrían pasillos oscuros.”
- Follow-up: “Then how did you find the way?” / “¿Y cómo encontraste el camino?”

| id | kind | EN | ES | states | reveal (EN) |
|---|---|---|---|---|---|
| q4a1 | Compatible with the case file | A green line on the floor. | Una línea verde en el piso. | route.marker=green-line | Compatible with: “A green floor line marked the route.” |
| q4a2 | Contradicts the case file | There was nothing to follow, so I felt along the walls. | No había nada que seguir, así que fui tocando las paredes. | route.marker=none | Contradicts: “A green floor line marked the route.” The case file says a green floor line marked the route. Could both be true? Someone could miss the line, but this says nothing marked the way, which the case denies. |
| q4a3 | Unsupported extra detail | I kept one hand on the wall. | Iba con una mano en la pared. | — | Never mentioned, and fits a dark corridor. Can't be checked. |

### q4b · Contradicts the case file
- EN: “Bright and open, like a school hallway.”
- ES: “Iluminado y amplio, como el pasillo de una escuela.”
- States: route.light=bright
- Reveal EN: Contradicts: “Visitors walked through dark corridors.” The case file says the corridors were dark. Could both be true? A dark corridor can have some dim light, but "bright" describes a well-lit route, not a dark one.
- Reveal ES: Contradice: “Los visitantes recorrían pasillos oscuros.” Según el expediente, los pasillos estaban oscuros. ¿Pueden ser ciertas las dos cosas? Un pasillo oscuro puede tener algo de luz tenue, pero "iluminado" describe un camino con buena luz, no uno oscuro.
- Follow-up: “Where was the light coming from?” / “¿De dónde venía la luz?”

| id | kind | EN | ES | states | reveal (EN) |
|---|---|---|---|---|---|
| q4b1 | Unsupported extra detail | Big lights on the ceiling. | De unas lámparas grandes en el techo. | — | Can't be checked on its own; it only keeps the earlier conflicting story going. |
| q4b2 | Compatible with the case file · correction | Well... it was mostly dark. Just a faint glow. | Bueno… estaba casi todo oscuro. Solo un brillo tenue. | route.light=dark | Fits part of: “Visitors walked through dark corridors.” Corrects what this person said earlier. It lowers confidence, but it is not a contradiction by itself. |
| q4b3 | Vague or evasive | Somewhere up ahead. | De algún lugar más adelante. | — | Says nothing checkable. Being vague doesn't prove anyone is lying. |

### q4c · Compatible with the case file
- EN: “Narrow corridors. We walked one behind another.”
- ES: “Pasillos angostos. Caminábamos uno detrás de otro.”
- States: route.mode=walked
- Reveal EN: Fits part of: “Visitors walked through dark corridors.”
- Reveal ES: Encaja con parte de: “Los visitantes recorrían pasillos oscuros.”
- Follow-up: “Who was at the front?” / “¿Quién iba al frente?”

| id | kind | EN | ES | states | reveal (EN) |
|---|---|---|---|---|---|
| q4c1 | Compatible with the case file | Me, following a green line on the floor. | Yo, siguiendo una línea verde en el piso. | route.marker=green-line | Compatible with: “A green floor line marked the route.” |
| q4c2 | Contradicts the case file | Me. Nothing marked the way, so I guessed. | Yo. Nada marcaba el camino, así que adiviné. | route.marker=none | Contradicts: “A green floor line marked the route.” The case file says a green floor line marked the route. Could both be true? Someone could miss the line, but this says nothing marked the way, which the case denies. |
| q4c3 | Unsupported extra detail | A tall guy. I stayed in the middle. | Un señor alto. Yo iba en medio. | — | Who walked first is never mentioned. Can't be checked. |

### q4d · Contradicts the case file
- EN: “We stayed in our seats the whole time.”
- ES: “Nos quedamos en nuestros asientos todo el tiempo.”
- States: route.mode=seated
- Reveal EN: Contradicts: “Visitors walked through dark corridors.” The case file says visitors walked through the corridors. Could both be true? None: staying seated the whole time rules out walking the corridors.
- Reveal ES: Contradice: “Los visitantes recorrían pasillos oscuros.” Según el expediente, los visitantes recorrían los pasillos caminando. ¿Pueden ser ciertas las dos cosas? Ninguna: quedarse sentado todo el tiempo descarta recorrer los pasillos.
- Follow-up: “What were you watching?” / “¿Qué estaban mirando?”

| id | kind | EN | ES | states | reveal (EN) |
|---|---|---|---|---|---|
| q4d1 | Unsupported extra detail | Actors on a stage. | Actores en un escenario. | — | Can't be checked on its own; it only keeps the earlier conflicting story going. |
| q4d2 | Compatible with the case file · correction | Sorry, I mixed it up. We walked through dark corridors. | Perdón, me confundí. Recorrimos pasillos oscuros. | route.mode=walked, route.light=dark | Compatible with: “Visitors walked through dark corridors.” Corrects what this person said earlier. It lowers confidence, but it is not a contradiction by itself. |
| q4d3 | Vague or evasive | Whatever was in front of us. | Lo que hubiera enfrente. | — | Says nothing checkable. Being vague doesn't prove anyone is lying. |

### q4e · Unsupported extra detail
- EN: “Creepy music played the whole time.”
- ES: “Hubo música tétrica todo el tiempo.”
- States: —
- Reveal EN: Music is never mentioned in the case file. It can't be checked, and it isn't automatically false.
- Reveal ES: La música no aparece en el expediente. No se puede comprobar y no es falsa por eso.
- Follow-up: “Did the music ever change?” / “¿La música cambió en algún momento?”

| id | kind | EN | ES | states | reveal (EN) |
|---|---|---|---|---|---|
| q4e1 | Compatible with the case file | It got loud when a cupboard started rattling. | Subió de volumen cuando un armario empezó a sacudirse. | incident.place=cupboard | Compatible with: “The only scare happened beside a rattling cupboard.” |
| q4e2 | Contradicts the case file | It got loud when the scare happened: an actor with no mask. | Subió de volumen con el susto: un actor sin máscara. | incident.who=unmasked-actor | Contradicts: “The only scare was a masked actor.” The case file says the only scare was a masked actor. Could both be true? Face paint could be under a mask, but this says there was no mask, and it was the only scare. |
| q4e3 | Vague or evasive | Not that I noticed. | No que yo notara. | — | Says nothing checkable. Being vague doesn't prove anyone is lying. |

## q5 · Incident — “What made everyone move suddenly?” / “¿Qué hizo que todos se movieran de repente?”

### q5a · Compatible with the case file
- EN: “A masked actor jumped out.”
- ES: “Salió de golpe un actor con máscara.”
- States: incident.who=masked-actor
- Reveal EN: Compatible with: “The only scare was a masked actor.”
- Reveal ES: Compatible con: “El único susto fue un actor con máscara.”
- Follow-up: “Where did the actor come from?” / “¿De dónde salió el actor?”

| id | kind | EN | ES | states | reveal (EN) |
|---|---|---|---|---|---|
| q5a1 | Compatible with the case file | From beside a rattling cupboard. | De al lado de un armario que se sacudía. | incident.place=cupboard | Compatible with: “The only scare happened beside a rattling cupboard.” |
| q5a2 | Contradicts the case file | Out of a coffin. There was no cupboard near it. | De un ataúd. No había ningún armario cerca. | incident.place=coffin | Contradicts: “The only scare happened beside a rattling cupboard.” The case file says the only scare happened beside a rattling cupboard. Could both be true? None: it was the only scare, and it happened beside the cupboard. |
| q5a3 | Vague or evasive | Somewhere on my left. | De algún lado a mi izquierda. | — | Says nothing checkable. Being vague doesn't prove anyone is lying. |

### q5b · Contradicts the case file
- EN: “An actor with no mask, just face paint.”
- ES: “Un actor sin máscara, solo con la cara pintada.”
- States: incident.who=unmasked-actor
- Reveal EN: Contradicts: “The only scare was a masked actor.” The case file says the only scare was a masked actor. Could both be true? Face paint could be under a mask, but this says there was no mask, and it was the only scare.
- Reveal ES: Contradice: “El único susto fue un actor con máscara.” Según el expediente, el único susto fue un actor con máscara. ¿Pueden ser ciertas las dos cosas? Podría haber pintura bajo la máscara, pero esto dice que no había máscara, y fue el único susto.
- Follow-up: “What did the face paint look like?” / “¿Cómo era la pintura de la cara?”

| id | kind | EN | ES | states | reveal (EN) |
|---|---|---|---|---|---|
| q5b1 | Unsupported extra detail | White, with big black eyes. | Blanca, con ojos negros enormes. | — | Can't be checked on its own; it only keeps the earlier conflicting story going. |
| q5b2 | Compatible with the case file · correction | Hmm, maybe it was a mask, not paint. | Mmm, tal vez era una máscara, no pintura. | incident.who=masked-actor | Compatible with: “The only scare was a masked actor.” Corrects what this person said earlier. It lowers confidence, but it is not a contradiction by itself. |
| q5b3 | Vague or evasive | Scary. I looked away. | Daba miedo. Aparté la mirada. | — | Says nothing checkable. Being vague doesn't prove anyone is lying. |

### q5c · Compatible with the case file
- EN: “A cupboard started rattling, and someone appeared beside it.”
- ES: “Un armario empezó a sacudirse y alguien apareció a su lado.”
- States: incident.place=cupboard
- Reveal EN: Compatible with: “The only scare happened beside a rattling cupboard.”
- Reveal ES: Compatible con: “El único susto ocurrió junto a un armario que se sacudía.”
- Follow-up: “Who appeared?” / “¿Quién apareció?”

| id | kind | EN | ES | states | reveal (EN) |
|---|---|---|---|---|---|
| q5c1 | Compatible with the case file | An actor in a mask. | Un actor con máscara. | incident.who=masked-actor | Compatible with: “The only scare was a masked actor.” |
| q5c2 | Contradicts the case file | An actor with no mask. | Un actor sin máscara. | incident.who=unmasked-actor | Contradicts: “The only scare was a masked actor.” The case file says the only scare was a masked actor. Could both be true? Face paint could be under a mask, but this says there was no mask, and it was the only scare. |
| q5c3 | Vague or evasive | I didn't get a good look. | No alcancé a verlo bien. | — | Says nothing checkable. Being vague doesn't prove anyone is lying. |

### q5d · Contradicts the case file
- EN: “Someone jumped down a creaky staircase. There was no cupboard.”
- ES: “Alguien bajó de un salto por una escalera que crujía. No había ningún armario.”
- States: incident.place=staircase
- Reveal EN: Contradicts: “The only scare happened beside a rattling cupboard.” The case file says the only scare happened beside a rattling cupboard. Could both be true? None: it was the only scare, and it happened beside the cupboard.
- Reveal ES: Contradice: “El único susto ocurrió junto a un armario que se sacudía.” Según el expediente, el único susto ocurrió junto a un armario que se sacudía. ¿Pueden ser ciertas las dos cosas? Ninguna: fue el único susto y ocurrió junto al armario.
- Follow-up: “Who was on the staircase?” / “¿Quién estaba en la escalera?”

| id | kind | EN | ES | states | reveal (EN) |
|---|---|---|---|---|---|
| q5d1 | Contradicts the case file | An actor with no mask. | Un actor sin máscara. | incident.who=unmasked-actor | Contradicts: “The only scare was a masked actor.” The case file says the only scare was a masked actor. Could both be true? Face paint could be under a mask, but this says there was no mask, and it was the only scare. |
| q5d2 | Compatible with the case file · correction | Wait, it was a masked actor beside a rattling cupboard. Not a staircase. | Espera, era un actor con máscara junto a un armario que se sacudía. No una escalera. | incident.who=masked-actor, incident.place=cupboard | Compatible with: “The only scare was a masked actor.” Compatible with: “The only scare happened beside a rattling cupboard.” Corrects what this person said earlier. It lowers confidence, but it is not a contradiction by itself. |
| q5d3 | Vague or evasive | I didn't get a good look. | No alcancé a verlo bien. | — | Says nothing checkable. Being vague doesn't prove anyone is lying. |

### q5e · Unsupported extra detail
- EN: “Someone behind me screamed.”
- ES: “Alguien detrás de mí gritó.”
- States: —
- Reveal EN: Fits a scare, but screams are never mentioned. Can't be checked.
- Reveal ES: Encaja con un susto, pero los gritos no aparecen en el expediente. No se puede comprobar.
- Follow-up: “What made them scream?” / “¿Por qué gritó?”

| id | kind | EN | ES | states | reveal (EN) |
|---|---|---|---|---|---|
| q5e1 | Compatible with the case file | A masked actor, right by a rattling cupboard. | Un actor con máscara, justo al lado de un armario que se sacudía. | incident.who=masked-actor, incident.place=cupboard | Compatible with: “The only scare was a masked actor.” Compatible with: “The only scare happened beside a rattling cupboard.” |
| q5e2 | Contradicts the case file | An actor with no mask, on a staircase. | Un actor sin máscara, en una escalera. | incident.who=unmasked-actor, incident.place=staircase | Contradicts: “The only scare was a masked actor.” Contradicts: “The only scare happened beside a rattling cupboard.” The case file says the only scare was a masked actor. Could both be true? Face paint could be under a mask, but this says there was no mask, and it was the only scare. |
| q5e3 | Vague or evasive | I didn't turn around to look. | No me volteé a ver. | — | Says nothing checkable. Being vague doesn't prove anyone is lying. |

## q6 · Incident — “After everyone moved suddenly, where did your group go?” / “Cuando todos se movieron de repente, ¿a dónde fue tu grupo?”

### q6a · Compatible with the case file
- EN: “We hurried toward the exit.”
- ES: “Nos apresuramos hacia la salida.”
- States: incident.after=exit
- Reveal EN: Compatible with: “The group hurried toward the exit.”
- Reveal ES: Compatible con: “El grupo se apresuró hacia la salida.”
- Follow-up: “What were you hurrying away from?” / “¿De qué se estaban alejando?”

| id | kind | EN | ES | states | reveal (EN) |
|---|---|---|---|---|---|
| q6a1 | Compatible with the case file | A masked actor by a rattling cupboard. | De un actor con máscara junto a un armario que se sacudía. | incident.who=masked-actor, incident.place=cupboard | Compatible with: “The only scare was a masked actor.” Compatible with: “The only scare happened beside a rattling cupboard.” |
| q6a2 | Contradicts the case file | An actor with no mask, on a staircase. | De un actor sin máscara, en una escalera. | incident.who=unmasked-actor, incident.place=staircase | Contradicts: “The only scare was a masked actor.” Contradicts: “The only scare happened beside a rattling cupboard.” The case file says the only scare was a masked actor. Could both be true? Face paint could be under a mask, but this says there was no mask, and it was the only scare. |
| q6a3 | Vague or evasive | Something scary behind us. | De algo que daba miedo detrás de nosotros. | — | Says nothing checkable. Being vague doesn't prove anyone is lying. |

### q6b · Contradicts the case file
- EN: “We ran back to the entrance.”
- ES: “Regresamos corriendo a la entrada.”
- States: incident.after=back-to-entrance
- Reveal EN: Contradicts: “The group hurried toward the exit.” The case file says the group hurried toward the exit. Could both be true? None: running back to the entrance is the opposite direction at the same moment.
- Reveal ES: Contradice: “El grupo se apresuró hacia la salida.” Según el expediente, el grupo se apresuró hacia la salida. ¿Pueden ser ciertas las dos cosas? Ninguna: regresar corriendo a la entrada es la dirección opuesta en el mismo momento.
- Follow-up: “Why go back to the entrance?” / “¿Por qué regresar a la entrada?”

| id | kind | EN | ES | states | reveal (EN) |
|---|---|---|---|---|---|
| q6b1 | Unsupported extra detail | We wanted to start over. | Queríamos empezar de nuevo. | — | Can't be checked on its own; it only keeps the earlier conflicting story going. |
| q6b2 | Compatible with the case file · correction | Sorry, I mean the exit. We hurried out. | Perdón, quise decir la salida. Salimos deprisa. | incident.after=exit | Compatible with: “The group hurried toward the exit.” Corrects what this person said earlier. It lowers confidence, but it is not a contradiction by itself. |
| q6b3 | Vague or evasive | Everyone else went that way. | Todos los demás fueron por ahí. | — | Says nothing checkable. Being vague doesn't prove anyone is lying. |

### q6c · Compatible with the case file
- EN: “We hurried away from the rattling cupboard.”
- ES: “Nos alejamos deprisa del armario que se sacudía.”
- States: incident.place=cupboard
- Reveal EN: Compatible with: “The only scare happened beside a rattling cupboard.”
- Reveal ES: Compatible con: “El único susto ocurrió junto a un armario que se sacudía.”
- Follow-up: “Where did you go?” / “¿A dónde fueron?”

| id | kind | EN | ES | states | reveal (EN) |
|---|---|---|---|---|---|
| q6c1 | Compatible with the case file | Toward the exit. | Hacia la salida. | incident.after=exit | Compatible with: “The group hurried toward the exit.” |
| q6c2 | Contradicts the case file | Back to the entrance. | De vuelta a la entrada. | incident.after=back-to-entrance | Contradicts: “The group hurried toward the exit.” The case file says the group hurried toward the exit. Could both be true? None: running back to the entrance is the opposite direction at the same moment. |
| q6c3 | Vague or evasive | Wherever the group went. | A donde fuera el grupo. | — | Says nothing checkable. Being vague doesn't prove anyone is lying. |

### q6d · Contradicts the case file
- EN: “We stopped and stayed to watch the actor.”
- ES: “Nos detuvimos y nos quedamos a mirar al actor.”
- States: incident.after=stayed
- Reveal EN: Contradicts: “The group hurried toward the exit.” The case file says the group hurried toward the exit. Could both be true? None: stopping to watch is not hurrying away.
- Reveal ES: Contradice: “El grupo se apresuró hacia la salida.” Según el expediente, el grupo se apresuró hacia la salida. ¿Pueden ser ciertas las dos cosas? Ninguna: quedarse a mirar no es alejarse deprisa.
- Follow-up: “How long did you stay?” / “¿Cuánto tiempo se quedaron?”

| id | kind | EN | ES | states | reveal (EN) |
|---|---|---|---|---|---|
| q6d1 | Unsupported extra detail | Until the actor took a bow. | Hasta que el actor hizo una reverencia. | — | Can't be checked on its own; it only keeps the earlier conflicting story going. |
| q6d2 | Compatible with the case file · correction | Just a second. Then we hurried to the exit. | Solo un segundo. Luego nos apresuramos a la salida. | incident.after=exit | Compatible with: “The group hurried toward the exit.” Corrects what this person said earlier. It lowers confidence, but it is not a contradiction by itself. |
| q6d3 | Vague or evasive | I lost track of time. | Perdí la noción del tiempo. | — | Says nothing checkable. Being vague doesn't prove anyone is lying. |

### q6e · Vague or evasive
- EN: “I laughed. I get nervous.”
- ES: “Me reí. Me dan nervios.”
- States: —
- Reveal EN: Doesn't say where the group went, so there is nothing to check.
- Reveal ES: No dice a dónde fue el grupo, así que no hay nada que comprobar.
- Follow-up: “And what did your group do?” / “¿Y qué hizo tu grupo?”

| id | kind | EN | ES | states | reveal (EN) |
|---|---|---|---|---|---|
| q6e1 | Compatible with the case file | Hurried toward the exit. | Se apresuró hacia la salida. | incident.after=exit | Compatible with: “The group hurried toward the exit.” |
| q6e2 | Contradicts the case file | Ran back to the entrance. | Regresó corriendo a la entrada. | incident.after=back-to-entrance | Contradicts: “The group hurried toward the exit.” The case file says the group hurried toward the exit. Could both be true? None: running back to the entrance is the opposite direction at the same moment. |
| q6e3 | Vague or evasive | Laughed with me, I think. | Se rió conmigo, creo. | — | Says nothing checkable. Being vague doesn't prove anyone is lying. |

## Final bluff questions
- **entrance.marker**: “What was at the entrance where tickets were collected?” / “¿Qué había en la entrada donde se recogían los boletos?” — A red curtain / Una cortina roja · A glass ticket booth / Una taquilla de vidrio · A metal turnstile / Un torniquete de metal · A wooden gate / Una reja de madera
- **tickets.who**: “Who collected the tickets?” / “¿Quién recogía los boletos?” — A guide / Un guía · A ticket machine / Una máquina de boletos · A security guard / Un guardia de seguridad · Nobody, entry was free / Nadie, la entrada era libre
- **entry.group**: “How did visitors go in?” / “¿Cómo entraban los visitantes?” — In small groups / En grupos pequeños · One at a time / De uno en uno · All at once, as a big crowd / Todos a la vez, en multitud
- **route.light**: “What were the corridors like?” / “¿Cómo eran los pasillos?” — Dark / Oscuros · Brightly lit / Muy iluminados · Full of flashing colored lights / Llenos de luces de colores
- **route.marker**: “What marked the route?” / “¿Qué marcaba el camino?” — A line on the floor / Una línea en el piso · Glowing signs on the walls / Letreros luminosos en las paredes · A rope to hold on to / Una cuerda para sujetarse · Nothing; visitors found their own way / Nada; cada quien encontraba el camino
- **incident.who**: “Who caused the scare?” / “¿Quién causó el susto?” — A masked actor / Un actor con máscara · An actor with face paint and no mask / Un actor con la cara pintada y sin máscara · A giant puppet / Una marioneta gigante · A magician / Un mago
- **incident.place**: “Where did the scare happen?” / “¿Dónde ocurrió el susto?” — Beside a rattling cupboard / Junto a un armario que se sacudía · On a creaky staircase / En una escalera que crujía · Out of a coffin / De un ataúd · Behind a mirror / Detrás de un espejo
- **incident.after**: “What did the group do right after?” / “¿Qué hizo el grupo justo después?” — Hurried toward the exit / Se apresuró hacia la salida · Ran back to the entrance / Regresó corriendo a la entrada · Stopped and stayed to watch / Se detuvo a mirar · Sat down on the floor / Se sentó en el piso

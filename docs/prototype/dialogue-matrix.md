# Haunted House — dialogue matrix (EN / ES)

Generated from `app/src/prototype/caseData.ts` by `tools/proto-matrix.ts`. Do not edit by hand.
Classification and explanations are authoring metadata, shown to players only at the reveal.

## Evidence
- **A. Entrance / Entrada** — A guide collected tickets at a red curtain. Visitors entered in small groups. / Un guía recogía los boletos junto a una cortina roja. Los visitantes entraban en grupos pequeños.
- **B. Route / Recorrido** — Visitors walked through dark corridors. A green floor line marked the route. / Los visitantes recorrían pasillos oscuros. Una línea verde en el piso marcaba el camino.
- **C. Incident / Incidente** — A masked actor appeared beside a rattling cupboard. The group hurried toward the exit. / Un actor con máscara apareció junto a un armario que se sacudía. El grupo se apresuró hacia la salida.

## q1 · Entrance — “What happened before you went inside?” / “¿Qué pasó antes de que entraras?”

### q1a · Matches the case file
- EN: “A guide took our tickets.”
- ES: “Un guía nos recogió los boletos.”
- States: tickets.collected=yes, tickets.who=guide
- Reveal EN: Matches: “A guide collected the tickets.”
- Reveal ES: Coincide con: “Un guía recogía los boletos.”
- Follow-up: “What did the guide do after taking your ticket?” / “¿Qué hizo el guía después de recoger tu boleto?”

| id | class | EN | ES | states | reveal (EN) |
|---|---|---|---|---|---|
| q1a1 | Matches the case file | Held a red curtain open and let a few of us in. | Abrió una cortina roja y nos dejó pasar a unos pocos. | entrance.marker=red-curtain, entry.group=small | Matches: “Tickets were collected at a red curtain.” Matches: “Visitors entered in small groups.” |
| q1a2 | Conflicts with the case file | Opened a blue door and let everyone in at once. | Abrió una puerta azul y nos dejó pasar a todos juntos. | entrance.marker=blue-door, entry.group=crowd | Conflicts with: “Tickets were collected at a red curtain.” Conflicts with: “Visitors entered in small groups.” |
| q1a3 | Can't be checked | Said something, but I was looking at my phone. | Dijo algo, pero yo estaba mirando mi teléfono. | — | Mentions nothing the case file covers, so it can't be checked. Being vague doesn't prove anyone is lying. |

### q1b · Conflicts with the case file
- EN: “We scanned our tickets at a machine. No staff were around.”
- ES: “Escaneamos los boletos en una máquina. No había personal.”
- States: tickets.who=machine, entry.staff=none
- Reveal EN: Conflicts with: “A guide collected the tickets.”
- Reveal ES: Contradice: “Un guía recogía los boletos.”
- Follow-up: “So how did you know when to go in?” / “¿Y cómo sabían cuándo entrar?”

| id | class | EN | ES | states | reveal (EN) |
|---|---|---|---|---|---|
| q1b1 | Can't be checked | A light flashed and a gate opened. | Parpadeó una luz y se abrió una reja. | — | Adds nothing checkable, and keeps the earlier machine story going. |
| q1b2 | Matches the case file (correction) | Actually, a guide took the tickets after the machine and waved us in. | En realidad, después de la máquina un guía recogió los boletos y nos hizo pasar. | tickets.collected=yes, tickets.who=guide, entry.staff=guide | Matches: “A guide collected the tickets.” Changes the earlier answer toward the case file. A correction is not proof either way. |
| q1b3 | Can't be checked | Everyone just walked, so I did too. | Todos caminaron, así que yo también. | — | Mentions nothing the case file covers, so it can't be checked. Being vague doesn't prove anyone is lying. |

### q1c · Matches the case file
- EN: “We waited at a red curtain until they let a few of us in.”
- ES: “Esperamos junto a una cortina roja hasta que dejaron pasar a unos pocos.”
- States: entrance.marker=red-curtain, entry.group=small
- Reveal EN: Matches: “Tickets were collected at a red curtain.” Matches: “Visitors entered in small groups.”
- Reveal ES: Coincide con: “Los boletos se recogían junto a una cortina roja.” Coincide con: “Los visitantes entraban en grupos pequeños.”
- Follow-up: “Who decided when your group could go in?” / “¿Quién decidía cuándo podía entrar tu grupo?”

| id | class | EN | ES | states | reveal (EN) |
|---|---|---|---|---|---|
| q1c1 | Matches the case file | A guide, once they had our tickets. | Un guía, cuando ya tenía nuestros boletos. | tickets.collected=yes, tickets.who=guide, entry.staff=guide | Matches: “A guide collected the tickets.” |
| q1c2 | Conflicts with the case file | A ticket machine. It beeped when it was our turn. | Una máquina de boletos. Pitaba cuando nos tocaba. | tickets.who=machine | Conflicts with: “A guide collected the tickets.” |
| q1c3 | Can't be checked | I guess it was timed. | Supongo que era por tiempo. | — | Mentions nothing the case file covers, so it can't be checked. Being vague doesn't prove anyone is lying. |

### q1d · Conflicts with the case file
- EN: “We waited at a blue door, then the whole crowd went in together.”
- ES: “Esperamos junto a una puerta azul y luego entró toda la multitud junta.”
- States: entrance.marker=blue-door, entry.group=crowd
- Reveal EN: Conflicts with: “Tickets were collected at a red curtain.” Conflicts with: “Visitors entered in small groups.”
- Reveal ES: Contradice: “Los boletos se recogían junto a una cortina roja.” Contradice: “Los visitantes entraban en grupos pequeños.”
- Follow-up: “How many people went in with you?” / “¿Cuántas personas entraron contigo?”

| id | class | EN | ES | states | reveal (EN) |
|---|---|---|---|---|---|
| q1d1 | Conflicts with the case file | Fifty or so. The whole line. | Unas cincuenta. Toda la fila. | entry.group=crowd | Conflicts with: “Visitors entered in small groups.” |
| q1d2 | Matches the case file (correction) | Hmm, maybe five or six of us. | Mmm, tal vez cinco o seis. | entry.group=small | Matches: “Visitors entered in small groups.” Changes the earlier answer toward the case file. A correction is not proof either way. |
| q1d3 | Can't be checked | I didn't count. | No los conté. | — | Mentions nothing the case file covers, so it can't be checked. Being vague doesn't prove anyone is lying. |

### q1e · Can't be checked
- EN: “We stood in line for a while.”
- ES: “Hicimos fila un buen rato.”
- States: —
- Reveal EN: A line isn't in the case file, so it can't be checked either way.
- Reveal ES: La fila no aparece en el expediente, así que no se puede comprobar.
- Follow-up: “What was at the front of the line?” / “¿Qué había al frente de la fila?”

| id | class | EN | ES | states | reveal (EN) |
|---|---|---|---|---|---|
| q1e1 | Matches the case file | A red curtain, and a guide taking tickets. | Una cortina roja y un guía recogiendo boletos. | entrance.marker=red-curtain, tickets.collected=yes, tickets.who=guide | Matches: “Tickets were collected at a red curtain.” Matches: “A guide collected the tickets.” |
| q1e2 | Conflicts with the case file | A blue door and a ticket machine. | Una puerta azul y una máquina de boletos. | entrance.marker=blue-door, tickets.who=machine | Conflicts with: “Tickets were collected at a red curtain.” Conflicts with: “A guide collected the tickets.” |
| q1e3 | Can't be checked | I couldn't see past the people ahead. | No veía más allá de la gente de adelante. | — | Mentions nothing the case file covers, so it can't be checked. Being vague doesn't prove anyone is lying. |

## q2 · Entrance — “Who let you in, and where?” / “¿Quién te dejó entrar, y dónde?”

### q2a · Matches the case file
- EN: “A guide, at a red curtain.”
- ES: “Un guía, junto a una cortina roja.”
- States: entry.staff=guide, entrance.marker=red-curtain
- Reveal EN: Matches: “Tickets were collected at a red curtain.”
- Reveal ES: Coincide con: “Los boletos se recogían junto a una cortina roja.”
- Follow-up: “Did you go in by yourself?” / “¿Entraste sin compañía?”

| id | class | EN | ES | states | reveal (EN) |
|---|---|---|---|---|---|
| q2a1 | Matches the case file | No, with a small group. | No, con un grupo pequeño. | entry.group=small | Matches: “Visitors entered in small groups.” |
| q2a2 | Conflicts with the case file | Yes, one person at a time. | Sí, de uno en uno. | entry.group=alone | Conflicts with: “Visitors entered in small groups.” |
| q2a3 | Can't be checked | With whoever was standing near me. | Con quien estuviera cerca de mí. | — | Mentions nothing the case file covers, so it can't be checked. Being vague doesn't prove anyone is lying. |

### q2b · Conflicts with the case file
- EN: “A guide, at a blue door.”
- ES: “Un guía, junto a una puerta azul.”
- States: entry.staff=guide, entrance.marker=blue-door
- Reveal EN: Conflicts with: “Tickets were collected at a red curtain.” A guide fits the case file, but the entrance was a red curtain, not a door.
- Reveal ES: Contradice: “Los boletos se recogían junto a una cortina roja.” Un guía encaja con el expediente, pero la entrada era una cortina roja, no una puerta.
- Follow-up: “What did the door look like?” / “¿Cómo era la puerta?”

| id | class | EN | ES | states | reveal (EN) |
|---|---|---|---|---|---|
| q2b1 | Conflicts with the case file | Plain blue, with a skull sticker on it. | Azul, sencilla, con una calcomanía de calavera. | entrance.marker=blue-door | Conflicts with: “Tickets were collected at a red curtain.” |
| q2b2 | Matches the case file (correction) | Wait, it was a red curtain, not a door. | Espera, era una cortina roja, no una puerta. | entrance.marker=red-curtain | Matches: “Tickets were collected at a red curtain.” Changes the earlier answer toward the case file. A correction is not proof either way. |
| q2b3 | Can't be checked | I was looking for my ticket, not at the door. | Estaba buscando mi boleto, no miraba la puerta. | — | Mentions nothing the case file covers, so it can't be checked. Being vague doesn't prove anyone is lying. |

### q2c · Matches the case file
- EN: “Someone sent us in a few at a time.”
- ES: “Alguien nos hacía pasar de a pocos.”
- States: entry.group=small
- Reveal EN: Matches: “Visitors entered in small groups.”
- Reveal ES: Coincide con: “Los visitantes entraban en grupos pequeños.”
- Follow-up: “What did you hand to that person?” / “¿Qué le entregaste a esa persona?”

| id | class | EN | ES | states | reveal (EN) |
|---|---|---|---|---|---|
| q2c1 | Matches the case file | My ticket. | Mi boleto. | tickets.collected=yes | Fits part of: “A guide collected the tickets.” |
| q2c2 | Conflicts with the case file | Nothing. They just pointed us in. | Nada. Solo nos señaló la entrada. | tickets.collected=no | Conflicts with: “A guide collected the tickets.” |
| q2c3 | Can't be checked | I don't remember. | No me acuerdo. | — | Mentions nothing the case file covers, so it can't be checked. Being vague doesn't prove anyone is lying. |

### q2d · Conflicts with the case file
- EN: “Nobody. I walked in on my own.”
- ES: “Nadie. Entré por mi cuenta.”
- States: entry.staff=none, entry.group=alone
- Reveal EN: Conflicts with: “Visitors entered in small groups.”
- Reveal ES: Contradice: “Los visitantes entraban en grupos pequeños.”
- Follow-up: “Nobody checked your ticket?” / “¿Nadie revisó tu boleto?”

| id | class | EN | ES | states | reveal (EN) |
|---|---|---|---|---|---|
| q2d1 | Conflicts with the case file | Nope. It stayed in my pocket. | No. Se quedó en mi bolsillo. | tickets.collected=no | Conflicts with: “A guide collected the tickets.” |
| q2d2 | Matches the case file (correction) | Oh, a guide took it first, at the red curtain. | Ah, primero un guía lo recogió, junto a la cortina roja. | tickets.collected=yes, tickets.who=guide, entry.staff=guide, entrance.marker=red-curtain | Matches: “A guide collected the tickets.” Matches: “Tickets were collected at a red curtain.” Changes the earlier answer toward the case file. A correction is not proof either way. |
| q2d3 | Can't be checked | Maybe someone did. It was busy. | Quizá alguien lo revisó. Había mucha gente. | — | Mentions nothing the case file covers, so it can't be checked. Being vague doesn't prove anyone is lying. |

### q2e · Can't be checked
- EN: “A staff member. I didn't notice much else.”
- ES: “Alguien del personal. No me fijé en mucho más.”
- States: —
- Reveal EN: Could fit a guide, but too vague to check anything.
- Reveal ES: Podría ser el guía, pero es demasiado vago para comprobar algo.
- Follow-up: “What was that staff member standing next to?” / “¿Junto a qué estaba esa persona del personal?”

| id | class | EN | ES | states | reveal (EN) |
|---|---|---|---|---|---|
| q2e1 | Matches the case file | A red curtain. | Una cortina roja. | entrance.marker=red-curtain | Matches: “Tickets were collected at a red curtain.” |
| q2e2 | Conflicts with the case file | A blue door. | Una puerta azul. | entrance.marker=blue-door | Conflicts with: “Tickets were collected at a red curtain.” |
| q2e3 | Can't be checked | I honestly didn't notice. | La verdad, no me fijé. | — | Mentions nothing the case file covers, so it can't be checked. Being vague doesn't prove anyone is lying. |

## q3 · Route — “How did you know where to go?” / “¿Cómo sabías por dónde ir?”

### q3a · Matches the case file
- EN: “I followed a green line on the floor.”
- ES: “Seguí una línea verde en el piso.”
- States: route.marker=green-line
- Reveal EN: Matches: “A green floor line marked the route.”
- Reveal ES: Coincide con: “Una línea verde en el piso marcaba el camino.”
- Follow-up: “Could you see anything else?” / “¿Podías ver algo más?”

| id | class | EN | ES | states | reveal (EN) |
|---|---|---|---|---|---|
| q3a1 | Matches the case file | Not really. The corridors were dark. | No mucho. Los pasillos estaban oscuros. | route.light=dark | Fits part of: “Visitors walked through dark corridors.” |
| q3a2 | Conflicts with the case file | Sure, the hallways were well lit. | Claro, los pasillos estaban bien iluminados. | route.light=bright | Conflicts with: “Visitors walked through dark corridors.” |
| q3a3 | Can't be checked | Mostly the backs of people's heads. | Sobre todo la nuca de la gente. | — | Mentions nothing the case file covers, so it can't be checked. Being vague doesn't prove anyone is lying. |

### q3b · Conflicts with the case file
- EN: “I followed a blue line on the floor.”
- ES: “Seguí una línea azul en el piso.”
- States: route.marker=blue-line
- Reveal EN: Conflicts with: “A green floor line marked the route.”
- Reveal ES: Contradice: “Una línea verde en el piso marcaba el camino.”
- Follow-up: “Are you sure it was blue?” / “¿Seguro que era azul?”

| id | class | EN | ES | states | reveal (EN) |
|---|---|---|---|---|---|
| q3b1 | Conflicts with the case file | Yes. Bright blue. | Sí. Azul brillante. | route.marker=blue-line | Conflicts with: “A green floor line marked the route.” |
| q3b2 | Matches the case file (correction) | Hmm... maybe green. It was dark in there. | Mmm… tal vez verde. Ahí adentro estaba oscuro. | route.marker=green-line, route.light=dark | Matches: “A green floor line marked the route.” Fits part of: “Visitors walked through dark corridors.” Changes the earlier answer toward the case file. A correction is not proof either way. |
| q3b3 | Can't be checked | Does the color really matter? | ¿De verdad importa el color? | — | Dodges the question instead of answering it. |

### q3c · Matches the case file
- EN: “I stayed close to my group in the dark.”
- ES: “Me quedé cerca de mi grupo en la oscuridad.”
- States: route.light=dark
- Reveal EN: Fits part of: “Visitors walked through dark corridors.”
- Reveal ES: Encaja con parte de: “Los visitantes recorrían pasillos oscuros.”
- Follow-up: “How many people were in your group?” / “¿Cuántas personas había en tu grupo?”

| id | class | EN | ES | states | reveal (EN) |
|---|---|---|---|---|---|
| q3c1 | Matches the case file | Five or six. | Cinco o seis. | entry.group=small | Matches: “Visitors entered in small groups.” |
| q3c2 | Conflicts with the case file | Around forty. The whole crowd. | Unas cuarenta. Toda la multitud. | entry.group=crowd | Conflicts with: “Visitors entered in small groups.” |
| q3c3 | Can't be checked | Enough to keep bumping into each other. | Suficientes para chocar todo el rato. | — | Mentions nothing the case file covers, so it can't be checked. Being vague doesn't prove anyone is lying. |

### q3d · Conflicts with the case file
- EN: “Signs lit up the hallway, so it was easy.”
- ES: “Unos letreros iluminaban el pasillo, así que fue fácil.”
- States: route.light=bright
- Reveal EN: Conflicts with: “Visitors walked through dark corridors.” The case file says the corridors were dark. (Signs themselves are not ruled out.)
- Reveal ES: Contradice: “Los visitantes recorrían pasillos oscuros.” Según el expediente los pasillos estaban oscuros. (Los letreros en sí no se descartan.)
- Follow-up: “What did the signs say?” / “¿Qué decían los letreros?”

| id | class | EN | ES | states | reveal (EN) |
|---|---|---|---|---|---|
| q3d1 | Can't be checked | Arrows and the word EXIT. | Flechas y la palabra SALIDA. | — | Adds nothing checkable, and keeps the bright-hallway story going. |
| q3d2 | Matches the case file (correction) | Sorry, it was too dark to read signs. I watched the floor. | Perdón, estaba demasiado oscuro para leer letreros. Miraba el piso. | route.light=dark | Fits part of: “Visitors walked through dark corridors.” Changes the earlier answer toward the case file. A correction is not proof either way. |
| q3d3 | Can't be checked | I didn't read them. I just walked. | No los leí. Solo caminé. | — | Mentions nothing the case file covers, so it can't be checked. Being vague doesn't prove anyone is lying. |

### q3e · Can't be checked
- EN: “I kept watching the floor.”
- ES: “Iba mirando el piso.”
- States: —
- Reveal EN: Hints at something on the floor, but names nothing checkable.
- Reveal ES: Insinúa algo en el piso, pero no nombra nada comprobable.
- Follow-up: “What were you looking for?” / “¿Qué buscabas?”

| id | class | EN | ES | states | reveal (EN) |
|---|---|---|---|---|---|
| q3e1 | Matches the case file | The green line that marked the way. | La línea verde que marcaba el camino. | route.marker=green-line | Matches: “A green floor line marked the route.” |
| q3e2 | Conflicts with the case file | The blue line that marked the way. | La línea azul que marcaba el camino. | route.marker=blue-line | Conflicts with: “A green floor line marked the route.” |
| q3e3 | Can't be checked | Anything I might trip over. | Cualquier cosa con la que pudiera tropezar. | — | Mentions nothing the case file covers, so it can't be checked. Being vague doesn't prove anyone is lying. |

## q4 · Route — “What was it like walking through?” / “¿Cómo era el recorrido por dentro?”

### q4a · Matches the case file
- EN: “Dark corridors. I could barely see my hands.”
- ES: “Pasillos oscuros. Apenas me veía las manos.”
- States: route.mode=walked, route.light=dark
- Reveal EN: Matches: “Visitors walked through dark corridors.”
- Reveal ES: Coincide con: “Los visitantes recorrían pasillos oscuros.”
- Follow-up: “Then how did you find the way?” / “¿Y cómo encontraste el camino?”

| id | class | EN | ES | states | reveal (EN) |
|---|---|---|---|---|---|
| q4a1 | Matches the case file | A green line on the floor. | Una línea verde en el piso. | route.marker=green-line | Matches: “A green floor line marked the route.” |
| q4a2 | Conflicts with the case file | A blue line on the floor. | Una línea azul en el piso. | route.marker=blue-line | Conflicts with: “A green floor line marked the route.” |
| q4a3 | Can't be checked | I kept one hand on the wall. | Iba con una mano en la pared. | — | Mentions nothing the case file covers, so it can't be checked. Being vague doesn't prove anyone is lying. |

### q4b · Conflicts with the case file
- EN: “Bright and open, like a school hallway.”
- ES: “Iluminado y amplio, como el pasillo de una escuela.”
- States: route.light=bright
- Reveal EN: Conflicts with: “Visitors walked through dark corridors.”
- Reveal ES: Contradice: “Los visitantes recorrían pasillos oscuros.”
- Follow-up: “Where was the light coming from?” / “¿De dónde venía la luz?”

| id | class | EN | ES | states | reveal (EN) |
|---|---|---|---|---|---|
| q4b1 | Conflicts with the case file | Big lights on the ceiling. | De unas lámparas grandes en el techo. | route.light=bright | Conflicts with: “Visitors walked through dark corridors.” |
| q4b2 | Matches the case file (correction) | Well... it was mostly dark. Just a faint glow. | Bueno… estaba casi todo oscuro. Solo un brillo tenue. | route.light=dark | Fits part of: “Visitors walked through dark corridors.” Changes the earlier answer toward the case file. A correction is not proof either way. |
| q4b3 | Can't be checked | Somewhere up ahead. | De algún lugar más adelante. | — | Mentions nothing the case file covers, so it can't be checked. Being vague doesn't prove anyone is lying. |

### q4c · Matches the case file
- EN: “Narrow corridors. We had to walk one behind another.”
- ES: “Pasillos angostos. Teníamos que caminar uno detrás de otro.”
- States: route.mode=walked
- Reveal EN: Fits part of: “Visitors walked through dark corridors.” Matches walking through corridors, but says nothing about light or the floor line.
- Reveal ES: Encaja con parte de: “Los visitantes recorrían pasillos oscuros.” Coincide con recorrer pasillos, pero no dice nada de la luz ni de la línea del piso.
- Follow-up: “Who was at the front?” / “¿Quién iba al frente?”

| id | class | EN | ES | states | reveal (EN) |
|---|---|---|---|---|---|
| q4c1 | Matches the case file | Me, following a green line. | Yo, siguiendo una línea verde. | route.marker=green-line | Matches: “A green floor line marked the route.” |
| q4c2 | Conflicts with the case file | Me, following a blue line. | Yo, siguiendo una línea azul. | route.marker=blue-line | Conflicts with: “A green floor line marked the route.” |
| q4c3 | Can't be checked | A tall guy. I stayed in the middle. | Un tipo alto. Yo iba en medio. | — | Mentions nothing the case file covers, so it can't be checked. Being vague doesn't prove anyone is lying. |

### q4d · Conflicts with the case file
- EN: “We sat in rows and watched. We didn't walk much.”
- ES: “Nos sentamos en filas a mirar. Casi no caminamos.”
- States: route.mode=seated
- Reveal EN: Conflicts with: “Visitors walked through dark corridors.”
- Reveal ES: Contradice: “Los visitantes recorrían pasillos oscuros.”
- Follow-up: “What were you watching?” / “¿Qué estaban mirando?”

| id | class | EN | ES | states | reveal (EN) |
|---|---|---|---|---|---|
| q4d1 | Conflicts with the case file | Actors on a stage. | Actores en un escenario. | route.mode=seated | Conflicts with: “Visitors walked through dark corridors.” |
| q4d2 | Matches the case file (correction) | Sorry, I mixed it up. We walked through dark corridors. | Perdón, me confundí. Recorrimos pasillos oscuros. | route.mode=walked, route.light=dark | Matches: “Visitors walked through dark corridors.” Changes the earlier answer toward the case file. A correction is not proof either way. |
| q4d3 | Can't be checked | Whatever was in front of us. | Lo que hubiera enfrente. | — | Mentions nothing the case file covers, so it can't be checked. Being vague doesn't prove anyone is lying. |

### q4e · Can't be checked
- EN: “Creepy music played the whole time.”
- ES: “Hubo música tétrica todo el tiempo.”
- States: —
- Reveal EN: Music isn't in the case file, so it can't be checked either way.
- Reveal ES: La música no aparece en el expediente, así que no se puede comprobar.
- Follow-up: “Did the music ever change?” / “¿La música cambió en algún momento?”

| id | class | EN | ES | states | reveal (EN) |
|---|---|---|---|---|---|
| q4e1 | Matches the case file | It got loud when a cupboard started rattling. | Subió de volumen cuando un armario empezó a sacudirse. | incident.place=cupboard | Matches: “The actor appeared beside a rattling cupboard.” |
| q4e2 | Conflicts with the case file | It got loud when an actor without a mask showed up. | Subió de volumen cuando apareció un actor sin máscara. | incident.who=unmasked-actor | Conflicts with: “A masked actor appeared.” |
| q4e3 | Can't be checked | Not that I noticed. | No que yo notara. | — | Mentions nothing the case file covers, so it can't be checked. Being vague doesn't prove anyone is lying. |

## q5 · Incident — “What made everyone move suddenly?” / “¿Qué hizo que todos se movieran de repente?”

### q5a · Matches the case file
- EN: “A masked actor jumped out.”
- ES: “Salió de golpe un actor con máscara.”
- States: incident.who=masked-actor
- Reveal EN: Matches: “A masked actor appeared.”
- Reveal ES: Coincide con: “Apareció un actor con máscara.”
- Follow-up: “Where did the actor come from?” / “¿De dónde salió el actor?”

| id | class | EN | ES | states | reveal (EN) |
|---|---|---|---|---|---|
| q5a1 | Matches the case file | From beside a rattling cupboard. | De al lado de un armario que se sacudía. | incident.place=cupboard | Matches: “The actor appeared beside a rattling cupboard.” |
| q5a2 | Conflicts with the case file | From the top of a creaky staircase. | De lo alto de una escalera que crujía. | incident.place=staircase | Conflicts with: “The actor appeared beside a rattling cupboard.” |
| q5a3 | Can't be checked | Somewhere on my left. | De algún lado a mi izquierda. | — | Mentions nothing the case file covers, so it can't be checked. Being vague doesn't prove anyone is lying. |

### q5b · Conflicts with the case file
- EN: “An actor with no mask, just face paint.”
- ES: “Un actor sin máscara, solo con la cara pintada.”
- States: incident.who=unmasked-actor
- Reveal EN: Conflicts with: “A masked actor appeared.”
- Reveal ES: Contradice: “Apareció un actor con máscara.”
- Follow-up: “What did the face paint look like?” / “¿Cómo era la pintura de la cara?”

| id | class | EN | ES | states | reveal (EN) |
|---|---|---|---|---|---|
| q5b1 | Can't be checked | White, with big black eyes. | Blanca, con ojos negros enormes. | — | Adds nothing checkable, and keeps the no-mask story going. |
| q5b2 | Matches the case file (correction) | Hmm, maybe it was a mask, not paint. | Mmm, tal vez era una máscara, no pintura. | incident.who=masked-actor | Matches: “A masked actor appeared.” Changes the earlier answer toward the case file. A correction is not proof either way. |
| q5b3 | Can't be checked | Scary. I looked away. | Daba miedo. Aparté la mirada. | — | Mentions nothing the case file covers, so it can't be checked. Being vague doesn't prove anyone is lying. |

### q5c · Matches the case file
- EN: “A cupboard started rattling, and someone appeared beside it.”
- ES: “Un armario empezó a sacudirse y alguien apareció a su lado.”
- States: incident.place=cupboard
- Reveal EN: Matches: “The actor appeared beside a rattling cupboard.”
- Reveal ES: Coincide con: “El actor apareció junto a un armario que se sacudía.”
- Follow-up: “Who appeared?” / “¿Quién apareció?”

| id | class | EN | ES | states | reveal (EN) |
|---|---|---|---|---|---|
| q5c1 | Matches the case file | An actor in a mask. | Un actor con máscara. | incident.who=masked-actor | Matches: “A masked actor appeared.” |
| q5c2 | Conflicts with the case file | An actor without a mask. | Un actor sin máscara. | incident.who=unmasked-actor | Conflicts with: “A masked actor appeared.” |
| q5c3 | Can't be checked | I didn't get a good look. | No alcancé a verlo bien. | — | Mentions nothing the case file covers, so it can't be checked. Being vague doesn't prove anyone is lying. |

### q5d · Conflicts with the case file
- EN: “A staircase creaked, and someone appeared on it.”
- ES: “Crujió una escalera y alguien apareció en ella.”
- States: incident.place=staircase
- Reveal EN: Conflicts with: “The actor appeared beside a rattling cupboard.”
- Reveal ES: Contradice: “El actor apareció junto a un armario que se sacudía.”
- Follow-up: “Who was on the staircase?” / “¿Quién estaba en la escalera?”

| id | class | EN | ES | states | reveal (EN) |
|---|---|---|---|---|---|
| q5d1 | Conflicts with the case file | An actor with no mask. | Un actor sin máscara. | incident.who=unmasked-actor | Conflicts with: “A masked actor appeared.” |
| q5d2 | Matches the case file (correction) | Wait, it was a masked actor, beside a rattling cupboard. Not a staircase. | Espera, era un actor con máscara, junto a un armario que se sacudía. No una escalera. | incident.who=masked-actor, incident.place=cupboard | Matches: “A masked actor appeared.” Matches: “The actor appeared beside a rattling cupboard.” Changes the earlier answer toward the case file. A correction is not proof either way. |
| q5d3 | Can't be checked | I didn't get a good look. | No alcancé a verlo bien. | — | Mentions nothing the case file covers, so it can't be checked. Being vague doesn't prove anyone is lying. |

### q5e · Can't be checked
- EN: “Someone behind me screamed.”
- ES: “Alguien detrás de mí gritó.”
- States: —
- Reveal EN: A scream isn't in the case file, so it can't be checked either way.
- Reveal ES: Un grito no aparece en el expediente, así que no se puede comprobar.
- Follow-up: “What made them scream?” / “¿Por qué gritó?”

| id | class | EN | ES | states | reveal (EN) |
|---|---|---|---|---|---|
| q5e1 | Matches the case file | A masked actor, right by a rattling cupboard. | Un actor con máscara, justo al lado de un armario que se sacudía. | incident.who=masked-actor, incident.place=cupboard | Matches: “A masked actor appeared.” Matches: “The actor appeared beside a rattling cupboard.” |
| q5e2 | Conflicts with the case file | An actor with no mask, on a staircase. | Un actor sin máscara, en una escalera. | incident.who=unmasked-actor, incident.place=staircase | Conflicts with: “A masked actor appeared.” Conflicts with: “The actor appeared beside a rattling cupboard.” |
| q5e3 | Can't be checked | I didn't turn around to look. | No me volteé a ver. | — | Mentions nothing the case file covers, so it can't be checked. Being vague doesn't prove anyone is lying. |

## q6 · Incident — “After everyone moved suddenly, where did your group go?” / “Cuando todos se movieron de repente, ¿a dónde fue tu grupo?”

### q6a · Matches the case file
- EN: “We hurried toward the exit.”
- ES: “Nos apresuramos hacia la salida.”
- States: incident.after=exit
- Reveal EN: Matches: “The group hurried toward the exit.”
- Reveal ES: Coincide con: “El grupo se apresuró hacia la salida.”
- Follow-up: “What were you hurrying away from?” / “¿De qué se estaban alejando?”

| id | class | EN | ES | states | reveal (EN) |
|---|---|---|---|---|---|
| q6a1 | Matches the case file | A masked actor by a rattling cupboard. | De un actor con máscara junto a un armario que se sacudía. | incident.who=masked-actor, incident.place=cupboard | Matches: “A masked actor appeared.” Matches: “The actor appeared beside a rattling cupboard.” |
| q6a2 | Conflicts with the case file | An actor with no mask, on a staircase. | De un actor sin máscara, en una escalera. | incident.who=unmasked-actor, incident.place=staircase | Conflicts with: “A masked actor appeared.” Conflicts with: “The actor appeared beside a rattling cupboard.” |
| q6a3 | Can't be checked | Something scary behind us. | De algo que daba miedo detrás de nosotros. | — | Mentions nothing the case file covers, so it can't be checked. Being vague doesn't prove anyone is lying. |

### q6b · Conflicts with the case file
- EN: “We ran back to the entrance.”
- ES: “Regresamos corriendo a la entrada.”
- States: incident.after=back-to-entrance
- Reveal EN: Conflicts with: “The group hurried toward the exit.”
- Reveal ES: Contradice: “El grupo se apresuró hacia la salida.”
- Follow-up: “Why go back to the entrance?” / “¿Por qué regresar a la entrada?”

| id | class | EN | ES | states | reveal (EN) |
|---|---|---|---|---|---|
| q6b1 | Can't be checked | We wanted to start over. | Queríamos empezar de nuevo. | — | Adds nothing checkable, and keeps the back-to-the-entrance story going. |
| q6b2 | Matches the case file (correction) | Sorry, I mean the exit. We hurried out. | Perdón, quise decir la salida. Salimos deprisa. | incident.after=exit | Matches: “The group hurried toward the exit.” Changes the earlier answer toward the case file. A correction is not proof either way. |
| q6b3 | Can't be checked | Everyone else went that way. | Todos los demás fueron por ahí. | — | Mentions nothing the case file covers, so it can't be checked. Being vague doesn't prove anyone is lying. |

### q6c · Matches the case file
- EN: “We hurried away from the rattling cupboard.”
- ES: “Nos alejamos deprisa del armario que se sacudía.”
- States: incident.place=cupboard
- Reveal EN: Matches: “The actor appeared beside a rattling cupboard.”
- Reveal ES: Coincide con: “El actor apareció junto a un armario que se sacudía.”
- Follow-up: “Where did you go?” / “¿A dónde fueron?”

| id | class | EN | ES | states | reveal (EN) |
|---|---|---|---|---|---|
| q6c1 | Matches the case file | Toward the exit. | Hacia la salida. | incident.after=exit | Matches: “The group hurried toward the exit.” |
| q6c2 | Conflicts with the case file | Back to the entrance. | De vuelta a la entrada. | incident.after=back-to-entrance | Conflicts with: “The group hurried toward the exit.” |
| q6c3 | Can't be checked | Wherever the group went. | A donde fuera el grupo. | — | Mentions nothing the case file covers, so it can't be checked. Being vague doesn't prove anyone is lying. |

### q6d · Conflicts with the case file
- EN: “We hurried away from the creaky staircase.”
- ES: “Nos alejamos deprisa de la escalera que crujía.”
- States: incident.place=staircase
- Reveal EN: Conflicts with: “The actor appeared beside a rattling cupboard.”
- Reveal ES: Contradice: “El actor apareció junto a un armario que se sacudía.”
- Follow-up: “Where did you go after that?” / “¿A dónde fueron después?”

| id | class | EN | ES | states | reveal (EN) |
|---|---|---|---|---|---|
| q6d1 | Conflicts with the case file | Back to the entrance. | De vuelta a la entrada. | incident.after=back-to-entrance | Conflicts with: “The group hurried toward the exit.” |
| q6d2 | Matches the case file (correction) | Toward the exit. And actually, it was a rattling cupboard, not stairs. | Hacia la salida. Y en realidad era un armario que se sacudía, no una escalera. | incident.after=exit, incident.place=cupboard | Matches: “The group hurried toward the exit.” Matches: “The actor appeared beside a rattling cupboard.” Changes the earlier answer toward the case file. A correction is not proof either way. |
| q6d3 | Can't be checked | Wherever the group went. | A donde fuera el grupo. | — | Mentions nothing the case file covers, so it can't be checked. Being vague doesn't prove anyone is lying. |

### q6e · Can't be checked
- EN: “I laughed. I get nervous.”
- ES: “Me reí. Me dan nervios.”
- States: —
- Reveal EN: Doesn't say where the group went, so there is nothing to check.
- Reveal ES: No dice a dónde fue el grupo, así que no hay nada que comprobar.
- Follow-up: “And what did your group do?” / “¿Y qué hizo tu grupo?”

| id | class | EN | ES | states | reveal (EN) |
|---|---|---|---|---|---|
| q6e1 | Matches the case file | Hurried toward the exit. | Se apresuró hacia la salida. | incident.after=exit | Matches: “The group hurried toward the exit.” |
| q6e2 | Conflicts with the case file | Ran back to the entrance. | Regresó corriendo a la entrada. | incident.after=back-to-entrance | Conflicts with: “The group hurried toward the exit.” |
| q6e3 | Can't be checked | Laughed with me, I think. | Se rió conmigo, creo. | — | Mentions nothing the case file covers, so it can't be checked. Being vague doesn't prove anyone is lying. |

## Final bluff questions
- **entrance.marker**: “What was at the entrance?” / “¿Qué había en la entrada?” — A red curtain / Una cortina roja · A blue door / Una puerta azul · A glass ticket booth / Una taquilla de vidrio · A metal turnstile / Un torniquete de metal
- **tickets.who**: “Who collected the tickets?” / “¿Quién recogía los boletos?” — A guide / Un guía · A ticket machine / Una máquina de boletos · A security guard / Un guardia de seguridad · Nobody, entry was free / Nadie, la entrada era libre
- **entry.group**: “How did visitors go in?” / “¿Cómo entraban los visitantes?” — In small groups / En grupos pequeños · One at a time / De uno en uno · All at once, as a big crowd / Todos a la vez, en multitud
- **route.light**: “What were the corridors like?” / “¿Cómo eran los pasillos?” — Dark / Oscuros · Brightly lit / Muy iluminados · Full of flashing colored lights / Llenos de luces de colores
- **route.marker**: “What marked the route?” / “¿Qué marcaba el camino?” — A green line on the floor / Una línea verde en el piso · A blue line on the floor / Una línea azul en el piso · A rope to hold on to / Una cuerda para sujetarse · A row of candles / Una fila de velas
- **incident.who**: “Who appeared during the visit?” / “¿Quién apareció durante la visita?” — A masked actor / Un actor con máscara · An actor with face paint and no mask / Un actor con la cara pintada y sin máscara · A giant puppet / Una marioneta gigante · A magician / Un mago
- **incident.place**: “Where did they appear?” / “¿Dónde apareció?” — Beside a rattling cupboard / Junto a un armario que se sacudía · On a creaky staircase / En una escalera que crujía · Out of a coffin / De un ataúd · Behind a mirror / Detrás de un espejo
- **incident.after**: “What did the group do right after?” / “¿Qué hizo el grupo justo después?” — Hurried toward the exit / Se apresuró hacia la salida · Ran back to the entrance / Regresó corriendo a la entrada · Stopped and clapped / Se detuvo a aplaudir · Sat down on the floor / Se sentó en el piso

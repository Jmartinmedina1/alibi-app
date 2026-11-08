# One stable ruleset: the Riverside Fair round

> **Objective (approved):** "Exactly one suspect gives a fabricated alibi. Everyone else gives an accurate account. Investigate the statements and identify the fabricated one."

**Status.**
- Design only. No gameplay code was changed.
- Every outcome below was checked with a small logic model: `tools/round-check/`, run with `python3 tools/round-check/tests.py`.
  - A *world* is where each suspect really was, plus a few facts.
  - A suspect stays possible as the Liar only if some world fits all the opened records and the other two suspects' statements, while that suspect's own place claim is false.

## 1. Audit of the Case Logic Prototype (`app/src/prototype/`)

| Area | Already supports the ruleset | Must change |
|---|---|---|
| Engine | Pure state machine, seeded and reproducible; out-of-turn and duplicate actions rejected | Phases: interrogation round-robin → *alibis, one question, one record, accusation* |
| Role knowledge | `knowledgeFor()` keeps private information from each role; tests check the boundary | The Liar currently knows only a *category*. It must know its **actual timeline** and pick a cover deliberately |
| Honest players | — | They can currently choose contradictions, vague or unsupported claims. They must give **only accurate** accounts |
| Locked answers | Testimony record; corrections are flagged | Remove correction branches: a follow-up may not replace an earlier claim |
| Evidence | Fixed facts; *compatible / contradiction / unsupported / vague*; the "unsupported ≠ false" rule; contradiction audit | Evidence is currently all shown at the briefing. It must become **records opened with the budget** |
| Choices | — | 5 claims and 3 follow-up responses → **A/B/C/D** everywhere |
| Judgments, bot suspicion scores, final bluff, points | — | Remove all of them. Bot vote scores (contradiction +3, …) must not appear as evidence |
| Vote | Tie rule, reveal with explanations | A single accusation, with **D: insufficient evidence** |
| Shell | EN/ES strings, 390 px screen, leave confirmation, QA scenarios kept separate, dev-only flag | Keep |

## 2. The complete round

### 2.1 Setting (everyone sees this)

- **The question.** Riverside Fair, Saturday night. At 9:20 the giant prize teddy bear vanished from the Prize Tent. Each suspect must say **where they were from 9:15 to 9:30**.
- **The rule everyone knows.** Exactly one alibi is fabricated; the other two are accurate.
- **Places.** **A** Ferris wheel · **B** Photo booth · **C** Food stalls · **D** Parking lot. The Prize Tent is not a valid alibi.
- **Map facts (public).**
  - The bench outside the photo booth faces the Ferris wheel.
  - The picnic tables at the food stalls overlook the parking lot.
- **Who wears what.** Only Chef Bruno wears a chef's hat. Only Skater Leo carries a skateboard.
- **Records catalogue (public before play; contents hidden until opened):**

| | Record | What it covers |
|---|---|---|
| A | Ferris wheel guard log | Who went inside the rope around the ride |
| B | Photo booth strip | Who was **inside** the booth when the strip printed |
| C | Churro vendor | Who was at the food stalls |
| D | Parking-lot gate camera | Who used the parking-lot gate |

### 2.2 Actual timelines (each suspect knows only their own)

| Suspect | Actual timeline |
|---|---|
| **Granny Dot** (honest) | 9:10 joins the photo-booth queue alone. 9:17–9:22 inside the booth (strip printed 9:20). 9:22–9:30 on the bench facing the Ferris wheel. |
| **Skater Leo** (honest) | 9:14 buys churros. 9:15–9:30 at the picnic tables, watching the parking lot. Sees a white van leave at 9:19. |
| **Chef Bruno** (the Liar) | 9:00–9:06 at his food truck in the parking lot. 9:06 walks out through the lot gate. 9:08 passes the Ferris wheel: stopped for repairs and roped off. **9:15–9:30 inside the Prize Tent.** |

### 2.3 Bruno's four possible false alibis, and the risks he can see

| Alibi | What Bruno knows that bears on the risk |
|---|---|
| **A · Ferris wheel** | He saw it stopped and roped off, so he can describe it accurately. The guard log covers only *inside* the rope. Danger he can't measure: anyone on the photo-booth bench could see the wheel. |
| **B · Photo booth** | The strip shows only the inside of the booth. Danger: if someone else was at the booth, they share his alibi place. |
| **C · Food stalls** | The vendor covers the stalls. If the vendor was there, any false claim there fails. He doesn't know whether the vendor stayed. |
| **D · Parking lot** | It's partly true: his truck is there. But he **knows** the gate camera filmed him walking out at 9:06. |

### 2.4 Accurate witness accounts (given only when that suspect is questioned)

- **Granny Dot (B):** "I was alone: inside the booth until 9:22, then on the bench facing the Ferris wheel. Nobody else came to the booth. The wheel was stopped and nobody was near it."
- **Skater Leo (C):** "At the picnic tables with churros I bought at 9:14. I watched the parking lot: a white van left at 9:19. Nobody else was at the stalls or in the lot."

### 2.5 Every permitted question and follow-up

1. **Alibis.** All three suspects lock a place (A–D) at the same time. An honest suspect's choice is their true place. Bruno chooses A–D.
2. **One question.** The Detective asks one suspect the follow-up for the place that suspect claimed:
   - **A** ask Granny Dot;
   - **B** ask Skater Leo;
   - **C** ask Chef Bruno;
   - **D** ask no one.
3. **The answer locks.** Honest suspects give their account (option A of their place). The Liar chooses one of the four options.

| Place · follow-up | A | B | C | D |
|---|---|---|---|---|
| **Ferris wheel** · "Where exactly were you, and what was the wheel doing?" | "I rode the wheel twice; it was running fine." | "It was stopped for repairs, so I stood on the path outside the rope watching the crew." | "It was stopped; I was inside the rope chatting with the repair crew." | "Near the wheel, looking at the lights. Nothing special." |
| **Photo booth** · "What did you do there, and who else was there?" | *Dot's account (2.4)* | "In the queue the whole time. The booth was busy." | "Inside the booth taking photos with Granny Dot." | "On the bench outside the booth. I didn't look around much." |
| **Food stalls** · "What did you do there, and who else was there?" | *Leo's account (2.4)* | "Buying churros at the counter, around 9:20." | "At the picnic tables. I didn't notice much." | "At the tables, next to the skateboarder." |
| **Parking lot** · "What were you doing in the lot, and who else was there?" | "Restocking my food truck in the back rows." | "Waiting by the gate for a friend." | "The lot was empty; I was on my own." | "I saw a white van drive out." |

There is no second question, and an answer can never be replaced.

### 2.6 Records: exact content and limitations (fixed before play)

| | Content when opened | Exact limitation |
|---|---|---|
| **A · Guard log** | "Closed for repairs 9:05–9:40. Nobody went inside the rope." | Covers only inside the rope; says nothing about the path outside it. |
| **B · Photo strip** | "Printed 9:20: Granny Dot, alone, inside the booth." | Shows only the inside of the booth at 9:20, not the queue or the bench. |
| **C · Churro vendor** | "Sold churros to a skateboarder at 9:14, closed the counter at 9:15, then cleaned the picnic tables until 9:30. The skateboarder was the only customer at the stalls the whole time." | Covers the food stalls only. |
| **D · Gate camera** | "A man in a chef's hat walked out at 9:06. A white van drove out at 9:19. Nobody else used the gate 9:00–9:30." | Shows only the gate. Someone already in the lot before 9:00 wouldn't appear. |

**Unsupported is not false:**
- A vague answer is never treated as a lie.
- A record that says nothing about a claim leaves it standing.

### 2.7 Investigation budget

**One question (2.5), then one record (A–D), in that order. Then the accusation.**

The order matters (see 3.4).

### 2.8 Every possible result of spending the budget

Each cell lists who could still be the Liar after that question and that record. "**Bruno only**" means the fabricated alibi has been identified.

The honest suspects are always Dot (photo booth) and Leo (food stalls).

#### Bruno claims A · Ferris wheel

| Question (answer) | Record A · guard log | Record B · photo strip | Record C · vendor | Record D · gate camera |
|---|---|---|---|---|
| A · ask Granny Dot | Dot or Bruno | **Bruno only** | Dot or Bruno | Dot or Bruno |
| B · ask Skater Leo | Dot or Leo or Bruno | Leo or Bruno | Dot or Bruno | Dot or Leo or Bruno |
| C · ask Chef Bruno → A | **Bruno only** | Leo or Bruno | Dot or Bruno | Dot or Leo or Bruno |
| C · ask Chef Bruno → B | Dot or Leo or Bruno | Leo or Bruno | Dot or Bruno | Dot or Leo or Bruno |
| C · ask Chef Bruno → C | **Bruno only** | Leo or Bruno | Dot or Bruno | Dot or Leo or Bruno |
| C · ask Chef Bruno → D | Dot or Leo or Bruno | Leo or Bruno | Dot or Bruno | Dot or Leo or Bruno |
| D · no question | Dot or Leo or Bruno | Leo or Bruno | Dot or Bruno | Dot or Leo or Bruno |

#### Bruno claims B · Photo booth

| Question (answer) | Record A · guard log | Record B · photo strip | Record C · vendor | Record D · gate camera |
|---|---|---|---|---|
| A · ask Granny Dot | Dot or Bruno | **Bruno only** | Dot or Bruno | Dot or Bruno |
| B · ask Skater Leo | Dot or Leo or Bruno | Leo or Bruno | Dot or Bruno | Dot or Leo or Bruno |
| C · ask Chef Bruno → A | Dot or Bruno | **Bruno only** | Dot or Bruno | Dot or Bruno |
| C · ask Chef Bruno → B | Dot or Leo or Bruno | Leo or Bruno | Dot or Bruno | Dot or Leo or Bruno |
| C · ask Chef Bruno → C | Leo or Bruno | **Bruno only** | **Bruno only** | Leo or Bruno |
| C · ask Chef Bruno → D | Dot or Leo or Bruno | Leo or Bruno | Dot or Bruno | Dot or Leo or Bruno |
| D · no question | Dot or Leo or Bruno | Leo or Bruno | Dot or Bruno | Dot or Leo or Bruno |

#### Bruno claims C · Food stalls

| Question (answer) | Record A · guard log | Record B · photo strip | Record C · vendor | Record D · gate camera |
|---|---|---|---|---|
| A · ask Granny Dot | Dot or Leo or Bruno | Leo or Bruno | **Bruno only** | Dot or Leo or Bruno |
| B · ask Skater Leo | Leo or Bruno | Leo or Bruno | **Bruno only** | Leo or Bruno |
| C · ask Chef Bruno → A | Leo or Bruno | Leo or Bruno | **Bruno only** | Leo or Bruno |
| C · ask Chef Bruno → B | Dot or Leo or Bruno | Leo or Bruno | **Bruno only** | Dot or Leo or Bruno |
| C · ask Chef Bruno → C | Dot or Leo or Bruno | Leo or Bruno | **Bruno only** | Dot or Leo or Bruno |
| C · ask Chef Bruno → D | Dot or Bruno | **Bruno only** | **Bruno only** | Dot or Bruno |
| D · no question | Dot or Leo or Bruno | Leo or Bruno | **Bruno only** | Dot or Leo or Bruno |

#### Bruno claims D · Parking lot

| Question (answer) | Record A · guard log | Record B · photo strip | Record C · vendor | Record D · gate camera |
|---|---|---|---|---|
| A · ask Granny Dot | Dot or Leo or Bruno | Leo or Bruno | Dot or Bruno | **Bruno only** |
| B · ask Skater Leo | Leo or Bruno | Leo or Bruno | **Bruno only** | **Bruno only** |
| C · ask Chef Bruno → A | Dot or Leo or Bruno | Leo or Bruno | Dot or Bruno | **Bruno only** |
| C · ask Chef Bruno → B | Dot or Leo or Bruno | Leo or Bruno | Dot or Bruno | **Bruno only** |
| C · ask Chef Bruno → C | Dot or Leo or Bruno | Leo or Bruno | Dot or Bruno | **Bruno only** |
| C · ask Chef Bruno → D | Dot or Leo or Bruno | Leo or Bruno | Dot or Bruno | **Bruno only** |
| D · no question | Dot or Leo or Bruno | Leo or Bruno | Dot or Bruno | **Bruno only** |

### 2.9 Accusation

| Choice | Outcome |
|---|---|
| A/B/C: accuse that suspect | **Correct:** "The fabricated alibi was found." **Wrong:** "An honest suspect was accused; the Liar's alibi stood." |
| D: insufficient evidence | "Case unsolved." This is a draw, so it is not a loss for either side. |

- With one suspect left, accuse.
- With two left, accusing is a 50/50 between a win and a loss, against a sure draw.
- With three left, "insufficient evidence" is the sensible choice.

## 3. Decision-structure tests

1. **Does the Detective have information to prioritise?** **Yes.**
   - The public map shows who could have seen whom: the booth bench faces the wheel; the picnic tables face the lot.
   - The catalogue shows which records can settle a claim at C or D outright (vendor, gate camera), and which cover only part of A or B (inside the rope, inside the booth).
   - So, for example, if someone claims the wheel, the useful question goes to whoever claimed the booth.
2. **Can the Liar choose between covers with understandable risks?** **Yes.**
   - D is a known bad choice: he was filmed leaving.
   - C depends on whether the vendor stayed.
   - A and B escape their records but can be exposed by someone at the booth.
   - When questioned, a careful Liar can always give an answer that doesn't expose itself: A·B or A·D on the wheel, B·B or B·D at the booth, C·C at the stalls. Riding the wheel or being inside the rope are refuted by the guard log, which he could guess from knowing the wheel was stopped.
3. **Is one cover unbeatable?** **No.**
   - **C and D:** opening the vendor (C) or the gate camera (D) always identifies Bruno, whatever is asked.
   - **A:** only "ask Granny Dot, then open the photo strip" wins against a careful answer. The map points a reasoning Detective to exactly that.
   - **B:** the same plan wins, but Dot and Bruno now both claim the booth. A Detective who doesn't know who is lying must pick which of them to question, and asking Bruno leads nowhere. **Best outcome against B: 50%.**
4. **Does one checking strategy always win?** **No, only because of cover B.**
   - **Fragile point:** if a record could be opened *before* questioning, "open the photo strip, confirm Dot, then question Dot" catches every cover.
   - So the rule "question first, then record" is what keeps the round from being solved.
5. **Are any choices really random?**
   - **Yes, in two places:** choosing which of two people claiming the same place to question (cover B), and accusing when two suspects remain.
   - Everything else is decided by the map and the catalogue.
6. **Does the round depend on obscure wording?** **Moderately.** Several results turn on distinctions spelled out in the limitations:
   - inside the rope vs. the path outside it;
   - inside the booth vs. the queue or bench;
   - the whole window 9:15–9:30 vs. the moment 9:20 (Dot only sees the wheel from 9:22);
   - identification by chef's hat and skateboard.
7. **Does identifying the false alibi follow from the evidence?** **Yes, model-checked.**
   - Every "Bruno only" result follows from the opened record, the accounts and the one-liar rule.
   - No combination ever rules out the real Liar, so an honest suspect is never framed by the logic.

## 4. Changes made while building, disclosed

- **The vendor's statement.** In the first draft the vendor left at 9:15. That made **C unbeatable**: if Bruno claimed the stalls and stayed vague, nothing could place Leo there after 9:14, and Leo against Bruno stayed a permanent 50/50.
  - I changed the vendor's fixed account to cover the whole window.
  - That is a change to the evidence, made before play and for every cover alike, not a fact tailored to one answer. It makes C a poor cover.
- **Witness reach.** An earlier draft let Leo see only part of the lot, which made D unbeatable. The gate camera now covers the gate fully, and Leo's account covers the whole lot.

## 5. Verdict

- **Logically consistent?** Yes. Every identification follows from records, accurate accounts and the one-liar rule. The model never eliminates the real Liar.
- **Meaningful Detective choices?** Partly. Whom to question and which record to open follow from the map and the catalogue. Against the best cover, though, the choice between two people claiming the same place is a coin flip. The round also stays unsolved only because questioning must come first.
- **Meaningful Liar choices?** Yes before play, judged on what Bruno knows: his risks are understandable and come from his own timeline and the catalogue. After the fact, in this fixed world, three of his four covers lose to correct play, and only the shared-booth cover gives him 50%.
- **Remaining uncertainty:**
  1. **One fixed assignment.** Bruno is always the Liar, Dot at the booth, Leo at the stalls. A second play is already solved. The Liar's real dilemma, not knowing where honest suspects were, can't be measured in a single world.
  2. **The best cover is a coin flip.** The Liar's best cover depends on sharing a place with an honest suspect, and the Detective's response to it is a coin flip.
  3. **The order rule.** "Question before record" holds the round together and needs to feel natural to players.
  4. **Reading load.** Dot's and Leo's accounts are long.
  5. **Not designed yet:** bots, multiplayer (several Detectives), and how humans actually read the spatial limitations.

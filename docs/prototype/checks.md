# Case Logic Prototype — review 2: evidence audit, judgments, final bluff (Nov 7, 2026)

No physical iPhone test has been done. Browser checks used headless Chromium at 390 × 844.

## 1. What the audit changed

**The illuminated-sign example.**
- Before: "Signs lit up the hallway, so it was easy." was marked a contradiction of "dark corridors".
- That was unsupported: dark corridors can contain illuminated signs, and "I didn't read them" adds nothing.
- Now: "Glowing signs pointed the way." is an **unsupported extra detail**, and the reveal says it can't be checked either way.
- It only becomes a contradiction if the speaker adds "Who needed signs? The hallway was brightly lit."

**Other contradictions that did not hold up, and what replaced them:**

| Was marked a contradiction | Why it was unsupported | Now |
|---|---|---|
| Blue door / red curtain (and "what did the door look like?") | A door and a curtain can both exist. It was also a colour trap. | Removed. Entrance contradictions now concern the guide, the tickets and the group size. |
| Blue line vs green line (5 lines) | A colour trap, and two lines could exist. | "Nothing marked the way" (contradicts the floor line existing) |
| "A ticket machine. It beeped when it was our turn." | A machine could signal turns while a guide collects tickets. | "Nobody. There was no staff, just a ticket machine." |
| "Nothing. They just pointed us in." | The person pointing need not be the guide who collected tickets. | "Nothing. Nobody took tickets." |
| "A staff member stood next to a blue door." | Several staff members can stand anywhere. | "A table full of rubber bats" (extra detail) |
| Unmasked actor / staircase / coffin scares | A second actor or a second scare was never ruled out. | Review 3 (below): reclassified as unsupported extra details. |
| "From the top of a creaky staircase" | The actor could come down stairs and then appear by the cupboard. | "Out of a coffin. There was no cupboard near it." |
| "We sat in rows… we didn't walk much" | "Not much" still allows walking. | "We stayed in our seats the whole time." |
| "Waved the whole line in at once" | The line could have been small. | "Waved a big crowd in all at once." |
| "The lights were on the whole time" | Dim lights can be on in a dark corridor. | "It was bright the whole time." |
| "I went in alone" | You can be alone (no companions) inside a small group of strangers. | "I went in by myself, with no group." |
| "Ran back to the entrance" | (kept) | Opposite direction at the same moment as "hurried toward the exit". |

**The red curtain is now never contradicted** (only confirmed), because every alternative entrance could coexist with it.

- **27 contradictions remain** after review 3 (33 after review 2). Each has written evidence, a reason, and the reconciliation considered: see [contradiction-audit.md](contradiction-audit.md).
- **Every line now has a reviewed kind:** compatible, contradiction, unsupported extra detail, or vague. Corrections are flagged separately.
- **Reveal wording:**
  - Compatible lines say "Compatible with", never "matches".
  - Corrections say they lower confidence but are not contradictions.
  - Extra details say "can't be checked, not automatically false".

## 1b. Review 3: the "only scare" sentence is removed

Review 2 added "It was the only scare." to evidence C so that decoys about an unmasked actor or a staircase would be wrong. That sentence doesn't rule out a staircase, a coffin or an unmasked actor elsewhere in the house, and it was added only to make decoys fail. It is removed. The incident lines were re-reviewed with one rule: **a contradiction must be about the same event and make claims that cannot both be true.**

| Line | Same event as the evidence? | Now |
|---|---|---|
| q5c → "An actor with no mask." (answering *who appeared beside the rattling cupboard*) | Yes: the cupboard appearance | **Contradiction** (masked vs. no mask) |
| q5a → "Out of a coffin. There was no cupboard near it." (where *the masked actor* came from) | Yes: the masked actor | **Contradiction** (beside a cupboard vs. no cupboard near) |
| q4e2 "…the scare: an actor with no mask" · q5b "An actor with no mask, just face paint" · q5d "Someone jumped down a creaky staircase" (the ", There was no cupboard." clause dropped, since it was only scoped to the staircase) · q5d1 · q5e2 · q6a2 | No: could be another actor or moment | **Unsupported extra detail** |

- **Final-bluff questions.** They now name the event, because "the scare" is no longer unique: "Who appeared beside the rattling cupboard?" and "Where did the masked actor appear?"
- **Corrections of an unchecked detail.** q5b2 and q5d2 take back an unchecked detail ("Wait… not a staircase") and stay marked as corrections in the reveal. Bots detect corrections only when a checkable value changes, so they don't treat these two as a change of story. Known limitation; not changed.
- **Numbers.** The simulation figures in §5 were measured before review 3 and have not been re-run.

## 2. Judgments now follow the whole exchange

- **Evidence-based.** Detective bots compare what the claim and the follow-up actually state against the evidence. They never use a card's label.
- **Corrections.** A contradiction that the speaker later corrects becomes "Not enough information". A contradiction that still stands stays "Something conflicts". Example: "Nobody. I went in by myself, with no group." → "Oh, a guide took it first" corrects the tickets, but going in without a group still stands.
- **Extra details.** Unsupported extra details and vague answers give "Not enough information".
- **Personality affects confidence only, never facts.** A cautious bot says "Fits the case" only when at least two checkable details match; one match gives "Not enough information". There is no randomness in judgments. Before this rule, bot judgments were unanimous in 100% of exchanges; now 76–81%.

## 3. Final bluff: exposure audit

The engine now tracks everything the Liar could see:

- public testimony and judgments;
- the questions and follow-up wording;
- **every option offered to the Liar when answering, including the ones not picked.**

Each of the 8 askable details is classified:

- **disclosed:** someone stated the true value;
- **hinted:** the detail came up in anything the Liar saw, as a true or false candidate;
- **hidden:** nothing the Liar saw mentioned it.

The final question is asked **only about hidden details**. If none remain, it is skipped and the reveal says why.

**Is it still worth keeping?** Across 500 ordinary rounds, about 31–36% of details stay hidden and 98–99% of rounds have at least one. Liars answered those questions correctly 28–30% of the time, close to chance (3–4 options). So the mechanism is weak but not trivial, and it stays for this prototype.

**Leaks not counted:**
- **Inference from neighbouring details.** For example, "I kept one hand on the wall" suggests darkness without naming it.
- **The category hint.**

## 4. Tests, by meaningful case (`npx tsx src/prototype/tests/prototype.test.ts`, 227,567 assertions, all pass)

| Test case | Kind |
|---|---|
| Each line's reviewed kind agrees with what it states. Every contradiction has a written reason and a reconciliation note; non-contradictions have none. No colour-swap values. Corrections really change the speaker's own claim. Contradicting claims have a correction branch. | content contract (structural) |
| The glowing-signs claim is an extra detail with nothing checkable. | regression for the reported bug |
| Whole-exchange judging, 8 cases: signs alone → not enough info; signs + "brightly lit" → conflicts; corrected "no staff" → not enough info; corrected "nobody" with "no group" standing → conflicts; queue + vague → not enough info; plus 3 cautious-threshold cases. | behaviour |
| All 90 question → claim → follow-up branches are reachable through the engine. | structural |
| At every step of 200 rounds, Liar knowledge has no evidence, facts, location, kinds or reasons. Changing the hidden truth doesn't change Liar decisions. Earlier Liar views never change. | boundary |
| No bot contradicts its own earlier statement without a correction. (This caught a real bug: a Liar bot changed its story across exchanges to match others. Fixed.) Detective bots never state false details. | behaviour |
| Judgments stay hidden until everyone has chosen. | behaviour |
| Over 300 rounds the final question is only asked about *hidden* details. When all are exposed it is skipped. | behaviour |
| Ties, wrong suspect, caught Liar, and the correct-final-answer bonus each follow the published points. | rules |
| QA scenarios do what they claim (forced answers are labelled as forced). Replay is deterministic. Duplicate and out-of-turn taps are ignored. EN/ES strings are present. | harness |

The existing game's suites still pass.

**What depends on manual review, not tests:**
- whether each "contradiction" really cannot be reconciled (the audit table is my judgment);
- whether a sentence reads naturally;
- whether Spanish carries the same meaning.

The tests only check that the reviewed labels and the stated details agree with each other.

## 5. Ordinary bot behaviour (500 simulated rounds each, no QA scripts)

| Setting | Liar caught | Tie | Wrong suspect | Exchanges with any "conflicts" |
|---|---|---|---|---|
| Careful human Detective (truthful; follows up anything not compatible; judges from evidence; votes by own doubts) | 65% | 8% | 27% | 4% |
| Human Liar using only Liar-visible information (same rules as the Liar bot) | 80% | 5% | 15% | 0% |

- **The Liar bot's answers:** it repeated details it had heard 24% of the time, gambled on an unheard detail 22%, and stayed vague 55%.
- **Contradictions are rare.** Most catches come from the Liar's accumulated vagueness, not from contradictions. A rule-following Liar who stays vague is caught 80% of the time.
- **The scripted human Liar is not a person.** A real Liar who repeats heard details more boldly may do much better.

## 6. Three manually reviewed paths (ordinary rounds, seeds from the simulation, careful human Detective)

### A. A contradiction exposed by a follow-up (seed p6)

1. Chef Bruno: "A masked actor jumped out."
   - *Compatible with C. Says nothing about whether Bruno was there.*
2. Granny Dot: "Someone sent us in a few at a time."
   - *Compatible with "small groups".*
3. Granny Dot asks Skater Leo (the Liar) "How did you know where to go?" Leo: **"Glowing signs pointed the way."**
   - *Can't be checked: signs could exist in dark corridors. Not suspicious on its own.*
   - Follow-up "What did the signs say?" Leo: **"Who needed signs? The hallway was brightly lit."**
   - *Now there is an explicit contradiction: evidence B says the corridors were dark.*
   - All three Detectives judged "Something conflicts".
4. The human answers truthfully (compatible).
5. The human's extra question to Leo: "Someone sent us in a few at a time." (compatible, repeated from Granny Dot)
   - *A match is not proof. It doesn't cancel the earlier contradiction.*
6. **Vote: Leo 3, Bruno 1. Caught.** The reason a human can state: "He said the hallway was brightly lit; the case file says dark."

### B. A plausible extra detail stays inconclusive (seed p4)

- **Exchange 2.** Chef Bruno (innocent): **"We stood in line for a while."** Follow-up "What was at the front of the line?": "I couldn't see past the people ahead."
  - *A queue is never mentioned. It can't be checked and it isn't false.*
  - Everyone judged "Not enough information", and nobody judged "conflicts". Bruno's extra detail was never treated as a lie.
- **The Liar, Granny Dot, was vague four times:**
  - "Creepy music played the whole time." → "Not that I noticed."
  - "A staff member…" → "A table full of rubber bats."
- **Vote:** Granny 3 votes, caught. *The human's reason is a pattern of answers with nothing checkable, not any single answer. That is weaker evidence, and the reveal says so.*

### C. A coherent bluff that escapes (seed p9)

*Which tie: the bots' suspicion **scores** tied, so each bot picked among the tied players with seeded (reproducible) randomness. The final **tally** did not tie: the human had 2 votes, Bruno 1, Leo 1, so the human was identified. A tied highest tally would have identified nobody and the Liar would have escaped by the published rule (`result()` in engine.ts; tested with a 2–2 tie).*

1. The human (Detective): "A guide took our tickets."
2. The human asks Chef Bruno (the Liar) the same question. Bruno: **"A guide took our tickets."**
   - *Compatible, but identical to what he just heard. Bot rule: "repeated details others had stated".*
   - *A careful human might find the echo suspicious, but it contradicts nothing.*
3. Bruno asks Skater Leo; Leo: "Creepy music…" → "It got loud when a cupboard started rattling."
4. and 5. Granny Dot gives compatible answers about the exit and the masked actor.
6. **Vote: no contradictions anywhere.**
   - The bots' suspicion scores tie, so they pick at random among the tied players. The reveal labels it "tied: picked at random".
   - The human voted Bruno; the bots voted the human twice and Leo once.
   - **The human was identified. The Liar escaped with 2 points.**
   - *Nothing in the testimony proved anyone was lying. The only clue was the echo, which the game does not flag.*

## 7. Forced QA scenarios (reachability only, not balance)

- **Contradiction scenario:** the Liar's first answer is forced to a contradiction, and the reveal labels it "QA script".
- **Bluff scenario:** detective bots disclose as much as possible, and the Liar answers last.
- **All-exposed scenario:** a human Liar.

These test that the paths exist, not how often they happen. They are kept out of the numbers in §5.

## 8. Browser re-run on the corrected content (390 px, all paths, no page errors)

The "human" here is a script following stated rules.

| Path | What actually happened |
|---|---|
| **Detective round** | Granny Dot (the Liar) gave only answers with nothing checkable: "Someone behind me screamed" → "I didn't turn around to look", then "I laughed" → "Laughed with me, I think". She was judged "Not enough information" twice and caught 3–1. |
| **Liar round** | The scripted Liar repeated heard details ("We waited at a red curtain…"). The bots still voted for it 3–1, because its follow-ups added nothing new. The final question was about the exit: hidden, since nothing the Liar saw mentioned it. |
| **QA contradiction** (forced) | Leo: "Nothing marked the way. We just guessed." → "I just followed the others." Judged "Something conflicts" by all and caught 3–1. The reveal cites the floor line and the reconciliation considered. |
| **QA bluff** (forced disclosure) | Leo repeated "A masked actor jumped out." after hearing "An actor in a mask". Judged "fits" and escaped; Chef Bruno was voted out. |
| **QA all exposed** | Every askable detail had come up. The reveal says: "No final question: every detail that could be asked had already come up in something the Liar saw…" |
| **Leave / replay / menu** | Home → Stay keeps the round. Home → Leave returns to the start screen. Play again shows a new briefing. Main menu returns to the landing page. |

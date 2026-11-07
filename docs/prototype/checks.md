# Case Logic Prototype — checks and results (Nov 7, 2026)

No physical iPhone test has been done. All browser checks ran in headless Chromium (Playwright) at a 390 × 844 viewport, against a web export built with `EXPO_PUBLIC_PROTOTYPE=1 EXPO_PUBLIC_PROTOTYPE_QA=1`. The "human" was a script that followed simple, stated rules. That shows the flows work; it does not show that people find the game understandable or fun.

## Automated (`npx tsx src/prototype/tests/prototype.test.ts`, from `app/`)

Result: **212,525 / 212,525 checks passed.** Most of these are the per-step Liar-knowledge checks, repeated across 200 simulated rounds.

| Area | What is actually checked |
|---|---|
| Content contract | Each line's authored class equals the class computed from its stated details against the facts. Each claim only states details in its question's topic. Each question offers 2 matching, 2 conflicting and 1 vague claim. Every matching claim has a conflicting twin. Each follow-up has 3 branches, including a vague one. Conflicting claims have a correction branch, and corrections really change a detail of the claim. Every conflict names an explicit fact. Every fact can be both confirmed and contradicted. |
| Reachability | All 6 × 5 × 3 = 90 question → claim → follow-up branches are driven through the engine and reach judging. |
| Liar boundary | At every step of 200 rounds (bot Liar and human Liar), the Liar's knowledge and view contain no evidence, fact text, location, classification, notes or Liar flag. `bots.ts` imports only types from the case data. Changing the hidden truth leaves Liar decisions unchanged on the same knowledge. |
| No retroactive info | Each Liar knowledge snapshot is a prefix of the later ones. Once something is known it never changes, and no new kinds of field appear. |
| Bot consistency | Detective bots never state a false detail. No bot contradicts its own earlier statement without a marked correction. The "avoid identical testimony" rule fires. No bot gives the same judgment every time. |
| Judgment privacy | Before the last judgment is in, nobody's knowledge or view shows other judgments. They appear after closing. |
| Final challenge | Over 300 rounds the challenge is never about a detail already said. A scripted round that discloses all 8 details skips the challenge and still ends cleanly. |
| Ties / scoring | A 2–2 tie identifies nobody and the Liar gets 2. A wrong suspect means the Liar escapes. A caught Liar gets 0, or 1 with a correct final answer; identification stands and Detectives keep their points. |
| QA scenarios | Contradiction: the human asks the Liar first, the first answer conflicts, and it is labelled as forced. Bluff: the Liar repeats heard details in ≥10 of 20 seeds. |
| Replay / taps | The same seed replays identically. A second Start tap and out-of-turn actions are ignored. |
| EN/ES | Every case text, explanation, bot reason and key UI string exists in both languages. |

Existing game suites (`npm test` at the repo root) still pass: ALL PASSED / RUNOFF OK / SAFETY OK. TypeScript: clean. ESLint is not configured in this repo, and `expo lint` could not download a config from this workspace.

**Limits.** These tests check structure and relationships, not meaning. Whether a sentence reads naturally, or a follow-up feels fair, came from a manual read of [dialogue-matrix.md](dialogue-matrix.md). That read led to these changes:

- Added the "fits part of" wording.
- Removed an inferred detail (a guide letting people in) that the evidence never states.
- Replaced a question-6 option that had no twin.
- Gave one conflicting claim a correction branch.

## Browser paths (390 px)

| # | Path | What actually happened |
|---|---|---|
| 1 | Detective round | Completed. Chef Bruno was the Liar; he gave only matching or vague answers and was never contradicted. The scripted human voted for Granny Dot (most vague), two bots agreed, and the Liar escaped. A legitimate "the Liar blended in" outcome. |
| 2 | Liar round | Completed. The human Liar stayed vague early ("A staff member…", then "I honestly didn't notice"). Detectives judged it "Not enough information", not "Something conflicts". Votes split Granny Dot 3 / You 1, and the Liar escaped with 2 points. In the first run of the same path the Liar was caught, and the final question offered three options about the corridors. |
| 3 | Contradiction → follow-up → explanation | Skater Leo was forced to "Signs lit up the hallway, so it was easy." The human asked the follow-up "What did the signs say?" and Leo answered "I didn't read them. I just walked." All three Detectives judged "Something conflicts" and Leo was caught 3–1. The reveal tied the claim to "Visitors walked through dark corridors" and labelled the forced answer as a QA script. Leo missed the final question ("All at once, as a big crowd" vs "In small groups"). |
| 4 | Believable Liar bluff | Leo answered last: "A masked actor jumped out." The reveal reason reads "Repeated 1 detail(s) other players had already stated" (Granny Dot had said "An actor in a mask"). Everyone judged "Fits the case", Chef Bruno was voted out, and the Liar escaped. |
| 5 | All details disclosed | The human Liar asked about the entrance and the bots described the route and incident. The human then claimed a "creaky staircase", which all bots judged "Something conflicts", and used the extra question to get the last unsaid detail (the exit). The human was caught 3–1, and the reveal says: "No final question: every detail that could be asked was already said out loud during the round." |
| 6 | Leave mid-round and replay | Home → Stay kept the round. Home → Leave returned to the prototype start screen. After a finished round, Play again showed a new briefing, and Main menu returned to the landing page (prototype entry visible in this build). |
| — | Spanish | The contradiction path in Spanish rendered fully: questions, answers, follow-up, judgment labels, roster traits. |
| — | Production isolation | A normal export (no flags): no entry button, and `/prototype` redirects to `/`. |

**Page errors in all paths: none.**

**Unexpected results found while testing:**

- "You asks…" and "You was the Liar!" grammar. Fixed.
- "steady bots…" was lowercase at the start of a sentence. Fixed.
- Two bugs in my own test driver, not the game. Its vote heuristic scored everyone equally, which led to a wrong vote and a tie in the first contradiction run. And it chose the all-disclosed extra question without reading the testimony. Both fixed, then all paths re-run.

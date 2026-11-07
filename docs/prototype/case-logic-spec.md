# Case Logic Prototype — Haunted House (design spec)

Status: prototype for founder playtesting. Not validated with fresh players.
Code: `app/src/prototype/` (engine, bots, data, screen) · route `app/src/app/prototype.tsx` · tests `app/src/prototype/tests/`.
Full line-by-line content: [dialogue-matrix.md](dialogue-matrix.md) (generated from the data, EN/ES).

## 1. Goal

Prove that one complete round can be won by reasoning: a Detective can point at a specific answer, name the evidence it contradicts, and use a follow-up to learn more. The Liar can deliberately build a believable story from what they hear. Reactions (SUS/LEGIT), pins and heat icons are gone.

## 2. The case

| Block | Evidence (Detectives only) | Facts and checkable details |
|---|---|---|
| A. Entrance | A guide collected tickets at a red curtain. Visitors entered in small groups. | `tickets` (collected = yes, who = guide) · `curtain` (entrance = red curtain) · `groups` (entry = small groups) |
| B. Route | Visitors walked through dark corridors. A green floor line marked the route. | `corridors` (mode = walked, light = dark) · `line` (marker = green line) |
| C. Incident | A masked actor appeared beside a rattling cupboard. The group hurried toward the exit. | `actor` (who = masked actor) · `cupboard` (place = cupboard) · `exit` (after = exit) |

- **Liar:** knows only the category: *Live entertainment / Entretenimiento en vivo*.
- **Location name:** *Haunted House Attraction*, shown only at the reveal.

**Contradiction rule.** A line conflicts only when it states a different value for a detail the evidence states, such as a blue line where the evidence says green. Details the evidence never mentions (a queue, music, a scream) are *can't be checked*, never false.

## 3. Information by role and phase

| Phase | Detective sees | Liar sees |
|---|---|---|
| Briefing | Role, the three evidence blocks, round plan, scoring, tie rule | Role, category, round plan, scoring, tie rule |
| Ask | All 6 questions (if asking) | Same |
| Answer | The 5 claims for that question, in the same shuffled order for either role | Same |
| Follow-up | The asker sees the follow-up question attached to the claim given; the respondent sees its 3 responses | Same |
| Judge | The full exchange and their own pending judgment; others' judgments stay hidden | Same |
| Judged / Review | All judgments for closed exchanges, plus the testimony record | Same |
| Vote | Players, tie rule | Same |
| Final bluff | Waits for the Liar | One question about an undisclosed detail, with 3–4 options |
| Reveal | Everything: roles, location, evidence, explanations, bot reasons, scores | Same |

- **Case file:** Detectives can reopen it at any time.
- **Liar's data model:** has no `evidence` key at all, not even an empty one.
- **Bots:** receive only `knowledgeFor(state, botId)`. It contains public testimony, the questions, and (for Detectives only) the evidence.

## 4. Round flow

1. **Briefing.**
2. **Four interrogations.** Each player answers exactly once, in the order `order[i]`, and the previous player in the order asks.
   - The asker picks one of 6 questions (2 per topic: entrance, route, incident).
   - The respondent picks one of 5 claims.
   - The asker may ask the one follow-up attached to that claim, or skip it.
   - If asked, the respondent picks one of 3 responses.
3. **Judgment** after each complete exchange. Every non-respondent chooses *Fits the case* / *Something conflicts* / *Not enough information*. Judgments are revealed together when the last one is in. They score nothing.
4. **Your extra question.** The human picks one person and either asks a new question or asks the follow-up to one of that person's earlier claims that went unasked. Judgments follow as before.
5. **Testimony review.** The full record, with the tie rule restated.
6. **Secret vote.** Everyone votes for one other player.
7. **Final bluff**, only if the Liar is identified and an undisclosed detail remains.
8. **Reveal**, then *Play again* or *Main menu*.

Timing is relaxed: bots act after 0.7–1.9 s, and there are no countdowns for the human.

## 5. Questions, claims and follow-ups

Each question offers 5 claims:

- **2 that match the case**, each stating a different checkable detail.
- **2 that conflict.** Each is a *twin* of one of the matching claims, with one detail changed (a red curtain becomes a blue door, a green line becomes a blue line).
- **1 vague claim** that states nothing the evidence covers.

Every claim has one follow-up question with 3 responses:

- **Matching or vague claim:** one response matches the case, one conflicts, one is vague.
- **Conflicting claim:** one response continues the false story, one is a *correction* back toward the case (flagged `revises`), and one is vague or evasive.

A correction is never treated as proof either way. In the reveal it reads: "Changes the earlier answer toward the case file. A correction is not proof either way."

There are 6 questions, 30 claims and 90 follow-up responses. Every line has an English and a Spanish version and a reveal explanation in both languages. All of them are listed in the matrix.

## 6. Bots (decision rules)

| Decision | Detective bot (uses evidence) | Liar bot (uses only category + what was said) |
|---|---|---|
| Question | The topic asked about least so far; random among ties. | The topic with the fewest details stated by others; random among ties. |
| Answer | With probability *vague-p* (cautious 50%, steady 25%, bold 10%), a vague claim. Otherwise a matching claim, preferring one nobody has said yet. | 1. A claim whose details all match the majority of what others said, preferring more details. 2. Otherwise, with probability *gamble-p* (cautious 10%, steady 25%, bold 50%), a specific claim it has not heard. 3. Otherwise a vague claim. It never knowingly contradicts what it heard or what it said itself. |
| Follow-up? | Asks if the claim conflicts with the evidence or is vague; skips if it matches. | Asks if the claim stated at most one detail. |
| Judgment | *Conflicts* if a detail contradicts the evidence and was not corrected; *Not enough information* if the story changed toward the evidence or nothing is checkable; *Fits* otherwise. | *Conflicts* if a detail differs from the majority of what others said; *Fits* if details match what others said, or (to blend in) if a specific answer contradicts nothing heard; otherwise *Not enough information*. |
| Vote | Highest suspicion score: conflict +3, changed story +2, vague answer +1, matching answer −1. Random among ties. | The player who drew the most doubt in others' judgments (*conflicts* 2, *not enough information* 1). Random among ties. |
| Final bluff | — | The value others stated, if any; otherwise a random option. |

- **No fixed SUS/LEGIT habits.** Personality (cautious / steady / bold) changes only the probabilities above.
- **Reproducible randomness.** Every random draw comes from `hash(seed + key)`, so a seed replays exactly.
- **Honest explanations.** Each decision is stored with the rule actually used (`Decision.reason`), including "random draw" and "QA script". The reveal shows these, never an explanation invented afterwards.

## 7. Voting, final bluff, scoring

- **Tie rule** (stated before the vote): if the highest vote count is tied, no single suspect is identified and the Liar escapes.
- **Final bluff:**
  - It happens only if the identified player is the Liar.
  - Its question is about a detail whose *true value nobody said aloud* during the round. Disclosure is tracked by the details each line states.
  - If every challengeable detail was disclosed, the challenge is skipped and the reveal says so.
  - No location art, name or evidence is shown before it resolves.
- **Points (provisional):**
  - Each Detective who votes for the Liar: 1.
  - Liar not identified: 2.
  - Caught Liar who answers the final question correctly: +1. Identification still stands.
  - Judgments and reactions score nothing.

## 8. Reveal

- **Shown:** who the Liar was, the location and evidence, the final bluff result, scores, and every exchange with an explanation per line.
- **Wording of explanations:**
  - "Matches: …" when a line states the full fact.
  - "Fits part of: …" when it states only part of it.
  - "Conflicts with: …" when it contradicts a fact.
  - "Can't be checked" for vague or unmentioned details.
  - A standing note: matching is not proof of innocence, and vague is not proof of guilt.
- **"Show every answer option"** opens the explanation for all five claims (or three follow-up responses) of each exchange, not only the chosen one.
- **Bot reasons:** every decision is listed with the rule that produced it.

## 9. Leakage audit (what the Liar can learn, by design or not)

1. **Options shown when answering.** The Liar sees the 5 claims (or 3 responses) only when they are the respondent.
   - Twins mean the true detail is never the only detailed option, so the Liar faces a 50/50 between twins (e.g. red curtain vs blue door).
   - Guessing wrong produces an explicit conflict. The vague option is always available but reads as weak.
   - **Remaining leak:** after seeing a twin pair, the Liar has narrowed one detail to two values. That makes the final bluff about that detail roughly 50/50 instead of 1 in 3–4. Accepted, because the bonus is only 1 point.
2. **Question wording.** Both incident questions presuppose that "everyone moved suddenly", which tells the Liar something sudden happened. The entrance and route questions presuppose an entrance and a route. Accepted, because the category already implies a venue.
3. **Detectives' true answers teach the Liar.** This is the intended tension. A Detective who states details convinces others but arms the Liar; one who stays vague protects the case but looks weaker.
4. **Follow-up corrections.** A correction option visibly states the alternative value (e.g. "maybe green"). A Liar who sees it learns the other twin; the value is not confirmed, and choosing it reads as a changed story.
5. **Judgments.** These become public after each exchange. A Liar can learn from Detectives' "Something conflicts" on a claim.
6. **Not leaked:** the Liar's knowledge and view never contain the evidence, the location, fact texts, classifications, notes, or the unrevealed challenge answer. This is checked at every step of 200 simulated rounds, and by a test that changes the hidden truth and confirms Liar decisions do not change.

**Does the shared deck defeat the bluff?** Not in this case. The twin structure keeps a real risk on every specific answer, and the Liar's best play (listen first, stay vague early, repeat heard details later) is the intended deliberate bluff. It would fail if a question had only one detailed option. A test enforces that every matching claim has a conflicting twin.

## 10. Accessibility and UX

- **Labels:** every judgment and classification has a text label alongside its colour or emoji.
- **Uniform options:** answer options all look the same, with no ordering, colour or icon hints. Text wraps fully on a 390 px screen.
- **Selecting answers:** select, then *Confirm*. The button shows *Sending…* and duplicate taps are ignored; the engine also rejects out-of-turn actions.
- **Leaving:** *← Home* opens an in-page leave confirmation.
- **Motion:** no animations in the prototype screen, so reduced motion is respected by default.
- **Text size:** system text scaling is not disabled.
- **Language:** English and Spanish via the app's language toggle (EN/ES chip).

## 11. Isolation

- **When it is available:** only in development builds (`__DEV__`), or in a web build made deliberately with `EXPO_PUBLIC_PROTOTYPE=1`. QA scenarios additionally need `__DEV__` or `EXPO_PUBLIC_PROTOTYPE_QA=1`.
- **Production builds** (store / TestFlight / the live site) redirect `/prototype` to home and show no entry button.
- **The existing game is untouched:** the old engine, Practice and online rooms work as before.

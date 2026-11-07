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

**Line kinds.** Every line has a manually reviewed kind: **compatible**; **contradiction** (cannot reasonably be true about the same visit; each has a written reason and the reconciliation considered, see [contradiction-audit.md](contradiction-audit.md)); **unsupported extra detail** (never mentioned, so not checkable and not false); or **vague**. A follow-up that changes the speaker's own claim is also flagged as a **correction**. No contradiction rests on a colour difference.

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

Each question offers 5 claims mixing compatible answers, explicit contradictions, unsupported extra details and vague answers. (The earlier "twin" design, which paired each true answer with a colour-swapped false one, was removed: most twins could both be true.) Every claim has one follow-up with 3 responses; every contradicting claim has a correction branch. 6 questions, 30 claims, 90 follow-up responses, EN/ES, listed in the matrix.

## 6. Bots (decision rules)

| Decision | Detective bot (uses evidence) | Liar bot (uses only category + what was said) |
|---|---|---|
| Question | Topic asked about least; random among ties. | Topic with the fewest details stated by others; random among ties. |
| Answer | With probability *vague-p* (cautious 50%, steady 25%, bold 10%) a vague/extra answer; otherwise a compatible one, preferring one nobody said yet. | Never contradicts its own earlier statements. Then: a claim whose details all match what others said; else with *gamble-p* (cautious 10%, steady 25%, bold 50%) an unheard specific claim; else vague. |
| Follow-up? | Asks if the claim contradicts the evidence or has nothing checkable; skips if compatible. | Asks if the claim stated at most one detail. |
| Judgment (whole exchange) | *Conflicts* if a stated detail contradicts the evidence and was not corrected; *Not enough information* if the story was corrected, if nothing checkable was said, or (cautious bots) if fewer than 2 details matched; *Fits* otherwise. No randomness. | *Conflicts* if a detail differs from what others said; *Fits* if it matches, or (to blend in) if a specific answer contradicts nothing heard; otherwise *Not enough information*. |
| Vote | Highest suspicion: contradiction +3, correction +2, nothing checkable +1, compatible −1; random among ties. | Most doubt in others' judgments; random among ties. |
| Final bluff | — | The value others stated, if any; else a random option. |

Randomness comes from `hash(seed + key)` and every decision stores the rule actually used.

## 7. Voting, final bluff, scoring

- Tie rule (stated before the vote): tied highest votes → no single suspect → the Liar escapes.
- Final bluff only if the identified player is the Liar, and only about a detail that is **hidden** from the Liar: nothing the Liar saw — testimony, judgments, questions, follow-up wording, or any option offered to them (picked or not) — mentioned it. Details seen as candidates are *hinted*, not hidden. If none is hidden, the challenge is skipped with an explanation.
- Points (provisional): each Detective who votes for the Liar 1; Liar not identified 2; caught Liar with a correct final answer +1 (identification stands). Judgments score nothing.

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

## 9. Leakage audit (what the Liar can learn)

1. Options offered when answering: compatible options state true details, so a Liar who answers sees true candidates next to false ones and extra details. These count as *hinted* for the final bluff.
2. Question wording: both incident questions presuppose "everyone moved suddenly"; entrance/route questions presuppose an entrance and a route.
3. Detectives' compatible answers teach the Liar — the intended tension.
4. Judgments reveal which earlier statements others doubted.
5. Not counted: inference from neighbouring details (e.g. "a hand on the wall" suggests darkness) and the category hint.
6. Never leaked: evidence, location, fact text, kinds, reasons, notes, the unrevealed challenge answer (checked at every step of 200 simulated rounds).

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

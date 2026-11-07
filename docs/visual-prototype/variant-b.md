# Variant B: the caught Liar can still win by naming the picture

This document was written before any Variant B code. The baseline (Variant A, commit `ec4c0c5`) is unchanged and still playable.

## A. Current baseline

- **Roles.** Detectives see one picture. The Liar sees "Entertainment".
- **Round.** Two simultaneous card selections, then an optional bot answer, then a secret vote.
- **Winning.** A tied top vote means the Liar escapes. If the Liar is caught, Detectives win.
- **The flaw.** The instruction says "don't give the picture away", but giving it away costs nothing.
  - A Detective's only risk is looking like the Liar, so the clearest card is always best.
  - The most-chosen cards are the ones that show the picture most plainly.
  - That is also exactly what the Liar copies in the second selection.

## B. Proposed rule

> Help your team recognize you, but don't teach the Liar which picture you saw.

1. Everyone except the Liar sees the secret picture; the Liar sees only the category.
2. Each player picks one card connected to the picture, the picks are revealed together, and everyone votes for the Liar (a tied top vote lets the Liar escape).
3. If the Liar is caught, they see three pictures from the category and get one guess: naming the right one lets them escape.

- The three pictures appear only after the vote. No titles or facts appear before the guess.
- Which of the three is the secret changes from round to round. The founder has already seen the haunted house in the baseline, so a fixed secret would make the Liar's guess trivial for him.

## Manual card check

The three candidates:
- **H. Haunted house:** the baseline picture, plus one change: the cupboard now has a visible keyhole.
- **M. Magic show:** stage curtains, a magician in a spotlight, a padlocked chest, and a host's microphone.
- **B. Masquerade ball:** drapes at the entrance, dancers in masks under a spotlight, footstep markers on the dance floor, and a singer at a microphone.

| Card | H. Haunted house | M. Magic show | B. Masquerade ball |
|---|---|---|---|
| Curtain | Red curtain at the entrance (visible) | Stage curtains (visible) | Drapes at the ballroom entrance (visible) |
| Mask | The masked performer (visible) | — | The dancers' masks (visible) |
| Footprints | Visitors follow a trail on the floor (indirect: a path, not prints) | — | Footstep markers painted on the dance floor (visible) |
| Key | Keyhole on the rattling cupboard (visible) | Padlock on the chest (visible) | — |
| Spotlight | — (the house is dark) | Spotlight on the magician (visible) | Spotlight on the dancers (visible) |
| Microphone | — | Host's microphone (visible) | Singer's microphone (visible) |

**"—" means I found no honest connection.** I did not stretch to fill a cell.

**Changes made during this check:**
- **Baseline links that were strained.**
  - The baseline connected the spotlight to the haunted house by "it felt like a show". That is strained, so here it is "—".
  - The baseline connected the key to the cupboard with no lock shown. That is also strained, so Variant B's copy of the picture shows a keyhole. The baseline picture is untouched.
- **A symmetric design I rejected:** every card fitting exactly two pictures, with no card fitting all three.
  - Then every informative card leaks exactly the same amount, and there is no low-risk choice.
  - "Don't teach the Liar" would have nothing to choose between.
  - I kept one card that fits all three: the curtain.

**What the table guarantees:**
- **No single card identifies a picture.** Every card fits at least two of the three.
- **Each pair of pictures shares the curtain plus one or two other cards.**
  - Haunted house and magic show share the key.
  - Haunted house and masquerade share the mask and footprints.
  - Magic show and masquerade share the spotlight and microphone.
- **Two cards from different pairs pin one picture.** For example, mask plus key points only to the haunted house.

## Is the risk/reward coherent?

**One Detective's single pick, with the haunted house as the secret:**

| Choice | Helps the team recognize you? | Teaches the Liar? |
|---|---|---|
| Curtain | Weakly: a Liar can pick it from "Entertainment" alone, and it fits every candidate | Nothing: fits all three pictures |
| Mask | Yes, though a Liar might also pick "costumes" | Rules out the magic show |
| Footprints | Strongly: a Liar is unlikely to pick it blind | Rules out the magic show |
| Key | Strongly, for the same reason | Rules out the masquerade |
| Spotlight / Microphone | No: not in the picture, so you look like the Liar | Misleads, but you'll be suspected |

**Verdict: coherent at the level of the rule.**
- An informative card helps the vote and also helps a caught Liar.
- The curtain is safe but proves nothing.
- If Detectives' cards come from different pairs (mask plus key), they pin the picture, and a caught Liar escapes.

That is a real trade-off, so I am implementing B. Its limits:

1. **Detectives don't see the three candidates while choosing.** They judge how much a card gives away by feel. By the table, the mask gives away no more than the footprints, but a player may feel the mask is "the giveaway".
2. **The leak is collective.** It depends on what the other Detectives choose at the same time, which you can't see.
3. **Among informative cards, the leak is equal.** The subtle card (footprints, key) is better only because a Liar choosing blind is unlikely to pick it, which makes it better proof. The obvious card costs ambiguity, not extra leak.
4. **The masquerade fits five cards.** When it is the secret, a blind Liar is safe with five of six cards (only the key misses); with the other two pictures, four of six are safe. This is uneven.
5. **The curtain is the Liar's best blind pick.** It fits everything. Detectives who also pick it can't be told apart from the Liar. That is intended, and untested.

## The prototype findings

1. **The second selection.**
   - In the baseline, it mainly lets the Liar copy the first reveal. With the bot rules I wrote, the Liar's second card matched the picture directly *more* often than the Detectives' cards did.
   - It adds a pattern only when the Liar's first card missed.
   - In B it would also double what Detectives give away before the guess.
   - **B uses a single selection.**
2. **The bot question is removed in B.**
   - Bots never used the answers when voting, so the step proved nothing.
   - Whether players can persuade each other by talking remains untested.
   - The baseline keeps the step only so you can compare the two versions as they were.
3. **Bot win rates describe my bot rules, not human deduction.** Any simulation numbers below are reported only to check that nothing breaks, for example that a caught Liar can always make a guess.
4. **Incentives in B.**
   - **The incentive to choose a subtle card:** it proves you saw the picture, because a Liar choosing blind is unlikely to pick it.
   - **The cost of an obvious, informative card:** it narrows the caught Liar's final guess just as much as a subtle one, while proving less, since a Liar could pick it too.
   - **The cost of the safest card (curtain):** you can't be told apart from the Liar.
   - In the baseline there was no cost on the "giving it away" side at all.

---

## As built (after the check above)

**Where to find it.** The start screen at `/visual-prototype` now has two sections:
- "Variant B as Detective" and "Variant B as the Liar";
- the unchanged "Baseline A" buttons;
- in development, the QA box adds "QA B: the bots always vote for you". It is forced, and exists only to reach the guess screen.

**Code.**
- `app/src/visual-prototype/b/`: scenes and connections, engine, bots, strings, screen, tests.
- Shared UI pieces moved to `app/src/visual-prototype/ui.tsx`.
- The baseline's engine, bots and data are unchanged.

**Round.**
1. Briefing: the tagline and the three rules.
2. One simultaneous pick, then the reveal.
3. Secret vote (the tie rule and rule 3 are shown).
4. If the identified player is the Liar, a guess between three unnamed pictures (Picture 1–3).
5. Result: "Detectives found the Liar", "The Liar was caught but named the picture, and escapes", or "The Liar blended in". Then the names of all three pictures.

There is no bot question step in B.

### Bot rules (properties of these rules, not evidence about people)

- **Detective pick.** A card connected to its picture: plainly visible with probability 70/50/30% by personality, otherwise a less direct one. Bots can't see the other candidates, so they don't model how much a card gives away.
- **Liar pick.** Blind, by the category hints. Microphone, spotlight and curtain rank highest.
- **Detective vote.** A player whose card isn't connected to its picture. Otherwise there is no evidence, and it picks reproducibly at random.
- **Liar vote.** A player whose card nobody else chose.
- **Liar guess.** The picture that fits the most of the others' cards. Ties are broken by seeded randomness.

**Simulation** (`tools/visual-sim-b.ts`, 3000 rounds per role; the "human" follows the bot rules):

| Secret | Found | Caught, then named the picture | Blended |
|---|---|---|---|
| Haunted house | 20–21% | 51% | 27–29% |
| Magic show | 5–6% | 12% | 82–83% |
| Masquerade | 3–4% | 15% | 81% |

- **Haunted house:** the bot Liar's blind "show" cards (spotlight, microphone) miss it, so it gets caught. A caught bot Liar then names the picture about 7 times in 10.
- **Magic show and masquerade:** those same cards fit, so the bot Liar blends in.
- **Pinned picture:** a caught Liar faced a single best-fitting picture 43% of the time.

### Verification

- **Variant B test cases** (`npx tsx src/visual-prototype/b/tests/variantB.test.ts`): 12, all pass.
  1. The candidate table holds its rules: no single-picture card, every picture has unconnected cards, the pictures differ.
  2. A Detective round completes, and a guess happens only when the Liar is identified.
  3. A Liar round completes, including the human's guess.
  4. The Liar's view shows no picture before the vote; at the guess, the three pictures are unmarked and unnamed; names appear only at the result.
  5. The Liar bot's knowledge has nothing about the picture before the guess, and is identical whichever candidate is the secret.
  6. The Liar bot's pick and guess don't depend on which picture is secret.
  7. Detective bots pick only cards connected to their picture.
  8. Pending picks stay private, and the reveal waits for all four.
  9. Outcomes: a tie or wrong suspect means the Liar blended in; caught plus a right guess means the Liar escapes; caught plus a wrong guess means Detectives win. Guesses from a non-Liar or about a non-candidate are rejected.
  10. The QA "always caught" scenario reaches the guess every time.
  11. Replays are reproducible, and every picture can be the secret.
  12. EN/ES strings are complete.
- **Still passing:** the baseline's 18 cases, the Case Logic tests, the game suites and `tsc`.
- **Production web export:** `/visual-prototype` redirects home, with no entry button.
- **Real UI at 390 px** (headless Chromium, scripted taps, no page errors):
  - B Detective round, B Liar round, the QA catch in English and Spanish;
  - Stay and Leave, Play again, Main menu;
  - the baseline is still reachable;
  - no picture appeared on a Liar screen before the vote.
  - Screenshots are in `screens-b/`.
- **Not tested on a physical iPhone.**

### Remaining exploits

1. **Choosing blind is usually safe.** Every card fits at least two of the three pictures, and the curtain fits all three. The show-like cards fit both the magic show and the masquerade, so a Liar who picks "show" cards is exposed mainly when the secret is the haunted house.
2. **Repeat players learn the three pictures.** After one Variant B round, everyone knows the candidate set:
   - Detectives can then calculate exactly what each card gives away;
   - the Liar can plan the final guess from the start.
   
   A real game needs many candidate sets. That is content expansion, so it's deferred until after the founder playtest.
3. **Detectives judge what they give away by feel**, without seeing the other pictures. The leak is collective and can't be coordinated.
4. **The masquerade fits five of six cards.** It is the easiest secret for a blind Liar.
5. **The pictures are part of the app bundle.** Someone with developer tools could find them.
6. **Persuasion by talking is untested.** There's no question step in B.

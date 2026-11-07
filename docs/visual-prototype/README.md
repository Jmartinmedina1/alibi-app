# Visual Bluffing Prototype

> **Update:** Variant B (one card, then a caught Liar can win by naming the picture) is described in [variant-b.md](variant-b.md). This README describes the baseline (Variant A), which is unchanged.

**Test idea:** "Show that you know the picture without giving it away."

**Status.**
- Branch `prototype/visual-bluff`, which starts from `prototype/case-logic`.
- Development builds only. Never merged to `main`.
- Not played by a fresh human, so nothing here says the game is understandable or fun.

**Code.**
- `app/src/visual-prototype/`
- Route: `app/src/app/visual-prototype.tsx`
- Art: `app/assets/visual-prototype/`, built from the SVG sources in `tools/visual-art/`

## Run it

```
cd app
npm install
npx expo start --web --host lan
```

- **Mac:** open http://localhost:8081/visual-prototype.
- **Landing page:** in development, it shows "🧪 Visual Bluffing Prototype (dev)".
- **iPhone:** see `docs/prototype/HANDOFF.md`. Use the same steps with `/visual-prototype` at the end of the address.
- **Production builds:** redirect `/visual-prototype` to home and show no button. Checked with a production web export. The same flags as the Case Logic Prototype control this (`app/src/prototype/flags.ts`).

## The round

1. **Briefing.**
   - The human chose Detective or Liar on the start screen.
   - Three short cards explain the game. The tie rule is stated here.
   - A Detective sees the picture. The Liar sees only "Entertainment" plus one sentence.
2. **Selection 1.** "Choose a card connected to the secret picture."
   - Everyone commits secretly. Only who is ready is shown.
   - Then everyone's choices are revealed together, with names and portraits. A Continue button follows.
3. **Selection 2.** "Choose a different card connected to the picture."
   - Each player's own first card is disabled.
   - Choosing a card someone else chose is allowed.
   - The first choices stay visible above the cards. Then the second reveal, and Continue.
4. **Optional question.** The human picks one player and one of that player's cards: "Why did you choose [card]?"
   - The bot answers with one short sentence, which isn't marked true or false.
   - The human can also skip.
5. **Secret vote.** The tie rule is repeated above the choices.
6. **Result.**
   - "Detectives found the Liar" or "The Liar blended in".
   - Then: who the Liar was, whether the vote tied, the picture, everyone's two cards and vote counts, who voted for whom, and the question and answer.
   - A note that players were judging connections and that a plausible bluff can succeed.
   - Buttons: Play again, Main menu.

**Removed:** interrogation trees, reactions, meters, correctness labels, the location guess, points, catchphrases and timers.

**Always available:** Home (with an in-page leave confirmation), EN/ES, and a Picture button for Detectives (Category for the Liar).

## Art

- **No existing asset showed this scene.** The picture and the six card illustrations are original, simple vector drawings, labelled "Prototype illustration" under the image.
- **What the picture contains:** a red entrance curtain, a masked performer stepping out beside a rattling cupboard, a green dashed floor trail, and three visitors.
- **No text inside the image,** so it works in both languages.
- **The card art uses one ink-and-amber palette for all six.** Even the curtain card is amber, so no card's colour hints at the picture.

## Knowledge boundaries

| | Detective bot | Liar bot |
|---|---|---|
| Receives | the six cards, completed reveals, the public answer, its own picks, **scene associations** | the six cards, completed reveals, the public answer, its own picks, **the category** |
| Never receives | other players' pending picks | the picture, its description, the scene key, the associations, or pending picks |

- **Bot knowledge.** Bots get only `knowledgeFor(state, botId)`.
- **Liar view.** The human's screen renders only `viewFor(state, 'you')`. For the Liar, that view has no `scene` field until the result.
- **The picture.** It is drawn only from the key a view carries.

### Bot heuristics (what is actually used)

**Detective association table** (`associations.ts`): my own judgment. It is never shown to players.

| Card | Score | Why |
|---|---|---|
| Curtain | 3 | Visible: the entrance |
| Mask | 3 | Visible: the performer |
| Footprints | 2 | Indirect: the floor trail and walking group |
| Key | 1 | Weak: the cupboard |
| Spotlight | 1 | Weak: "a show" |
| Microphone | 0 | No connection I could see |

**Detective pick.**
- The bot chooses a *direct* card (score 3) with a probability set by personality: Skater Leo 70%, Chef Bruno 50%, Granny Dot 30%.
- Otherwise it chooses an *indirect or weak* card (score 1–2).
- It never picks a score-0 card, and never repeats its own card.

**Liar category hints** (`categoryHints.ts`), written for "Entertainment" alone:
- 2: microphone, spotlight, curtain;
- 1: mask;
- 0: key, footprints.

*Caveat:* I wrote these hints after drawing the scene, so they may carry author bias.

**Liar pick.**
- **Selection 1:** a card with the best category hint.
- **Selection 2:** the card other players chose most in selection 1, excluding its own. Ties are broken by category hint, then by seeded randomness.

**Explanations.**
- **Detective bots** use the association's sentence, which may refer to the picture ("Somebody in there didn't want their face seen").
- **Liar bots** use either a category sentence or "[card]: I wasn't the only one who noticed that". The second one is used only when they copied a public choice.

**Votes.**
- **Detective bot:** the lowest total of *its own* association scores across a player's two cards. Equal totals count as equally plausible, broken by seeded randomness. A low total is not proof: Detectives choose weak cards on purpose.
- **Liar bot:** the player whose cards nobody else chose.
- **No bot weighs the spoken answer.**

**Personality changes only style and wording, never what a bot knows.** Bot reasoning appears only in a collapsed "Bot reasoning (debug)" panel on the result screen, in development builds.

## Verification

**Test cases** (`npx tsx src/visual-prototype/tests/visual.test.ts`): 18 cases, all pass. Loops over seeds are stated, not counted as extra cases.

1. A Detective round completes (300 seeds).
2. A Liar round completes (300 seeds).
3. The Liar's view has no scene key, description or unspoken association text at any step before the result (300 seeds). A Detective's spoken answer is public.
4. The Liar bot's knowledge has no scene, associations or description at any step (300 seeds).
5. Detective views never reveal who the Liar is before the result.
6. Pending selections stay private: views and bot knowledge contain only revealed rounds.
7. The Liar bot's pick is the same before and after Detectives commit their pending picks.
8. With the association table inverted, Liar bot picks are unchanged, while Detective bot picks change in most seeds.
9. The reveal waits for every submission: three bot commits don't reveal anything, and the fourth does.
10. The second selection blocks only your own first card. Four identical first picks and shared second picks are allowed. No player ever repeats their own card (300 seeds).
11. Duplicate taps and changes after committing are ignored, and out-of-turn actions are rejected.
12. Challenge answers:
    - a Liar bot's answer comes only from category or public-choice templates, never a picture sentence;
    - a Detective bot's answer comes from its associations;
    - only one question is allowed, and only about a card the player actually chose.
13. Votes and ties:
    - a clear majority finds the Liar;
    - a 2–2 tie identifies nobody and the Liar escapes;
    - a wrong suspect lets the Liar escape;
    - the QA tie gives 1-1-1-1.
14. Bot votes are reproducible, and equally plausible suspects do occur.
15. Every Detective bot personality uses both direct and indirect picks.
16. Replay starts clean, and the same seed replays identically.
17. Everyone gets the same six concepts in different positions.
18. The EN/ES strings, card labels and explanations are complete, with matching placeholders.

**Also run:**
- the existing game suites (ALL PASSED / RUNOFF OK / SAFETY OK);
- the Case Logic Prototype tests (PROTOTYPE OK);
- `tsc --noEmit` (clean).

**Real UI at 390 × 844** (headless Chromium, reduced motion, scripted taps, no page errors):
- Detective round, Liar round, Spanish Detective round, QA tie;
- Leave → Stay keeps the round; Leave returns to the start screen;
- Play again shows a new briefing; Main menu goes to `/`;
- the Liar never had the scene on screen before the result.

Screenshots are in `screens/`. **Not done: a physical iPhone test.**

**Forced QA (kept separate):** only "QA: forced 1-1-1-1 tie". It exists to show the tie screen. It is excluded from the numbers below.

## Ordinary-play simulation (bots only, 2000 rounds each; `tools/visual-sim.ts`)

The "human" follows the bot rules. These numbers describe the bots, not people.

| | Found the Liar | Tie | Wrong suspect |
|---|---|---|---|
| Human Detective | 39% | 14% | 47% |
| Human Liar | 38% | 14% | 49% |

| | Selection 1 | Selection 2 |
|---|---|---|
| Liar picks a direct card (curtain/mask) | 33–34% | 59–60% |
| Detectives pick a direct card | 50–51% | 50–51% |
| Liar picks the microphone | 33% | 0% |

- The Liar has the strictly lowest association total in only 27% of rounds.

## Known design weaknesses

1. **The six cards help the Liar infer the scene.**
   - Four of the six (curtain, mask, spotlight, microphone) suggest a show, which matches "Entertainment". Before seeing anything else, the Liar can guess the theme.
   - After the first reveal, the Liar can copy the most popular card. In simulation that makes its second card *more* direct than the Detectives' (60% vs 51%).
   - The Liar can't learn "haunted house" specifically, but doesn't need to.
   - **So:** selection 2 is easy to bluff, and most of the information is in selection 1.
2. **Selection 1 rests mostly on one decoy.** Microphone has no connection in my table, and the Liar picks it a third of the time. A real Detective might pick it too ("someone was screaming"), so this tell depends on my table, not on the picture.
3. **One person's associations.** Bot judgments and votes rest on my scores. Real players will connect cards differently, and nothing is scored as correct.
4. **Copying isn't visible as a tell.** A Liar who copies the crowd looks like everyone else, and the game doesn't flag it.
5. **The spoken defence is untested.** A bot answers in one sentence. A real player's live explanation is the part that could carry the game, and bot dialogue doesn't validate it. Bots don't use answers when voting.
6. **Outcomes are close to a coin flip with bots** (38–39% found, 14% ties). That may be acceptable or too random; only real rounds can tell.
7. **Practice runs on one device.** The full game state is held in the app, and the scene image is part of the app bundle. The screen renders only the view model, but a curious player with developer tools could find the picture. A multiplayer version must send view models from the server.
8. **The prototype code ships in production bundles,** unreachable, the same as the Case Logic Prototype.
9. **Spanish wording.** "El Mentiroso" is used as the generic role name, matching the existing game.

## Founder acceptance test

Give only this instruction: **"Show that you know the picture without giving it away."** Then observe:

- Can I make my first choice without coaching?
- Can I explain why I chose it?
- Does the second reveal change my suspicion?
- As the Liar, can I form a plan?
- Can I miss some dialogue and still participate?

If any of these is "no", record it as a mechanism failure. Don't add a longer tutorial to compensate.

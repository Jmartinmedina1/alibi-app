# Evidence repair: the Ferris wheel (paper only)

**Checker** (in `tools/round-check/`):
- `public.py [before|wheel-operator|booth-sees-wheel]`: the shared world model; writes `public_<variant>.json`.
- `obvious.py <variant>`: groups the claim patterns by structure; reads that JSON.
- `examples.py`: the two Ferris-wheel examples.

Earlier reports and checkers are unchanged. No gameplay changes.

**Result:**
- **The repair closes the Ferris-wheel blind spot.**
- **It leaves the round mechanically solvable with an obvious plan whenever it is solvable at all.**
- **The only remaining uncertainty is a symmetric guess.**

## 1. Knowledge consistency

**The setup catalogue is not public.** Setup IDs and the list of prepared setups are author-only.

**My previous checkers were inconsistent:**
- **The Detective's guarantees** were checked against every logically possible world.
- **The Liar's cover values** were computed only over the catalogue setups in which he was the Liar (`lead.py`, the Liar-row code). That is a privileged catalogue lookup.

**Corrected model (`public.py`), shared by both roles:**

| | Public world model | Narrowed by |
|---|---|---|
| Both | Three suspects claim places A–D. Exactly one claim is false. Honest suspects were at their claimed place for the whole window; the Liar was somewhere else. The booth can see the wheel. | — |
| Detective | Every world consistent with the claims and what his own investigation revealed | Nothing private |
| Liar | His own true place is the Prize Tent. The others could each have been at any of A–D: 16 arrangements. | His identity and timeline. After the claims he can deduce everyone's place, and the checker lets him give any answer. |

**Results that change:**
- **Liar cover values, before the repair.** Under the public model they are **identical for all three suspects**: the wheel, food stalls and parking lot are non-dominated; the photo booth is dominated; nothing is unbeatable.
  - The earlier per-character differences (Dot wheel/lot, Leo wheel/stalls, Bruno wheel/lot) were artefacts of the catalogue lookup.
- **"Family knowledge only" results.** These disappear: no policy may use the catalogue. Those claim patterns are counted with the ordinary non-guaranteed ones.
- **Catalogue outcomes are a frequency sample, not a game property.** Any statement about *how often* someone wins depends on how often each arrangement occurs and how players choose, and I have not assigned either.

## 2. The evidence change

> **Record A · Ferris wheel operator: "The operator lists who was at the Ferris wheel between 9:15 and 9:30."**

This is a change to an existing source. The wheel staff record previously said "closed for repairs; we didn't watch". It now lists names exactly as records B, C and D do, and it returns to the menu as option A.

- **It doesn't announce the Liar.** It shows who was at the wheel. It only exposes a false Ferris-wheel claim if that record is the one opened.
- **No other rule changes.** A/B/C/D, locked claims, accurate witnesses, one fabricated alibi, one question plus one record in either order, and insufficient evidence as a draw all stay as they were.
- **Alternative considered.** "The booth attendant also lists who was at the wheel" produced the same counts. I propose the operator version because it keeps one record per place and doesn't make the booth record special.

## 3. Before and after for the formerly untestable Ferris-wheel claims

| Situation (hidden) | Visible claims | Before | After |
|---|---|---|---|
| Dot lies and claims the wheel; Leo at the stalls, Bruno in the lot | Dot wheel · Leo stalls · Bruno lot | **No plan can catch Dot.** | Opening record A catches her ("nobody at the wheel"). The Detective has no visible reason to choose A over C or D, so it's a 1-in-3 choice. |
| Leo lies and claims the wheel; Dot really at the wheel; Bruno at the stalls | Dot wheel · Leo wheel · Bruno stalls | **Unresolvable.** Both say "nobody else was here". | **Guaranteed:** two people claim the wheel, so open record A. It lists only Dot, so Leo is the Liar. |

## 4. Re-evaluation (all 64 claim patterns, policies using only visible information, Liar answers adversarial)

| | Before (no wheel evidence) | After (wheel operator) |
|---|---|---|
| Claim patterns with a guaranteed policy | 45 | 52 |
| Partial (some actions better, none guaranteed) | 18 | 12 |
| Symmetric (every action equally good) | 1 | 0 |
| Universal guaranteed Detective policy | No | **No** |
| Unbeatable Liar strategy | No | **No** |
| Liar covers: arrangements where a guaranteed policy catches the cover / only a lucky choice catches it / nothing catches it (of 16) | Wheel 9 / 0 / 7 · Booth 14 / 2 / 0 · Stalls 11 / 5 / 0 · Lot 11 / 5 / 0 | Wheel 14 / 2 / 0 · Booth 14 / 2 / 0 · Stalls 12 / 4 / 0 · Lot 12 / 4 / 0 |
| Dominated covers | Photo booth | **None.** Each cover is better than another in some arrangement. |
| Patterns where a first result changes the worthwhile second step | 12 | **0** |

The Liar columns count arrangements; they are not probabilities. "Not dominated" is a frequency-free comparison. Which cover is *better* depends on how often the honest suspects are at each place.

### The plan after the repair (checker: it finds every guarantee)

1. **Two or more people claim the same place** (40 patterns): open that place's record. **Guaranteed.**
2. **All claims differ, and one is the wheel and another the booth** (12 patterns): question the booth claimant and open record B. **Guaranteed.**
3. **All claims differ otherwise** (12 patterns): open the record for any one claimed place. You catch the Liar only if you happened to pick his claim; the best achievable result is 6–8 of the 12 possible worlds. **Symmetric between the claimed places**, apart from avoiding records for unclaimed places.

## 5. Remaining failures

1. **The game is mechanically solvable with an obvious plan.** Whenever a guarantee exists, the three-line recipe above finds it, and **no investigation result ever changes what to do next**. The question/record choice no longer involves reasoning about evidence.
2. **The only uncertainty left is a symmetric guess.** When all three claims are at different places, with no wheel-and-booth pair, nothing visible favours one record over another.
3. **The Liar's decision is a guess about occupancy.** His aim is to claim a place nobody honest claimed, without forming a wheel-and-booth pair. That is a real risk under uncertainty, but no cover is better in a way he can reason about; it depends entirely on where the others happened to be.
4. **Still undetermined:** balance (needs assumptions about how often each arrangement occurs and how players choose), multiple Detectives, bots, and human clarity.

I am stopping here, as instructed. I have added no further mechanism.

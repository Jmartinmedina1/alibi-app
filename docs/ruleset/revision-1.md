# Revision 1 (on paper): result

> **Correction (Nov 8):**
> - The section "Why this is structural" below claimed the design gate cannot be met.
> - That claim is **withdrawn**. The checker only showed that each tested *state* had (or lacked) a winning plan; it never tested whether one plan a player could follow wins across hidden states.
> - See `setup-family.md` for the analysis that keeps those two apart.
> - The checker findings in this report still stand.

Riverside Fair is not being implemented. Its report (`riverside-fair-round.md`) and checker (`tools/round-check/round.py`, `tests.py`, `gen.py`) are unchanged.

This revision's checker is `tools/round-check/r1.py`. Run it with `python3 tools/round-check/r1_run.py`.

## What changed on paper

1. **Kept:** A/B/C/D choices, locked claims, exactly one fabricated alibi, and evidence fixed before play.
2. **Short, explicit facts instead of spatial wording.** Every account and record now speaks about a whole place for the whole 9:15–9:30 window. There is no "inside the rope" vs "path", "inside the booth" vs "queue", or 9:20 vs 9:22.
3. **Free order.** The Detective may question first or open a record first, and choose the second action after seeing the first.
4. **Two covers designed not to dominate each other:**

| Cover | Benefit | Exposure the other one doesn't share |
|---|---|---|
| **A · Ferris wheel** | No record says who was there (the staff only report "closed for repairs") | Whoever was at the photo booth could see the wheel |
| **D · Parking lot** | Nobody can see the lot | The lot camera records who was there |

**Facts (all short, whole window):**
- **Dot (photo booth):** "Nobody else was at the booth. Nobody was at the Ferris wheel."
- **Leo (food stalls):** "Nobody else was at the food stalls."
- **Records:**
  - **A** Ferris wheel staff: "Closed for repairs. We didn't watch who was nearby."
  - **B** Booth attendant: "Only Granny Dot was at the booth."
  - **C** Churro vendor: "Only the skateboarder was at the food stalls."
  - **D** Lot camera: "Nobody was in the parking lot."

## Revised decision table (checker results)

Every legal plan was checked against every answer the Liar could give. "Wins" means the plan leaves only Bruno, whatever he answers.

**Budget: 1 question + 1 record, in either order**

| Bruno's cover | Plans that always win | Can the Detective tell which plan to use? |
|---|---|---|
| A Ferris wheel | Ask the photo-booth claimant, then open record B | Yes: the claim is at the wheel and the map says the booth sees it |
| B Photo booth (shared with Dot) | Open record B (any question) | Yes: two people claim the booth |
| C Food stalls (shared with Leo) | Open record C (any question) | Yes: two people claim the stalls |
| D Parking lot | Open record D (any question) | Yes: someone claims the lot |

**Budget: one action only (a question or a record)**

| Bruno's cover | Plans that always win | Best possible result |
|---|---|---|
| A Ferris wheel | **None** | Two suspects left (Dot or Bruno) |
| B, C, D | Open the record for the claimed place | Bruno identified |

## Remaining failure cases

**Established by the checker:**
1. **1 question + 1 record (free order): a guaranteed win exists.** "Open the record for any shared place or the lot; if someone claims the wheel, question whoever claimed the booth and open the booth record" identifies the Liar against every cover and every answer. The two covers are each beaten by a different plan, but the Detective can see which cover was used and pick the plan that beats it.
2. **One action only: the Ferris wheel is unbeatable.** The best plan leaves Dot or Bruno. Every other cover always loses, so the wheel dominates.
3. Either way, the result for each cover is fixed in advance: always caught, or never resolved. Nothing in between comes from reasoning rather than chance.

**Why this is structural, not a matter of tuning (my analysis):**
- In one fixed round, the Detective sees which place each suspect claimed, and everything a question or record reveals is fixed. For each cover, either some plan always catches it, or none does.
- **If every cover has a catching plan,** reading the claims and picking that plan is a guaranteed win.
- **If some cover has no catching plan,** it is unbeatable.
- **The only middle ground is a choice the Detective cannot inform,** such as which of two identical claimants to question. That was Riverside Fair's failure.
- So "no guaranteed plan", "no unbeatable cover" and "no uninformed choice" cannot all hold in a single fixed round. Changing the budget or the order only moves the case between the first two failures.

**What would be needed, and is out of scope here:**
- The Detective must be unsure about something the claims don't reveal: *who* the Liar is, and *where* the honest suspects really were, across several prepared setups.
- Only then can an investigation be a reasoned bet, backed by observable reasons such as which places records cover, rather than a guaranteed win or a coin flip.
- It is also the only setting in which the Liar's cover choice, made without knowing where others were, can be judged as a real risk.
- That requires either more content (alternative setups) or a mechanic that hides information. You ruled out both for this revision, so I stopped here.

**Human judgments about clarity (not checked by the model):**
- The explicit whole-place facts read more clearly than Riverside Fair's spatial distinctions. That is my reading; nobody has tested it.
- "We didn't watch who was nearby" (record A) is easy to understand, but it may feel like a wasted card when opened.
- Free order is easy to explain and removes the arbitrary sequencing rule.

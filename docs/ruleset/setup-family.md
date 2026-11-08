# Hidden-setup family: what the Detective can actually observe

Paper analysis only. No gameplay changes.

**Checker** (in `tools/round-check/`):
- `family.py`: the model.
- `family_run2.py 3|6|7`: one run per family size.
- `family_report.py`: dominated covers, and where a result changes the next step.
- `family_tables.py`: the tables below. It reads the `family7.json` file written by the seven-setup run.

**Rules, unchanged from Revision 1:**
- **Places:** A Ferris wheel, B photo booth, C food stalls, D parking lot. The Prize Tent is never a valid alibi.
- **Map:** the booth can see the wheel.
- **Claims:** locked; exactly one alibi is fabricated; honest suspects are accurate.
- **Budget:** one question and one record, in either order.
- **Question:** "Who else was at your place?" At the booth it adds "and who was at the Ferris wheel?"
- **Records:**
  - A (wheel staff) says nothing about people.
  - B, C and D each list exactly who was at that place.

## 1. Information-boundary audit of my previous analysis

| Question | Answer |
|---|---|
| Did the Detective policy receive Bruno's identity? | **Not as an input, but in effect yes.** Plans were scored only in the world where Bruno lies, and a plan "won" when it singled him out. |
| Was an investigation chosen with information the player doesn't have? | **Yes.** "Use the plan that catches this cover" assumes you know which claim is false. |
| Did I prove one player-executable policy wins across states, or only that each state has a winning plan? | **Only the second.** Revision 1's statement that the gate "cannot be met in one fixed round" is **withdrawn**. It confused these two findings. |

**This analysis instead:**
- **Detective plans** are functions of visible information only: the claims, then what the first action showed. Each plan is scored across every hidden setup that looks the same.
- **The Liar's cover** is a function of his private information only: his identity, and that he was in the Prize Tent. It is scored across every setup he can't tell apart.
- **The Liar's answers** are a free choice. A plan counts only if it works against **every** answer he could give.
- The checker found that denying an honest co-claimant ("nobody else was here") sometimes beats copying the other claims, so that option is included.

## 2. The setup family

Each setup's facts are fixed before play. The Liar spends 9:15–9:30 in the Prize Tent, and both honest suspects spend the whole window at one place. Players never see the setup ID.

| Setup | Liar | Granny Dot | Skater Leo | Chef Bruno | Why it is in the family |
|---|---|---|---|---|---|
| S1 | Bruno | Photo booth | Food stalls | *Prize Tent* | Starting three: each suspect lies once |
| S2 | Dot | *Prize Tent* | Food stalls | Parking lot | Starting three |
| S3 | Leo | Photo booth | *Prize Tent* | Parking lot | Starting three |
| S4 | Bruno | Ferris wheel | Parking lot | *Prize Tent* | Added: with three setups, each Liar effectively knew where the others were. Now each faces two possible arrangements. |
| S5 | Dot | *Prize Tent* | Parking lot | Food stalls | Added for the same reason |
| S6 | Leo | Ferris wheel | *Prize Tent* | Food stalls | Added for the same reason |
| S7 | Dot | *Prize Tent* | Food stalls | Photo booth | Added: in S2 and S5 nobody was at the booth, so "Dot claims the wheel" was unbeatable. That came from the family, not the rules. |

Stopping points:
- **At 3 setups:** 1 unbeatable Liar state; each Liar had no uncertainty.
- **At 6:** Dot's Ferris-wheel claim was unbeatable in both of her setups.
- **At 7:** no unbeatable Liar strategy, so I stopped.

## 3. Groups by visible information (7 setups × 4 covers = 28 hidden states → 20 visible claim patterns)

All three suspects could be the Liar in every pattern before investigating.
- **Best result:** the number of states in the group that the best player-executable policy identifies.
- **Over every hidden state:** the same policy scored against every logically possible hidden state with those claims, not just the family's. This catches policies that only "work" because the family is small.

| Visible claims | Hidden states in this group | Best result | Over every hidden state with these claims | Classification |
|---|---|---|---|---|
| Dot Wheel, Leo Lot, Bruno Stalls | S4 (Bruno lies, cover C); S5 (Dot lies, cover A); S6 (Leo lies, cover D) | 1/3 | 7/12 | Partly informed (the wheel claim is untestable), then a symmetric choice between the two testable claims |
| Dot Booth, Leo Stalls, Bruno Lot | S1 (Bruno lies, cover D); S2 (Dot lies, cover B); S3 (Leo lies, cover C) | 1/3 | 8/12 | Completely symmetric: each record tests one claim, questions add nothing |
| Dot Booth, Leo Stalls, Bruno Booth | S1 (Bruno lies, cover B); S7 (Dot lies, cover B) | 2/2 | 12/12 | Guaranteed after good investigation |
| Dot Wheel, Leo Wheel, Bruno Stalls | S6 (Leo lies, cover A) | 0/1 | 6/12 | No meaningful decision: nothing can test the wheel claim; "insufficient evidence" is correct |
| Dot Wheel, Leo Booth, Bruno Stalls | S6 (Leo lies, cover B) | 1/1 | 12/12 | Guaranteed after good investigation |
| Dot Wheel, Leo Stalls, Bruno Booth | S7 (Dot lies, cover A) | 1/1 | 12/12 | Guaranteed after good investigation |
| Dot Wheel, Leo Stalls, Bruno Stalls | S6 (Leo lies, cover C) | 1/1 | 12/12 | Guaranteed after good investigation |
| Dot Wheel, Leo Stalls, Bruno Lot | S2 (Dot lies, cover A) | 0/1 | 7/12 | No meaningful decision: nothing can test the wheel claim; "insufficient evidence" is correct |
| Dot Wheel, Leo Lot, Bruno Wheel | S4 (Bruno lies, cover A) | 0/1 | 6/12 | No meaningful decision: nothing can test the wheel claim; "insufficient evidence" is correct |
| Dot Wheel, Leo Lot, Bruno Booth | S4 (Bruno lies, cover B) | 1/1 | 12/12 | Guaranteed after good investigation |
| Dot Wheel, Leo Lot, Bruno Lot | S4 (Bruno lies, cover D) | 1/1 | 12/12 | Guaranteed after good investigation |
| Dot Booth, Leo Wheel, Bruno Lot | S3 (Leo lies, cover A) | 1/1 | 12/12 | Guaranteed after good investigation |
| Dot Booth, Leo Booth, Bruno Lot | S3 (Leo lies, cover B) | 1/1 | 12/12 | Guaranteed after good investigation |
| Dot Booth, Leo Stalls, Bruno Wheel | S1 (Bruno lies, cover A) | 1/1 | 12/12 | Guaranteed after good investigation |
| Dot Booth, Leo Stalls, Bruno Stalls | S1 (Bruno lies, cover C) | 1/1 | 12/12 | Guaranteed after good investigation |
| Dot Booth, Leo Lot, Bruno Stalls | S5 (Dot lies, cover B) | 1/1 | 8/12 | Family knowledge only: over all hidden states this is the same 1-in-3 test |
| Dot Booth, Leo Lot, Bruno Lot | S3 (Leo lies, cover D) | 1/1 | 12/12 | Guaranteed after good investigation |
| Dot Stalls, Leo Stalls, Bruno Booth | S7 (Dot lies, cover C) | 1/1 | 12/12 | Guaranteed after good investigation |
| Dot Stalls, Leo Stalls, Bruno Lot | S2 (Dot lies, cover C) | 1/1 | 12/12 | Guaranteed after good investigation |
| Dot Stalls, Leo Lot, Bruno Stalls | S5 (Dot lies, cover C) | 1/1 | 12/12 | Guaranteed after good investigation |
| Dot Lot, Leo Stalls, Bruno Booth | S7 (Dot lies, cover D) | 1/1 | 8/12 | Family knowledge only: over all hidden states this is the same 1-in-3 test |
| Dot Lot, Leo Stalls, Bruno Lot | S2 (Dot lies, cover D) | 1/1 | 12/12 | Guaranteed after good investigation |
| Dot Lot, Leo Lot, Bruno Stalls | S5 (Dot lies, cover D) | 1/1 | 12/12 | Guaranteed after good investigation |

### What each investigation establishes, in the groups with more than one hidden state

The arrow shows who could still be the Liar afterwards.

**Claims: Dot Booth, Leo Stalls, Bruno Booth**

| Investigation | S1 (Bruno lies) | S7 (Dot lies) |
|---|---|---|
| Record A (Wheel) | nothing about people → Dot/Leo/Bruno | nothing about people → Dot/Leo/Bruno |
| Record B (Booth) | Dot → Bruno | Bruno → Dot |
| Record C (Stalls) | Leo → Dot/Bruno | Leo → Dot/Bruno |
| Record D (Lot) | nobody → Dot/Leo/Bruno | nobody → Dot/Leo/Bruno |
| Question Dot | with me: nobody; at the wheel: nobody → Dot/Bruno | Liar answers as he likes |
| Question Leo | with me: nobody → Dot/Leo/Bruno | with me: nobody → Dot/Leo/Bruno |
| Question Bruno | Liar answers as he likes | with me: nobody; at the wheel: nobody → Dot/Bruno |

**Claims: Dot Booth, Leo Stalls, Bruno Lot**

| Investigation | S1 (Bruno lies) | S2 (Dot lies) | S3 (Leo lies) |
|---|---|---|---|
| Record A (Wheel) | nothing about people → Dot/Leo/Bruno | nothing about people → Dot/Leo/Bruno | nothing about people → Dot/Leo/Bruno |
| Record B (Booth) | Dot → Leo/Bruno | nobody → Dot | Dot → Leo/Bruno |
| Record C (Stalls) | Leo → Dot/Bruno | Leo → Dot/Bruno | nobody → Leo |
| Record D (Lot) | nobody → Bruno | Bruno → Dot/Leo | Bruno → Dot/Leo |
| Question Dot | with me: nobody; at the wheel: nobody → Dot/Leo/Bruno | Liar answers as he likes | with me: nobody; at the wheel: nobody → Dot/Leo/Bruno |
| Question Leo | with me: nobody → Dot/Leo/Bruno | with me: nobody → Dot/Leo/Bruno | Liar answers as he likes |
| Question Bruno | Liar answers as he likes | with me: nobody → Dot/Leo/Bruno | with me: nobody → Dot/Leo/Bruno |

**Claims: Dot Wheel, Leo Lot, Bruno Stalls**

| Investigation | S4 (Bruno lies) | S5 (Dot lies) | S6 (Leo lies) |
|---|---|---|---|
| Record A (Wheel) | nothing about people → Dot/Leo/Bruno | nothing about people → Dot/Leo/Bruno | nothing about people → Dot/Leo/Bruno |
| Record B (Booth) | nobody → Dot/Leo/Bruno | nobody → Dot/Leo/Bruno | nobody → Dot/Leo/Bruno |
| Record C (Stalls) | nobody → Bruno | Bruno → Dot/Leo | Bruno → Dot/Leo |
| Record D (Lot) | Leo → Dot/Bruno | Leo → Dot/Bruno | nobody → Leo |
| Question Dot | with me: nobody → Dot/Leo/Bruno | Liar answers as he likes | with me: nobody → Dot/Leo/Bruno |
| Question Leo | with me: nobody → Dot/Leo/Bruno | with me: nobody → Dot/Leo/Bruno | Liar answers as he likes |
| Question Bruno | Liar answers as he likes | with me: nobody → Dot/Leo/Bruno | with me: nobody → Dot/Leo/Bruno |

**Where a result changes which second step is worth taking (checker):** if the claims include someone at the booth, open record B first:
- if it lists **only that person**, question them; they are now known to be honest, and their view of the wheel becomes evidence;
- if it lists **nobody**, the booth claimant is already identified, and the question can't add anything further.

**Never worthwhile (checker):** record A, the wheel staff. It is never better than any alternative.

## 4. Worked investigation using only player-visible information

**Visible:** Dot claims the photo booth, Leo the food stalls, Bruno the Ferris wheel.

1. **Anyone could be lying.** The visible facts that matter:
   - no record lists who was at the wheel;
   - only someone at the booth can see the wheel;
   - record B lists exactly who was at the booth.
2. **Observable reason to start with record B.** It tests Dot's claim directly. If her claim holds, it also makes her view of the wheel trustworthy.
3. **Open record B: "Granny Dot."** Dot's alibi is true, so she is honest.
4. **Question Dot: "Nobody else was at the booth; nobody was at the Ferris wheel."** She is honest, so Bruno's wheel claim is false. **Bruno's alibi is the fabricated one.**
5. **The other possible results:**
   - Record B lists **nobody**: Dot's claim is false.
   - Record B lists **Dot and someone else**: that other person's claim is false.
   - Dot reports **Bruno at the wheel**: Bruno is honest, so Leo is the Liar.

   The checker confirms this policy identifies the Liar in **12/12** hidden states with these claims, so the conclusion doesn't depend on knowing the family.

**Contrast:** Dot claims the booth, Leo the stalls, Bruno the parking lot.
- Every claim sits at a different place with its own record, and no question covers anyone else's place.
- One record tests one claim. **No visible reason prefers B, C or D.** The best result is 1 in 3: a symmetric guess, not deduction.

## 5. Checker findings vs. design judgments

**Established by the checker:**
1. **No universal winning Detective policy** over the 7-setup family. Two visible patterns allow at best 1 of 3 states.
2. **No unbeatable Liar strategy** with 7 setups. With 3 or 6 setups there was one: Dot claiming the wheel, an artefact of the family.
3. **Each Liar has exactly two non-dominated covers** across the setups he can't tell apart:
   - Dot: **wheel / lot**;
   - Leo: **wheel / stalls**;
   - Bruno: **wheel / lot**.

   - **The Ferris wheel:** it can't be tested when nobody honest is at the booth, but it is caught for certain when someone is.
   - **The other cover:** an empty place with a record. It can only be caught by a Detective who happens to open that record.
   - **The photo booth** is dominated for every Liar.
4. **Guaranteed after good investigation:** 12 of 20 patterns. These are the ones where two people claim the same place, or a wheel claim sits alongside a booth claimant.
5. **No meaningful decision:** 4 patterns. A wheel claim with nobody at the booth can't be tested by any plan, and "insufficient evidence" is the correct call.
6. **Symmetric guesses:** 2 patterns with three states each (1 in 3), plus 2 single-state patterns that look guaranteed but score 8/12 over all hidden states. That success comes from the family's small size, not from any visible reason.
7. **The Liar's answer matters.** Denying an honest co-claimant beats copying the claims when the Detective then opens the wrong record. It never survives the right record.

**Design judgments (not checked):**
- The visible reasons, "a shared claim" and "the booth can see the wheel", seem easy for players to spot. Untested.
- A 1-in-3 symmetric test will probably feel arbitrary to players, even though it is rare.
- A wheel cover that is sometimes completely safe and sometimes certainly caught may feel like luck to the Liar. It is a real risk, though, since he can't know whether someone was at the booth.
- The checker counts setups and assigns no probabilities. How often each setup should come up is a design choice I have not made.

## 6. Remaining failures

1. **The Liar's second cover leads to a symmetric guess.** Claiming an empty place that has a record leaves the Detective one record to test one of three equally placed claims. There is no observable reason to prefer one, so the best is 1 in 3. This is the most important remaining failure.
2. **When nobody watches the wheel, no decision is possible.** Four patterns give the Detective nothing to do except declare insufficient evidence.
3. **Record A is a dead option.** It never helps.
4. **Two patterns are solvable only through knowledge of the family.**
5. **Out of scope:** probabilities over setups, multiple Detectives, bot behaviour, and human clarity.

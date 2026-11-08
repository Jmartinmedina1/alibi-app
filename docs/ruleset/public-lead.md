# Targeting the information gap with one public lead

Paper analysis only. No gameplay changes.

**Checker** (in `tools/round-check/`):
- `lead.py [none|stalls|booth|lot|wheel]`: the count leads.
- `sight.py [base|stalls-lot|booth-stalls]`: the line-of-sight leads.

**Result: no tested lead passes.** Seven candidates were tested. Every one that removes the blind patterns either makes the Ferris wheel the Liar's only sensible cover, or leaves him with no choice that matters. That holds for these candidates only; it is not a general proof.

## 1. Corrected knowledge model

| Role | Receives | Does not receive |
|---|---|---|
| **Liar** | Their identity and actual timeline (Prize Tent, 9:15–9:30); the public rules and map; the public lead, if any; every claim; every answer and record revealed during the round | Other suspects' hidden timelines; the setup ID |
| **Detective** | The public rules and map; the lead; the claims; the results of their own question and record | Anyone's hidden timeline; the setup ID; the setup list |

**Two things the model must allow:**
- **What the Liar can work out.** Once the claims are public, the Liar knows every other claim is accurate, so he knows where everyone really was. That comes from public information plus the rules, so it is permitted. The checker already lets him give *any* answer, so his answers are covered.
- **What the Detective's checks may assume.** "Guaranteed" is checked against **every logically possible hidden state** with the same visible information, not just the prepared setups. Results that hold only for the prepared setups are labelled **family knowledge only**. A player can't use them without knowing the setup list, which is author-only information.

**Re-evaluated under this boundary:**
- **Cover choices.** They were already made from identity alone, and the baseline reproduces exactly. **No finding changes.**
- **New with a lead.** A lead that varies by setup is now part of the Liar's information. With seven setups, it usually tells him which setup he is in (see 4).

**Correction to `setup-family.md`.** Its summary counts came from the six-setup run.
- **What it said:** 20 patterns, 12 guaranteed, 4 with no decision, 2 symmetric.
- **The seven-setup family actually has 23 patterns:**
  - 16 guaranteed for every hidden state;
  - 1 symmetric guess;
  - 1 partial;
  - 3 with no possible decision;
  - 2 that hold only with family knowledge.
- **Unaffected:** the group table in that report was generated from the seven-setup run and is correct.

## 2. How guarantees are reported

- **Worst case, no probabilities needed.** In the baseline there is **no guaranteed winning strategy for the Detective** (over the family, or over all hidden states) and **no unbeatable Liar strategy**.
- **That is not the same as balance.** How often the Liar escapes depends on how often each setup occurs and how players choose. That requires setup probabilities, which I have not assigned.
- **Counts are not frequencies.** Every number below is a count of patterns or setups.

## 3. The two blind patterns

### Blind 1: visible history is only the claims "Dot: photo booth · Leo: food stalls · Bruno: parking lot"

- **Who could be the Liar:** Dot, Leo or Bruno.
- **Possible worlds:** 12 (each suspect lying, each with 4 possible true places). Three of these are prepared setups: S1 (Bruno lies), S2 (Dot lies) and S3 (Leo lies).
- **What each investigation establishes:**
  - Record B tests only Dot's claim, record C only Leo's, record D only Bruno's.
  - A question reports only the speaker's own place, plus the Ferris wheel if they claimed the booth. Nobody claimed the wheel, so questions add nothing.
- **What's missing.** Nothing visible links any two claims, so one investigation tests at most one claim. To prioritise rationally, the Detective would need one of:
  - a fact that settles one claim in advance;
  - a link that lets one investigation test two claims;
  - a reason, which would be probabilistic, to think one claim more likely false.

### Blind 2: "Dot: Ferris wheel · Leo: parking lot · Bruno: food stalls"

- **Who could be the Liar:** all three.
- **Possible worlds:** 12. Three of these are prepared setups: S4 (Bruno lies), S5 (Dot lies) and S6 (Leo lies).
- **What each investigation establishes:**
  - Dot's Ferris-wheel claim can't be tested: the wheel has no record and nobody claimed the booth.
  - Records C and D test Bruno and Leo.
- **The visible reason that exists:** don't spend the record on the booth, and don't expect a question to help. Between C and D, though, the choice is symmetric.

## 4. The candidate leads and what they did

All leads are short, observable, fixed before play, shown to everyone (including the Liar) before claims, and identify nobody by themselves.

- **Count leads:** "The churro vendor served N customers between 9:15 and 9:30", and the same for the booth, the lot and the wheel.
- **Line-of-sight leads:** the same every night, so they can't reveal the setup. Either "The picnic tables overlook the parking lot" or "The booth can see the food stalls".

| Lead | Blind 1 (Dot booth, Leo stalls, Bruno lot) | Blind 2 (Dot wheel, Leo lot, Bruno stalls) | Whole family: guaranteed / symmetric or partial / no decision / family-only | Liar side |
|---|---|---|---|---|
| No lead (baseline) | 1/3 (symmetric guess) | 1/3 (partial) | 16 / 2 / 3 / 2 | non-dominated covers Dot: AD; Leo: AC; Bruno: AD |
| Count at food stalls | lead 1: 2/2 (guaranteed for every hidden state); lead 0: 1/1 (guaranteed for every hidden state) | lead 0: 1/1 (guaranteed for every hidden state); lead 1: 2/2 (guaranteed for every hidden state) | 23 / 0 / 2 / 0 | non-dominated covers Dot (lead 1): ABCD; Leo (lead 0): ABCD; Leo (lead 1): A; Bruno (lead 1): ABCD; Bruno (lead 0): A; UNBEATABLE [('Leo', 1, 'A'), ('Bruno', 0, 'A')] |
| Count at photo booth | lead 1: 2/2 (guaranteed for every hidden state); lead 0: 1/1 (guaranteed for every hidden state) | lead 0: 1/3 (partial) | 20 / 1 / 3 / 0 | non-dominated covers Dot (lead 0): A; Dot (lead 1): ABCD; Leo (lead 1): ABCD; Leo (lead 0): A; Bruno (lead 1): ABCD; Bruno (lead 0): A; UNBEATABLE [('Dot', 0, 'A'), ('Leo', 0, 'A'), ('Bruno', 0, 'A')] |
| Count at parking lot | lead 0: 1/1 (guaranteed for every hidden state); lead 1: 2/2 (guaranteed for every hidden state) | lead 1: 2/2 (guaranteed for every hidden state); lead 0: 1/1 (guaranteed for every hidden state) | 23 / 0 / 2 / 0 | non-dominated covers Dot (lead 1): ABCD; Dot (lead 0): ABCD; Leo (lead 1): ABCD; Leo (lead 0): A; Bruno (lead 0): ABCD; Bruno (lead 1): A; UNBEATABLE [('Leo', 0, 'A'), ('Bruno', 1, 'A')] |
| Count at Ferris wheel | lead 0: 1/3 (symmetric guess) | lead 1: 2/2 (guaranteed for every hidden state); lead 0: 1/1 (guaranteed for every hidden state) | 19 / 1 / 2 / 2 | non-dominated covers Dot (lead 0): BD; Leo (lead 0): C; Leo (lead 1): A; Bruno (lead 0): D; Bruno (lead 1): A; UNBEATABLE [('Leo', 1, 'A'), ('Bruno', 1, 'A')] |
| Sightline: tables see the lot | 3/3 (guaranteed for every hidden state) | 3/3 (guaranteed for every hidden state) | 21 / 0 / 2 / 0 | non-dominated covers Dot: ABCD; Leo: A; Bruno: A |
| Sightline: booth sees the stalls | 3/3 (guaranteed for every hidden state) | 1/3 (partial) | 19 / 1 / 3 / 0 | non-dominated covers Dot: A; Leo: A; Bruno: A |

**Reading the Liar column:**
- Values are per setup the Liar can't tell apart.
- "ABCD" next to a lead value means every cover is equally caught. **The Liar has no choice that matters**; it does not mean four good choices.
- "A" alone means the Ferris wheel is his only non-dominated cover.

**What happened, by lead type:**
- **Count leads.**
  - **They remove the blind patterns:** one place is settled before investigating, so two claims remain and one record decides them.
  - **But the count differs between setups**, so with seven setups it usually tells the Liar which setup he is in. His decision becomes certain capture, or a certain escape by claiming the Ferris wheel. That gives **unbeatable** wheel covers in specific cases.
  - **The Ferris-wheel count** doesn't touch Blind 1 at all.
- **"The picnic tables overlook the parking lot."** The best candidate.
  - **The good:** both blind patterns become guaranteed after good investigation, and there is no unbeatable cover.
  - **The bad:** Dot is caught with every cover in every setup, so she has no meaningful choice. For Leo and Bruno, the Ferris wheel becomes **dominant**: it survives only when honest Dot is also at the wheel, but every other cover is always caught.
- **"The booth can see the food stalls."** Removes Blind 1 but not Blind 2, and makes the Ferris wheel dominant for all three Liars.

**Checks for side effects:**
- **No lead produced a universal winning Detective policy.** The remaining failures are always two people both claiming the Ferris wheel. The wheel has no record, both say "nobody else was here", and nothing can tell them apart.
- **No lead introduced author-only information into a Detective policy.** "Family knowledge only" results disappear under every lead except the Ferris-wheel count.

## 5. The dead evidence option is removed

- **Record A** (wheel staff: "closed for repairs, didn't watch") never changed any result. Removing it leaves every number identical.
- **The paper action menu is now:** records **B · C · D**, plus a **Review** navigation slot.

## 6. Remaining failures

1. **No suitable lead among those tested.** Every lead that removes the blind patterns pushes the Liar onto the Ferris wheel, or removes his decision altogether.
2. **The Ferris wheel is the common cause.** It has no record, so when an honest suspect is also there, a false wheel claim can never be resolved. When nobody is there, it is either untestable or caught for certain. Most of the remaining imbalance comes from this one place. Changing the wheel's evidence would be an evidence change, not a lead, so I have not tried it here.
3. **Setup-varying leads leak the setup to the Liar.** With only seven setups, any lead that differs between setups tells the Liar too much. Fixing that would mean more setups, which I was told not to add as a rescue.
4. **Baseline blind patterns remain.** Without a lead: one symmetric 1-in-3 pattern and one partial 1-in-3 pattern.
5. **Not covered:** setup probabilities, multiple Detectives, bots, and human clarity.

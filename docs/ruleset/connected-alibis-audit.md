# Connected-alibi example: deduction audit

This audits `connected-alibis-example.md`, which is kept unchanged. The corrected round is in `connected-alibi-packet/`.

## Deduction 1: Dot's observation

- **Claim tested:** Bruno, option B: "…then bought raffle tickets at the raffle table around 9:20."
- **Evidence used:** Dot's answer, "At the raffle table I saw only Leo, from 9:18." Raffle sheet: "Tickets sold at the raffle table by Granny Dot, 9:10–9:30."
- **What follows:**
  - Dot selling tickets doesn't mean she watched every visitor. "Saw only Leo" can't rule out Bruno passing by.
  - Buying a ticket does require dealing with the seller, but the sheet doesn't say Dot sold **every** ticket. Someone else could have sold some.
  - **Unresolved.** As written, the two statements don't conflict, so Path 1's first step fails.
- **Proposed change (plausible, plain words):**
  - Dot answers only from her own sales: "I sold every raffle ticket myself from 9:10 to 9:30. I sold none to Bruno. Leo joined me at 9:18."
  - The sheet says "every raffle ticket … was sold by Granny Dot".
  - A single seller assigned to the raffle table is ordinary, and Dot knows whom she sold to.
  - Now "Bruno bought tickets at 9:20" and "I sold none to Bruno" can't both be true, without anyone claiming to have watched every visitor.

## Deduction 2: the ice delivery

- **Claim tested:** Bruno, option A: "…stayed at my truck restocking until 9:30."
- **Evidence used:** Ice log: "9:18: bag of ice for the food truck. Nobody there; left it by the door."
- **What follows:** "Nobody there" can mean nobody answered. It doesn't show that the truck was empty. **Unresolved.** The counterfactual catch in Path 2 fails, and option A had no working exposure.
- **Proposed change:**
  - Add to the hidden facts, before play: **when Bruno left at 9:10 he padlocked the truck from the outside**, and he unlocked it at 9:26.
  - Ice log: "9:18: bag of ice for the food truck. The truck was padlocked from the outside, so I left the bag by the door."
  - Option A now says "stayed **inside** my truck restocking until 9:30".
  - Padlocking a food truck while away is ordinary, and "padlocked from outside" plainly means nobody was working inside. This holds unless someone locked him in, which nothing suggests and his own account doesn't claim.
  - Bruno knows he padlocked the truck, so option A's risk is something he can anticipate.

## Deduction 3: the raffle sheet clearing Dot

- **Claim tested:** every clause of Dot's alibi: "I collected the raffle box **from Bruno** **at his truck** **at 9:05**, then **sold raffle tickets at the raffle table** **from 9:10 to 9:30**."
- **Evidence used:** "Raffle box collected from the food truck by Granny Dot at 9:05. Tickets sold at the raffle table by Granny Dot, 9:10–9:30."
- **What follows:**
  - The sheet confirms the truck, 9:05, the selling, the place and the times.
  - It does **not** say the box came *from Bruno*.
  - The clearing still holds by the one-liar rule. If Dot were the Liar, Bruno would be honest, and all of Bruno's options state that he gave Dot the box. So that clause would be true either way.
  - That step is valid but subtle for players.
- **Proposed change for clarity:** "9:05: Chef Bruno handed the raffle box to Granny Dot at his food truck." The committee recording who released its box is ordinary.

## Re-evaluating the playthroughs

**As originally written:**
- **Path 1 (exposure) no longer works.** Its first step relied on Deduction 1, which is unresolved.
- **Path 2's draw still holds:** Dot is cleared through the one-liar step, and the register decides nothing.
- **Path 2's counterfactual catch** ("open the ice log instead") **no longer works** (Deduction 2).

**With the three proposed source changes:**
- **Path 1 works.** Dot's "none to Bruno" conflicts with Bruno's "bought tickets". The sheet confirms every clause of Dot's alibi, so Dot is honest and Bruno's alibi is false.
- **Path 2 still ends in a draw.** The register can't tell restocking from absence. Opening the ice log instead identifies Bruno, because a truck padlocked from outside contradicts "stayed inside restocking".
- **Draws:** a draw is a draw for everyone, not a Liar victory.

**Bruno's other menu options (helped Leo; went to the ice stand) are removed.** Neither could be tested properly with these sources. Those menu slots become navigation (Review).

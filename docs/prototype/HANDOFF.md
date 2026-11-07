# Case Logic Prototype — handoff for the founder playtest

Branch: `prototype/case-logic` (never merged to `main`). Not validated with players.

## Run it on your Mac, play it on your iPhone

Cloudflare cannot give this project a preview link: the game server uses a Durable Object, and Cloudflare doesn't generate preview URLs for those Workers. `tools/branch-guard.mjs` makes the build command exit with an error when Cloudflare reports a non-`main` branch. Cloudflare's check for this branch shows "failure", but the build log was not read, so it is not confirmed that the guard is what stopped it.

1. In Terminal on your Mac:
   ```
   # if you already have a clone, cd into it instead of cloning
   git clone https://github.com/Jmartinmedina1/alibi-app.git alibi-prototype
   cd alibi-prototype
   git checkout prototype/case-logic
   cd app
   npm install
   npx expo start --web --host lan
   ```
2. On the Mac, open **http://localhost:8081/prototype**.
3. On the iPhone (same Wi-Fi as the Mac):
   - In a second Terminal window on the Mac, run `ipconfig getifaddr en0`. It prints the Mac's Wi-Fi address (for example 192.168.1.23). If it prints nothing, try `ipconfig getifaddr en1`.
   - In Safari on the iPhone, open `http://` + that address + `:8081/prototype`.
   - If the Mac asks whether to allow incoming connections for "node", click Allow.
4. To stop: press **Control + C** in Terminal. To go back to the normal game: `git checkout main`.

The dev server shows an extra "QA scenarios" box. Those rounds are scripted for testing; play the two top buttons.

## Five-minute playtest script

1. Hand over the phone and say only: "One player wasn't at this place. Find them." Don't explain the rules. (30 s)
2. Play one round as **Detective** (about 3–4 minutes). Note silently:
   - Did they open the case file?
   - Did they use a follow-up, and why?
   - Did they pick "Something conflicts" for a reason they could point to?
3. At the vote, before they tap, ask: **"Who are you voting for, and what exactly did they say that makes you think so?"** Write down their words.
4. At the reveal, ask: **"What did you suspect, why, and which follow-up changed your mind?"** and **"Was anything marked as a contradiction that you think could actually be true?"**
5. If there's time, start a **Liar** round and ask after 2 interrogations: **"What is your plan for your next answer?"**

Signals worth recording: a concrete quote or reason (good); "just a feeling" (the round didn't give them evidence); disagreement with a contradiction label (content problem — tell me which line).

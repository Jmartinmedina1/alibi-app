# ALIBI

A comedy social-deduction party game for phones. Everyone was at the same secret place last night… except the Liar.
Players grill each other in the Hot Seat, vote SUS or LEGIT, point the finger, and catch the Liar. English + Spanish (with a learn-Spanish mode).

## Structure
- `app/` — Expo (React Native) app for iOS, Android and web. Routes in `app/src/app/`.
- `app/src/engine/` — the game rules (pure TypeScript). Shared by the app (Practice runs locally) and the server.
- `app/src/content/bundle.json` — places, answer cards, jokes, facts, Spanish translations (built by `tools/build_content.py`).
- `server/` — Cloudflare Worker + one Durable Object per room. Sends each player only what they may see. Also hosts the web build.

## Run locally
```sh
cd app && npm install && cd ../server && npm install
./build-web.sh                         # build the web app into app/dist
npx wrangler dev                       # from the repo root: http://127.0.0.1:8787 (game server + web app)
```
Tests:
```sh
cd app && npx tsx src/engine/tests/simulate.test.ts   # 450 simulated games: completion, no secret leaks, timing
cd server && node tests/ws-play.mjs                   # full multiplayer game over WebSockets
```

## Deploy
- Server + web: Cloudflare Workers Builds runs `npm run build` then `npx wrangler deploy` from the repo root on every push to main.
- iOS/Android: `cd app && npx eas-cli@latest build` (needs an Expo account; set `EXPO_PUBLIC_SERVER_URL` to the deployed server).

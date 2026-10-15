# Silver Arrows 2026

A Mercedes-AMG Petronas F1 season tracker built on [eve](https://eve.dev), Vercel's agent framework, and deployed as one Vercel project with Next.js.

Live: https://mercedes-f1-tracker.vercel.app

## What eve does here

The agent in `agent/` is the data layer of the site.

| Piece | Path | Role |
|---|---|---|
| Instructions | `agent/instructions.md` | The agent's identity and answering rules |
| Tools | `agent/tools/get_standings.ts`, `get_mercedes_results.ts`, `get_next_race.ts`, `title_math.ts` | Typed tools (Zod schemas) that hit the live F1 data feed and compute clinch scenarios |
| Shared fetchers | `agent/lib/f1.ts` | One set of fetchers used by the tools and by the site's `/api/live` route, so the dashboard and the chat read the same source |
| Skill | `agent/skills/circuit-notes.md` | Load-on-demand procedure for per-circuit questions |
| Schedule | `agent/schedules/post-race-recap.md` | Monday 15:00 UTC cron; becomes a Vercel Cron Job on deploy |
| Channel auth | `agent/channels/eve.ts` | `vercelOidc` + `localDev` + `none()` so the public site can call the agent anonymously |

The Next.js app (`app/`) mounts the agent at `/eve/v1/*` through `withEve` in `next.config.ts`:

- `/` serves the tracker (`public/tracker.html`): 3D intro, chooser, circuit simulations, standings, title math, calendar.
- `/ask` is a chat UI built on `useEveAgent` from `eve/react`; every answer comes from a tool call.
- `/api/live` returns the standings the agent's tools see; the tracker uses it to refresh its tables and flag "Live via eve tools".

## Run locally

Requires Node 24.

    npm install
    npm run dev          # next dev plus the eve dev server, http://localhost:3000

`npm run eve:dev` opens the agent's terminal REPL on its own.

## Deploy

The repo deploys from GitHub. `vercel.json` pins the framework to Next.js and `package.json` pins Node 24. Model calls go through Vercel AI Gateway using the project's OIDC identity, so no provider key is needed; make sure AI Gateway is enabled for the Vercel team and set a spend limit, since the agent accepts anonymous traffic.

To deploy from a terminal instead: `npm i -g vercel && vercel deploy --prod`.

## Data and credits

Season figures compiled after Round 17 (Singapore GP, 11 Oct 2026) from formula1.com, F1-Fansite and GPFans; live standings from the Jolpica/Ergast API. Circuit geometry from [bacinger/f1-circuits](https://github.com/bacinger/f1-circuits) (MIT). The intro car is modelled from primitives in `public/splash.js`; no licensed scans or footage. Fan-made, not affiliated with Mercedes-Benz or Formula One.

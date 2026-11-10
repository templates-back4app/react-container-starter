# Deploy through the Back4app MCP — react-container-starter — 2026-11-10

Repo commit uploaded: `ba459a6` (branch `main`). This starter was the pilot of the series: the orchestrator ran it by hand before the other 8, so this file records what the pilot reported plus what `list_web_apps` showed afterwards. It has fewer fields than the other 8 files on purpose.

## Context (same for the 9 starters measured this day)

- Date: 2026-11-10 (all times UTC).
- Account kind: permanent, signed in (`whoami` -> `accountKind: "permanent"`, `limits: {freeAppsUsed: 19, maxFreeApps: 50}` before this run). Apps created on the Free plan.
- Client: Claude Code driving the Back4app MCP connector; terminal on macOS (Node v25.8.1, curl 8.7.1); validation requests left from Sao Paulo (CloudFront POP `GRU1-P5`).
- Upload CLI: `@back4app/cli` 0.3.2, run as `npx -y @back4app/cli upload --url <upload-link>` inside the starter folder. The upload link carries a one-time token and is not recorded here. `create_upload` returned `expiresAt` 15 minutes after the call.
- "create -> READY" below = deployment `createdAt` to the `updatedAt` of the `get_deployment` answer that first said `READY`. It is the platform's own clock, not the wall time of the polling.

## Tools called, in order

`create_upload` (no appId) -> CLI upload in the folder -> `create_web_app` -> `get_deployment` (until READY)

## Upload (CLI output, summarized)

- Command returned by `create_upload`: `npx @back4app/cli upload --url <upload-link>`
- Packed 30 files / 400 KB, about 11 s wall time. Printed `uploadId` and `manifestSha256`.
- Left out 1 file, with this message: `Left out, as they may hold secrets: .env.production. Set what the app needs from them as environment variables of the app.`
  The file is tracked in git and holds one public build-time value (`VITE_API_URL`), yet it does not reach the build. The deploy went READY without it; whether the built page behaves differently without that value was not checked.

## App and deployment

- `create_web_app` arguments: `name: "mcp-react"`, `port: 8080`, `uploadId`, `manifestSha256`; `builder` not specified.
- appId `611a00a7-af81-42ed-b039-0181b3cc1acc` · deploymentId `486c4b43-deb5-4df4-888e-8407a8b6a659` · uploadId `9606babe-b40c-4cc0-88c1-d2510a7a7c36`
- App `createdAt` 12:38:47.214Z · deployment `createdAt` 12:38:47.361Z · `READY` at 12:39:30.767Z -> **43.4 s**
- `builder`: `DOCKERFILE` (the Dockerfile in the folder was used without asking for it) · `port`: `8080`
- `url`: https://mcpreact-crkvlgez.back4.app · `urlExpiresAt`: 2026-11-10T13:38:47.297Z (60 minutes after creation)

## Validation on the public URL

- `GET /` -> 200 · `GET /about` (client-side route) -> 200
- `server: nginx/1.27.5`, `Content-Encoding: gzip`, served through CloudFront
- Main JS: 115,898 B transferred
- Not checked on this app: who applied the gzip. This starter has the same `nginx.conf` gzip lines as the preact, solidjs, lit and angular starters, where the same day's measurements show the platform edge compressing and nginx sending the file uncompressed (see `docs/evidence/mcp-back4app-2026-11-10.md` in preact-container-starter).

## Not tested / not recorded for this starter

- `startCommand`, `healthCheckPath`, `isStaticSite` from `get_web_app`, per-file JS list, `get_runtime_logs`: not recorded in the pilot.
- No Part B test used this repo.
- Not tested anywhere in this series: `update_web_app` with a confirmationId, `rollback_web_app`, `confirm_action`, custom domains, env vars at creation, GitHub as the code source through MCP, behaviour after `urlExpiresAt`, a temporary (not signed in) account, the `files` upload path for clients with no terminal.

## Update through the MCP, version stamp verified (app mcp-react-update, 2026-11-10)

- Starter at commit 1e029f1 plus one uncommitted file, `public/version.txt`, used as a visible version stamp.
- v1: `create_upload` → CLI (32 files, 404 KB, `.env.production` left out) → `create_web_app` (port 8080, builder DOCKERFILE). App c86bca1e-d2a2-4e69-8167-1505418533eb, deployment fd490946-4d3b-47cb-82b2-55fc587f74fc created 13:16:45 UTC; the public URL served `mcp-v1-1794316594` at 13:17:32 UTC. `/about` 200.
- v2: `create_upload` with the appId → CLI ("Sending 1 new file(s)") → `deploy_web_app`. Deployment 554d93e4-f55e-4814-b533-b49936a4a669 created 13:17:54 UTC, READY 13:18:24 UTC (30 s). The same URL then served `mcp-v2-1794316663`. `/about` 200.
- Not tested: rollback, and `update_web_app` with a confirmation.

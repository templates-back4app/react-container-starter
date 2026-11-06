# Local measurements — React (Vite) container starter — 2026-11-06

## Environment

- Machine: Apple Silicon Mac (arm64), macOS (Darwin 25.5.0)
- Container runtime: Docker CLI 29.9.3 with colima (macOS Virtualization.framework).
  Note: the plan said "Docker Desktop", but Docker Desktop was not installed on this
  machine; `brew install colima docker` + `colima start --cpu 4 --memory 8` was used
  instead. Image sizes and build behaviour are identical; wall times may differ
  slightly from Docker Desktop.
- Host Node: v25.8.1, npm 11.11.0 (the Docker build stage uses node:22-alpine)
- Date: 2026-11-06

## Method notes (apply to every number below)

- The scaffold does not ship a `package-lock.json`, so `npm install` was run once to
  generate it (the lockfile is committed; the Dockerfile's `npm ci` needs it), then
  `node_modules` was deleted and `npm ci` timed with `/usr/bin/time -p` (warm npm cache).
- `npm run build` timed the same way; the "real" line is the wall time.
- `docker build` wall times are with the base images (node:22-alpine, nginx:1.27-alpine)
  already pulled. The very first build on a clean machine also pulls both bases
  (observed: 56.3 s total for the first build of the day vs ~8-10 s after).
- First-load JS: container run with `docker run --rm -p 8491:8080 <image>`, `/` fetched,
  every `<script src>` in the HTML fetched with
  `curl -s -H 'Accept-Encoding: gzip' -o /dev/null -w '%{size_download}'`, bytes summed.
- nginx gzip: the stock `gzip_comp_level` default (1) transferred ~14-18 % more bytes
  than the build tool's reported gzip sizes; this repo's nginx.conf sets
  `gzip_comp_level 6`, and the numbers below are measured with level 6.
- Port 8090 was busy on this machine; measurements used host port 8491. If curl returns
  a page that is not your app, check `lsof -nP -iTCP:<port> -sTCP:LISTEN` first.

## Scaffold

    npm create vite@latest react-container-starter -- --template react

Versions (package.json): react ^19.3.1, react-dom ^19.3.1, vite ^8.3.6,
@vitejs/plugin-react ^6.1.2, oxlint ^1.90.0. Note: the Vite 8 React template now ships
with oxlint and a hero PNG asset — numbers reflect that template, not the older minimal one.

## Numbers

| Measurement | Command | Result |
|---|---|---|
| npm ci | `/usr/bin/time -p npm ci` | **1.37 s** (25 packages) |
| npm run build | `/usr/bin/time -p npm run build` | **2.60 s** wall (Vite: "built in 607ms") |
| dist size | `du -sk dist` | **288 KB** (includes 13.05 kB hero PNG) |
| docker build | `/usr/bin/time -p docker build -t react-container-starter .` | **9.32 s** (no cache, bases pulled); first-ever build incl. base pulls: 56.31 s |
| image size | `docker images` | **76.3 MB** |
| HTML document gzipped | `curl -s -H 'Accept-Encoding: gzip' -o /dev/null -w '%{size_download}' http://localhost:8491/` | **473 bytes** |
| First-load JS gzipped | `/assets/index-DSXtc1GT.js` (only script referenced) | **68,557 bytes** (raw 222.44 kB) |

Vite's own gzip report for the bundle is 69.28 kB (level ~6); nginx at its default
`gzip_comp_level 1` served 80,835 bytes — set `gzip_comp_level 6` (done in nginx.conf).

Verified: `GET /some/deep/route` returns 200 + index.html (SPA fallback), and
`/assets/*` is served with `Cache-Control: public, max-age=31536000, immutable`
and `Content-Encoding: gzip`.

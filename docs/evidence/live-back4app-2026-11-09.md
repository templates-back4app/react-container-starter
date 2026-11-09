# Live deploy — Back4app Containers — 2026-11-09

App: framework-rotation (free plan, 0.25 vCPU / 256 MB) · source: back4app-templates/container-deploy-lab @ branch rotation
Rotation commit: 5a40563 (content identical to this repo @ b19cf99*, plus public/version.txt stamp 9fd32050-0aee-4615-b456-75e8be3d847e)
*verify with: git diff <starter> <rotation> -- ':!docs/evidence' ':!public/version.txt'

## Timeline
- 12:26:34 UTC first deploy start → image built and pushed in ~12 s → **FAILED at launch: "Please mention a port in settings to expose"** — Port "auto" did not read EXPOSE 8080 from the Dockerfile. Fix: Settings → Build & deploy → Port = 8080.
- 12:48:54 UTC redeploy ("Deploy the latest commit") → 12:49:19 public URL serving the stamp. **Trigger → live: ~25 s** (image layers cached from the first build).
- Platform build log (first build): npm ci 24 pkgs ~4 s · vite build 282 ms · bundle 222.44 kB / 69.28 kB gzip (platform log) — matches local.

## Public URL measurements (client: macOS, São Paulo region; CloudFront edge GRU1-P5; fresh deploy, no warm-up)
- TTFB on / (3 requests, illustrative): 0.990 s · 1.115 s · 1.121 s (median 1.115 s)
- HTML /: 473 B gzip
- /assets/index-*.js: **97,389 B transferred (Content-Encoding: gzip)** vs 68,557 B from our nginx locally at gzip_comp_level 6, raw 222,447 B.
  Headers show `via: CloudFront`: the platform's CDN applied its own compression ratio; origin-level nginx gzip settings do not determine what the public URL transfers.
- Deep route /some/deep/route: 200 (nginx try_files SPA fallback verified live).
- Functional: page renders, assets load, version stamp served.

Local measurements: docs/evidence/local-measurements-2026-11-06.md

## Paths 2 and 3 — buildpack and upload (same date, same client)

- **Buildpack** (app spoke-react-buildpack, created from the same repo, Build method = Buildpacks; platform message: "This looks like a static site — we'll serve the built files for you"):
  live 13:13:02 UTC · deep route /some/deep/route: 200 · /assets/index-*.js transferred **222,447 B with no Content-Encoding** (vs 68,557 B gzip-6 from our nginx) · TTFB 1.004 / 0.978 / 0.967 s.
- **Upload, as-is structure** (app spoke-react-upload, 9 files via the file input): the upload flattened the folder tree in our automated test — /assets/… 404, page broken. A browser folder-drag preserves the tree; our automation cannot perform the drag, so this run documents the structure dependency, not the human flow.
- **Upload, flat build** (app spoke-react-upload-flat, dist rebuilt with vite build.assetsDir: ""): live 13:18:32 UTC · / 200 · deep route 200 · /index-*.js 200, **222,426 B, no Content-Encoding** · TTFB 1.052 / 0.935 / 0.918 s.

Reading: both no-Docker paths serve the bundle uncompressed on this date — the measured cost of skipping the Dockerfile is 3.2× the JavaScript transfer on this app.

## Router + env var verification (app spoke-react-router, same date)

- Starter @ 7242a42 (React Router 7, two routes; VITE_API_URL in .env.production) deployed as a fresh app; stamp 0490c3c4 confirmed at 13:48:10 UTC.
- Direct GET /about: 200 AND the rendered screen is the About route's actual content (verified in a real browser, screenshot archived in the article assets) — the 200 proves the fallback, the render proves the route.
- VITE_API_URL: value set in .env.production appears verbatim inside dist/assets/index-*.js (grep) and renders on the page — build-time baking demonstrated, not asserted.

## Update flow — validated (same date, app spoke-react-router)

- Pushed commit 48cdc8b adding public/update-check.txt (content update-proof-1794232694) → App actions → Deploy the latest commit → at 13:59:32 UTC the SAME public URL served the new file's exact content. Push → manual deploy → live update confirmed by content, not dashboard status.
- Earlier the same day, on an app whose branch setting had been changed after creation (framework-rotation), the same action twice rebuilt a stale commit; re-saving the branch is the remedy we'd try first. Recorded as an observed inconsistency, not the normal path.
- Re-creating an app always reads the branch tip fresh but issues a new URL.

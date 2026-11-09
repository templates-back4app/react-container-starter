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

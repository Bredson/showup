# Deploy Skill

Auto-invoked workflow for deploying the application.

## Trigger

Use when asked to deploy, release, or ship the application to any environment.

## Production setup (Faza 6, Dylemat 10)

- **Hosting:** GitHub Pages, repo `Bredson/unstuck` (public), live at `https://bredson.github.io/unstuck/`
- **Deploy:** automatic — every push to `main` runs `.github/workflows/deploy.yml`
  (npm ci → vitest → build → `upload-pages-artifact` → `deploy-pages`)
- **Base path:** `base: '/unstuck/'` in `vite.config.ts` — vite-plugin-pwa derives
  manifest `scope`/`start_url` and service worker paths from it. Never hardcode paths elsewhere.
- Pages was enabled via `gh api -X POST repos/Bredson/unstuck/pages -f build_type=workflow`
  (one-time; the "official" Actions flow, no `gh-pages` branch)

## Workflow

1. Verify all tests pass (`npx vitest run` — 144+; prebuild re-runs content tests)
2. Check for uncommitted changes (`git status`)
3. Build the application (`npm run build`)
4. Pre-deployment checks: PWA offline test on `npx vite preview` —
   emulate Offline in DevTools, reload, app must boot from service worker cache
5. Deploy: `git push` (Actions does the rest); watch with
   `gh run watch <id> --repo Bredson/unstuck --exit-status`
6. Smoke test on the live URL: page renders, console clean,
   `navigator.serviceWorker.ready` scope = `https://bredson.github.io/unstuck/`,
   `manifest.webmanifest` has `scope`/`start_url` = `/unstuck/`
7. Report deployment status

## Testing tricks (proven in Faza 6)

- **Offline PWA test:** DevTools MCP `emulate networkConditions: Offline` → reload →
  snapshot must show the app (served by SW). Reset emulation afterwards (call `emulate` with no args).
- **Preview origin ≠ dev origin:** `vite preview` on a different port = fresh IndexedDB profile;
  expect onboarding, not your dev data.
- **JSON export test without downloads:** temporarily monkey-patch
  `HTMLAnchorElement.prototype.click` in `evaluate_script`, capture `href` blob via fetch.

## Rollback

If a deploy breaks production: `git revert <bad-commit> && git push` —
Actions redeploys the previous good build. No manual Pages surgery needed.

## Known follow-ups

- Actions annotation: checkout@v4 / setup-node@v4 / upload-artifact@v4 target deprecated
  Node 20 runners — bump to newer major versions when convenient (non-blocking).
- PWA manifest has no icons yet (TODO from Faza 4 note in vite.config.ts).

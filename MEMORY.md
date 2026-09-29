# NexBuild — Session Handoff

Updated: 2026-09-28

## Current Snapshot

- Stable branch: `main`; consolidated E2E coverage was squash-merged through PR #6 as `d7cb844`.
- Main app: `apps/web`.
- README and architecture artifacts reflect the current catalog, Builder, Auth, ownership, saved-build, and sharing architecture.
- The architecture visual check currently reports `pass`.

## Completed

- Catalog 2.0.
- Builder 3.0.
- Compare 2.0.
- Auth Milestone 1: Supabase SSR, PKCE callback, cookie sessions, login, and logout.
- Ownership Milestone 2: authenticated ownership and hardened RLS boundaries.
- Saved Builds Milestone 3: authenticated history and management UI.
- Public and anonymous Auth-boundary smoke coverage is consolidated on `main` through PR #6.
- The stable smoke covers home, catalog, Builder, Compare, Builder local persistence, `/login`, anonymous `/builds` protection, safe Auth callbacks, and same-origin error detection.
- The full authenticated smoke remains deferred to a separate PKCE redesign milestone and is not registered in `package.json`.
- README and architecture documentation are updated.
- Basic static metadata exists for `/components`, `/builder`, and `/compare`.
- `/login`, `/builds`, and `/guides` use `noindex, nofollow`.
- Technical SEO is complete: site-wide metadata base, canonicals, Open Graph, dynamic product metadata, `robots.txt`, resilient `sitemap.xml`, and `noindex, nofollow` for shared builds.
- Home 2.0 is the current product-focused homepage base through `d81891f`.
- Institutional 1.0 adds a reusable global footer plus public `/about`, `/contact`, `/privacy`, and `/terms` routes with factual copy, route metadata, and sitemap entries. The main product navigation remains unchanged.
- Public polish 1.0 filters five stale ASUS image paths whose identical placeholder PNGs were removed in `8cd99b2`, uses a shared runtime image fallback across home, catalog, detail, and comparison, and lets local PNGs use Next image optimization. Production CSP remains strict; the observed inline-style warnings originate only from the Next.js development-tools bundle.
- `nexbuild.games` was validated working over HTTPS.
- Production `NEXT_PUBLIC_SITE_URL` was set to `https://nexbuild.games`.
- Supabase Site URL was set to `https://nexbuild.games`.
- Production and localhost Auth redirects were configured.
- Real magic-link login, callback, authenticated `/builds`, and logout were validated.

The production and real-Auth facts above record the validated end-of-session state supplied for this handoff. They were not independently re-run while preparing these documentation files.

## E2E State

- PR #6, `test/e2e-integration`, was squash-merged into `main` as `d7cb844` after all GitHub checks passed.
- The integrated script is `apps/web/scripts/smoke-ui.mjs`; it combines public flows and anonymous Auth boundaries.
- `smoke-authenticated.mjs` and `test:smoke:auth` are intentionally absent. Revisit authenticated automation only as a separate same-browser PKCE milestone.
- PR #3 and PR #4 were superseded by PR #6.

## Production

- Primary domain: `https://nexbuild.games`.
- Vercel deployment working.
- Supabase connected.
- Production Auth validated.

## After SEO

- Configure and verify Search Console.
- Add dedicated social/OpenGraph previews.
- Continue expanding the catalog and product experience.

## Architectural Decisions to Preserve

- Supabase `products` and `store_listings` are the runtime catalog source. Catalog reads go through the repository and validation layer.
- Builder and comparison state use persisted Zustand stores and reconcile with the current catalog.
- Compatibility and estimated power logic remain pure and deterministic; `unknown` means incomplete evidence, not incompatibility.
- Saved-build mutations are server-controlled, validate trusted catalog IDs, and recalculate derived values.
- Owned-build access is enforced by authenticated ownership and RLS. Shared `/build/[id]` reads expose only the validated public snapshot.
- Supabase Auth uses SSR cookies and PKCE. Redirect targets must remain internal and validated.
- The service-role client is server-only and must never reach browser code.

## Working and Git Handoff Rules

- Do not accidentally include `AGENTS.md`, `.agents/`, `.claude/`, or `package.json` in feature commits.
- Use `git add` with explicit file paths; avoid `git add .` and `git add -A`.
- After a merge, run `git switch main` followed by `git pull --ff-only origin main`.
- Run focused tests while developing.
- Run `pnpm run check` and `pnpm build` once at milestone close, not repeatedly.
- Update this file only when the actual project state changes.

## Public Polish Validation

- `pnpm.cmd --dir apps/web check`, `pnpm.cmd --dir apps/web build`, and `git diff --check` passed with 18 test files and 105 tests.
- Production browser QA covered `/`, `/components`, a real ASUS detail route, `/compare`, `/builder`, `/about`, `/contact`, `/privacy`, and `/terms` at 1440x900 and 390x844 with no HTTP errors, broken images, console errors/warnings, or horizontal overflow.
- The five ASUS products intentionally render category fallbacks until verified, attributable product images are available; no placeholder assets were reintroduced and Supabase was not modified.

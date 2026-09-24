# NexBuild — Session Handoff

Updated: 2026-09-23

## Current Snapshot

- Active branch: `main`, aligned with `origin/main` at `b42851d` when this handoff was prepared.
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
- Public smoke coverage is complete on `test/e2e-smoke` at `75dd97c`.
- Anonymous Auth boundary smoke coverage is complete on `test/e2e-auth-smoke` at `c2557c2`.
- The authenticated smoke is prepared with redacted diagnostics and cleanup reporting on `test/e2e-authenticated-smoke` at `a888603`.
- README and architecture documentation are updated.
- Basic static metadata exists for `/components`, `/builder`, and `/compare`.
- `/login`, `/builds`, and `/guides` use `noindex, nofollow`.
- `nexbuild.games` was validated working over HTTPS.
- Production `NEXT_PUBLIC_SITE_URL` was set to `https://nexbuild.games`.
- Supabase Site URL was set to `https://nexbuild.games`.
- Production and localhost Auth redirects were configured.
- Real magic-link login, callback, authenticated `/builds`, and logout were validated.

The production and real-Auth facts above record the validated end-of-session state supplied for this handoff. They were not independently re-run while preparing these documentation files.

## Smoke Branch State

The three smoke commits are not ancestors of `main` yet. Do not describe their scripts as merged until that changes.

At handoff time, the working tree already had an unrelated edit in `apps/web/package.json` adding `test:smoke:auth`, but `apps/web/scripts/smoke-authenticated.mjs` was not present on `main`; the complete script exists on `test/e2e-authenticated-smoke`. Do not stage or modify that package change accidentally.

### E2E pending consolidation

- `test/e2e-smoke` (`75dd97c`): expanded public smoke; not yet in `main`.
- `test/e2e-auth-smoke` (`c2557c2`): anonymous/Auth boundaries; PR #3 open; not yet in `main`.
- `test/e2e-authenticated-smoke` (`a888603`): authenticated smoke and diagnostics; PR #4 open; not yet in `main`.

Decision: do not integrate the three branches separately. Create `test/e2e-integration` from `origin/main`; apply `75dd97c`, then integrate `c2557c2` by manually resolving `smoke-ui.mjs` while preserving both coverage sets, and then apply `a888603`. Register `test:smoke:auth`, run the public smoke, a real authenticated smoke, `check`, and `build`, and create one consolidated PR. Close PR #3 and PR #4 only after that PR is merged.

Production Auth already works at `https://nexbuild.games`: magic link, callback, authenticated `/builds`, and logout were verified. The real authenticated smoke can therefore be retried during consolidation.

## Production

- Primary domain: `https://nexbuild.games`.
- Vercel deployment working.
- Supabase connected.
- Production Auth validated.

## Main Pending Work: Complete SEO

- add `metadataBase`
- add canonical URLs
- add OpenGraph metadata
- add `sitemap.xml`
- add `robots.txt`
- add dynamic `generateMetadata` for `/components/[slug]`
- add `noindex` for `/build/[id]`

Do not start SEO unless it is explicitly requested.

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

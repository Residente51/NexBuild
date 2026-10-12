# NexBuild Status

Updated: 2026-10-11

This is the concise current-state record for humans and agents. Git history, open pull requests, and live infrastructure remain authoritative for details that can change.

## Repository

- Source of truth: `https://github.com/Residente51/NexBuild`
- Stable branch: `main`
- Main application: `apps/web`
- Latest inspected `main`: `9e796ef` (`docs(workflow): use GitHub as project source of truth (#17)`)
- Delivery rule: focused branch and pull request; no direct work on `main`
- Shared workflow documentation was merged through PR #17; the repository-local continuity skill is proposed on the current branch and is not part of `main` until merged.

## Current product state

- Public routes include Home, component catalog and details, comparison, Builder, institutional pages, and shared builds.
- Supabase provides the runtime catalog, SSR authentication, owned saved builds, and read-only shared build snapshots.
- Builder compatibility and power evaluation remain pure and deterministic.
- The optional guided Builder and budget recommendations are implemented without AI-generated builds or benchmark claims.
- The production catalog contains 46 products according to the current repository handoff, with catalog imagery and descriptions completed through PR #16.
- Public Web Analytics is privacy-scoped to production and excludes Auth and private build routes.

## Verification baseline

- Repository quality gate: `pnpm run check` from `apps/web`.
- Production build gate: `pnpm build` from `apps/web`.
- Public browser smoke: `pnpm run test:smoke` from `apps/web`.
- Authenticated magic-link automation remains intentionally deferred; do not claim a live authenticated pass without a new end-to-end run.
- Production, Supabase, Vercel, DNS, prices, stock, and external product data must be revalidated before relying on or changing them.

## Open repository items

- PR #2, `feat/builder-1`, is still open and is not mergeable against current `main`; treat it as historical until it is deliberately reconciled.
- PR #5, `feat/compare-2`, is still open; review its current diff and relevance before merging or closing it.
- Several merged feature branches remain on the remote. Branch presence does not mean work is unmerged; use pull request and ancestry evidence.

## Next operating steps

1. Use `main` only as the stable integration branch.
2. Create or reuse one task branch per change and open a pull request.
3. Review or close stale PRs #2 and #5 separately; do not mix that cleanup into unrelated feature work.
4. Use the `nexbuild-continuity` skill for cross-tool resume and handoff work when supported.
5. Keep this file concise and update it only when verified project state changes.

## Security boundaries

- Never commit `.env` files, secrets, tokens, cookies, magic links, service-role values, or private production data.
- Keep privileged Supabase access server-only.
- Preserve SSR cookie handling, PKCE, ownership checks, RLS, server-side validation, and internal redirect validation.
- Production and data mutations require explicit authorization and targeted read-back verification.

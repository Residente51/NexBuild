# NexBuild Status

Updated: 2026-10-20

This is the concise current-state record for humans and agents. Git history, open pull requests, and live infrastructure remain authoritative for details that can change.

## Repository

- Source of truth: `https://github.com/Residente51/NexBuild`
- Stable branch: `main`
- Main application: `apps/web`
- Latest inspected `main`: `625a380` (`feat(builder): validate RAM speed compatibility (#20)`)
- Delivery rule: focused branch and pull request; no direct work on `main`
- Shared workflow documentation was merged through PR #17, and the repository-local `nexbuild-continuity` skill was merged through PR #18.

## Current product state

- Public routes include Home, component catalog and details, comparison, Builder, institutional pages, and shared builds.
- Supabase provides the runtime catalog, SSR authentication, owned saved builds, and read-only shared build snapshots.
- Builder compatibility and power evaluation remain pure and deterministic.
- PR #20 is merged: motherboard `maxRamSpeed` is validated and RAM kits above the reported limit produce a compatibility warning.
- The optional guided Builder and budget recommendations are implemented without AI-generated builds or benchmark claims.
- The production catalog contains 46 products according to the current repository handoff, with catalog imagery and descriptions completed through PR #16.
- Stores & Price Comparison 1.0 is reconciled with PR #20 on `feat/store-price-comparison-v1-reconcile`: catalog, detail, Builder, and Compare use current in-stock offers with cash-price priority and normal-price fallback. A read-only production audit on 2026-10-20 confirmed 46 active products, 54 listings, 7 products with multiple offers, 39 with one, and the Winpy, Alltec, and PC Express stores.
- Public Web Analytics is privacy-scoped to production and excludes Auth and private build routes.

## Verification baseline

- Repository quality gate: `pnpm run check` from `apps/web`.
- Production build gate: `pnpm build` from `apps/web`.
- Public browser smoke: `pnpm run test:smoke` from `apps/web`.
- The reconciliation branch passed 45 focused tests, the 24-file/143-test full check, production build, diff check, and desktop/mobile browser QA on 2026-10-20.
- Authenticated magic-link automation remains intentionally deferred; do not claim a live authenticated pass without a new end-to-end run.
- Production, Supabase, Vercel, DNS, prices, stock, and external product data must be revalidated before relying on or changing them.

## Open repository items

- PR #2, `feat/builder-1`, remains open and non-mergeable because it still contains manual Builder-catalog compatibility previews and thumbnails not equivalently present on `main`; reconcile or re-scope separately.
- PR #5, `feat/compare-2`, remains open because its hide-equal control, price-difference annotations, and mobile snap refinements are not on `main`; reconcile or re-scope separately.
- Several merged feature branches remain on the remote. Branch presence does not mean work is unmerged; use pull request and ancestry evidence.

## Next operating steps

1. Store Coverage 1.1.
2. Compatibility Data Audit 1.1.
3. Authenticated E2E, Search Console, and dedicated social previews according to priority.
4. Reconcile or re-scope the unique remaining work in PRs #2 and #5 separately.

## Security boundaries

- Never commit `.env` files, secrets, tokens, cookies, magic links, service-role values, or private production data.
- Keep privileged Supabase access server-only.
- Preserve SSR cookie handling, PKCE, ownership checks, RLS, server-side validation, and internal redirect validation.
- Production and data mutations require explicit authorization and targeted read-back verification.

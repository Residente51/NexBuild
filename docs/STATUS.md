# NexBuild Status

Updated: 2026-10-28

This is the concise current-state record for humans and agents. Git history, open pull requests, and live infrastructure remain authoritative for details that can change.

## Repository

- Source of truth: `https://github.com/Residente51/NexBuild`
- Stable branch: `main`
- Main application: `apps/web`
- Latest inspected `main`: `a1d21e8` (`fix(catalog): prevent tablet offer-table overflow (#24)`)
- Delivery rule: focused branch and pull request; no direct work on `main`
- Shared workflow documentation was merged through PR #17, and the repository-local `nexbuild-continuity` skill was merged through PR #18.

## Current product state

- Public routes include Home, component catalog and details, comparison, Builder, institutional pages, and shared builds.
- Supabase provides the runtime catalog, SSR authentication, owned saved builds, and read-only shared build snapshots.
- Builder compatibility and power evaluation remain pure and deterministic.
- PR #20 is merged: motherboard `maxRamSpeed` is validated and RAM kits above the reported limit produce a compatibility warning.
- The optional guided Builder and budget recommendations are implemented without AI-generated builds or benchmark claims.
- The production catalog contains 46 products according to the current repository handoff, with catalog imagery and descriptions completed through PR #16.
- Stores & Price Comparison 1.0 and RAM-speed compatibility coexist on `main` through PR #21: catalog, detail, Builder, and Compare use current in-stock offers with cash-price priority and normal-price fallback. A read-only production audit on 2026-10-20 confirmed 46 active products, 54 listings, 7 products with multiple offers, 39 with one, and the Winpy, Alltec, and PC Express stores.
- Compare reconciliation is merged through PR #22: `Ocultar iguales`, effective-price differences, contained horizontal snap, and fixed-column behavior coexist with current multi-store pricing semantics.
- Manual Builder candidate compatibility preview and catalog thumbnails are merged through PR #23, reusing the current `evaluateBuild()` engine and pricing model.
- PR #24 fixes the tablet-only global overflow on multi-store component detail pages by keeping offer cards through tablet widths and switching to the wide desktop table at `lg`.
- Public Web Analytics is privacy-scoped to production and excludes Auth and private build routes.

## Verification baseline

- Repository quality gate: `pnpm run check` from `apps/web`.
- Production build gate: `pnpm build` from `apps/web`.
- Public browser smoke: `pnpm run test:smoke` from `apps/web`.
- Current repository baseline on 2026-10-27: `pnpm run check` passed with 26/26 test files and 152/152 tests; production build and `git diff --check` passed.
- Production smoke passed with 46 usable products, Builder persistence/selection, login availability, anonymous `/builds` protection, safe invalid Auth callbacks, and no external failures.
- QA covered catalog, multi-store detail, Compare, manual and guided Builder, compatibility preview, pricing, and responsive behavior. PR #24 additionally verified 390×844, 768×1024, and 1440×900 with no global overflow, console/page errors, failed HTTP responses, or actionable network failures.
- Authenticated magic-link automation remains intentionally deferred; do not claim a live authenticated pass without a new end-to-end run.
- Production, Supabase, Vercel, DNS, prices, stock, and external product data must be revalidated before relying on or changing them.

## Open repository items

- No feature pull request is currently required to recover work from historical PRs #2 or #5: both are closed without merge after their useful scope was reconciled through PR #23 and PR #22 respectively.
- Several merged feature branches remain on the remote. Branch presence does not mean work is unmerged; use pull request and ancestry evidence.
- Authenticated end-to-end automation remains deferred.
- Store coverage remains the largest measured product-data gap: the latest read-only production audit found 46 active products, 54 listings, 7 products with multiple offers, and 39 with only one offer.

## Next operating steps

1. Store Coverage 1.1: refresh time-sensitive offers and expand exact SKU-level multi-store coverage.
2. Compatibility Data Audit 1.1: measure real specification coverage before adding more deterministic rules.
3. Authenticated E2E.
4. Search Console and dedicated social/Open Graph previews.

## Security boundaries

- Never commit `.env` files, secrets, tokens, cookies, magic links, service-role values, or private production data.
- Keep privileged Supabase access server-only.
- Preserve SSR cookie handling, PKCE, ownership checks, RLS, server-side validation, and internal redirect validation.
- Production and data mutations require explicit authorization and targeted read-back verification.

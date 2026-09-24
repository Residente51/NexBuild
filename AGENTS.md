# NexBuild — Codex Instructions

## Project

NexBuild is a production-oriented PC component catalog, comparison, and PC builder. The main application lives in `apps/web`.

Current stack:

- Next.js 16 App Router
- React 19
- TypeScript 5 in strict mode
- Tailwind CSS 4
- Zustand 5
- Supabase/PostgreSQL with Supabase SSR
- Vitest 4
- pnpm 11

User-facing copy is Spanish (Chile). Code identifiers remain English.

## Architecture

- Keep route files thin and prefer Server Components.
- Use Client Components only for real interactivity and keep client islands small.
- Read catalog data through `lib/components/repository.ts` and validate external data in `lib/components/validation.ts` before use.
- Preserve the pure compatibility engine in `lib/compatibility/` and the existing persistence model.
- Keep authenticated and shared-build reads in `lib/build/`; preserve ownership and read-only sharing boundaries.
- Keep privileged Supabase access server-only. Client code must never import the service-role client.
- Reuse existing components, stores, types, and design patterns before adding abstractions.

## Relevant Structure

- `apps/web/app/`: routes, layouts, Server Actions, and auth callback
- `apps/web/components/`: interactive catalog, comparison, Builder, builds, and layout UI
- `apps/web/lib/components/`: catalog repository, validation, and specifications
- `apps/web/lib/compatibility/`: deterministic compatibility and power checks
- `apps/web/lib/build/`: saved/shared-build validation and reads
- `apps/web/lib/supabase/`: browser/server Supabase boundaries
- `apps/web/store/`: persisted client state for Builder and comparison
- `apps/web/types/`: shared domain types
- `apps/web/migrations/`: PostgreSQL schema, rollback scripts, RLS, and ownership
- `apps/web/scripts/`: controlled catalog and smoke tooling
- `docs/architecture/`: current architecture artifacts

## Commands

Run application commands from `apps/web`:

- `pnpm dev`: local development server
- `pnpm run typecheck`: TypeScript validation
- `pnpm run lint`: ESLint
- `pnpm test -- <target>`: focused Vitest work during development
- `pnpm run test:ci`: full Vitest run
- `pnpm run test:smoke`: public browser smoke
- `pnpm run check`: typecheck, lint, and full Vitest suite
- `pnpm build`: production build

Use `pnpm.cmd` and `npx.cmd` in PowerShell if script execution policy blocks the `.ps1` shims.

## React, Next.js, and TypeScript Conventions

- Preserve App Router conventions and route-local metadata where appropriate.
- Add `"use client"` only when hooks, browser APIs, or event handlers require it.
- Keep TypeScript strict; prefer explicit domain types and validated narrowing over assertions.
- Treat Supabase and other external payloads as untrusted until validated.
- Preserve accessibility, semantic HTML, keyboard behavior, responsive layout, and the existing visual language.
- Do not duplicate derived state or bypass established Zustand/repository flows.

## Working Mode

Treat main as stable.

For localized tasks, inspect only directly related files and search for existing implementations before creating new ones. Do not re-analyze established architecture unless the task requires it.

## Git Rules

- Treat `main` as stable and inspect the working tree before editing.
- Keep changes scoped; do not overwrite or include unrelated user changes.
- Stage task files explicitly. Do not use broad staging commands for feature work.
- Do not commit, push, merge, rebase, or switch branches unless explicitly requested.
- Do not fix unrelated failures. Report them separately.

## Security

- Never expose, log, or commit secrets, service-role credentials, magic links, session cookies, JWTs, or environment values.
- Preserve Supabase SSR cookie handling, PKCE callback behavior, safe internal redirects, ownership checks, and RLS assumptions.
- Do not weaken server-side validation or trust prices, ownership, or component data supplied by the client.
- Production, Vercel, DNS, Supabase, and database changes require explicit authorization and targeted verification.

## Do Not Touch Without Explicit Approval

- dependencies, `package.json`, or lockfiles
- database schema, migrations, RLS, Supabase, Auth, or environment variables
- `.claude/` or unrelated agent configuration
- established compatibility, persistence, or ownership architecture
- unrelated UI, generated artifacts, or production configuration

If an approved plan becomes invalid, stop and report the blocker.

## Definition of Done

- The change is the smallest one that satisfies the approved scope and uses existing seams.
- Focused tests and `pnpm run typecheck` pass during development.
- At milestone close, run `pnpm run check` and `pnpm build` once when required by scope; do not repeat expensive gates unnecessarily.
- Inspect the scoped diff and run `git diff --check` before handoff.
- UI changes include relevant desktop/mobile, accessibility, interaction, console, and overflow verification.
- Documentation and `MEMORY.md` are updated only when the actual project state changed.
- The final response reports result, files changed, verification, deferred issues, exact `git add` command, and a Conventional Commit message.

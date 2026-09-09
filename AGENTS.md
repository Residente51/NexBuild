# NexBuild — Codex Instructions

## Project

NexBuild is a production-oriented PC component catalog, comparison and PC builder.

Main application: apps/web

Stack:
- Next.js 16 App Router
- React 19
- TypeScript strict
- Tailwind CSS v4
- Zustand
- Supabase
- Vitest
- pnpm

User-facing content is Spanish (Chile).
Code identifiers should remain English.

## Architecture

- Keep route files thin.
- Prefer Server Components.
- Use Client Components only for actual interactivity.
- Access catalog data through the existing repository layer.
- Validate external and Supabase data before using it.
- Never expose Supabase service-role credentials to the browser.
- Preserve compatibility and persistence architecture.
- Reuse existing components before creating new abstractions.

## Working Mode

Treat main as stable.

For scoped tasks:
- Do not scan the entire repository.
- Inspect only files related to the task.
- Search for existing implementations before creating new ones.
- Do not re-analyze established architecture unnecessarily.

Do not:
- add dependencies without approval
- modify schema or migrations without approval
- perform unrelated refactors
- redesign unrelated UI
- modify .claude/
- commit or push automatically

If the approved plan becomes invalid, stop and report the blocker.

## Verification

For normal features:
1. relevant tests
2. npx tsc --noEmit
3. pnpm lint

For major milestones also run:
pnpm build

Do not rerun expensive checks unnecessarily.

## Communication

Be concise.
Do not narrate routine inspection or obvious edits.
For an approved implementation, implement directly without another RFC.

Final response:
- result
- files changed
- verification
- deferred issues
- exact git add command
- Conventional Commit message

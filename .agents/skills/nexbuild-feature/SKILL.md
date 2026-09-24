---
name: nexbuild-feature
description: Implement an approved NexBuild feature through the existing architecture with narrow scope and milestone-level verification.
---

# NexBuild Feature Workflow

1. Read repository-root `AGENTS.md` and `MEMORY.md`.
2. Define the requested scope, acceptance conditions, and files likely to change.
3. Inspect only related routes, components, types, stores, repositories, and tests. Search for an existing implementation seam first.
4. Make the smallest change that satisfies the approved scope. Preserve architecture, security boundaries, accessibility, responsive behavior, and strict TypeScript.
5. During development, run focused tests and `pnpm run typecheck` from `apps/web`.
6. At milestone close, run `pnpm run check`, `pnpm build`, and scoped diff checks once. Do not fix unrelated failures.
7. Do not commit or push unless explicitly requested. Stage only explicit task files.
8. Update `MEMORY.md` only when the real project state, decisions, completed milestones, or next priorities changed.

If the approved scope or architecture becomes invalid, stop and report the blocker.

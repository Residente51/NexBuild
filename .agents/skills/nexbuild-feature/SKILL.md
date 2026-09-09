---
name: nexbuild-feature
description: Implement an already-approved NexBuild feature efficiently using the existing architecture.
---

# NexBuild Feature Workflow

Implement the requested feature using the existing NexBuild architecture.

## Context strategy

Do not inspect the whole repository.

Start only with:
- directly affected routes and components
- relevant types
- repository/data layer when needed
- stores when client state is needed
- relevant tests

Read additional files only to resolve a concrete dependency.

Do not re-analyze architecture already documented in AGENTS.md unless necessary.

## Implementation

Prefer existing patterns.

Maintain:
- Server Components by default
- small client islands
- strict TypeScript
- existing NexBuild design language
- repository boundaries
- accessibility
- responsive behavior

Do not introduce:
- new dependencies
- schema or migration changes
- unrelated refactors
- global redesigns

unless explicitly approved.

If the approved architecture becomes invalid, stop and report the blocker.

## Verification

Run:
1. relevant tests
2. npx tsc --noEmit
3. pnpm lint

Run pnpm build for major milestones or route/build-sensitive work.

Do not fix unrelated failures.

## Final response

Return only:
1. result
2. files changed
3. verification
4. deferred issues
5. exact git add command
6. Conventional Commit message

Never commit or push automatically.

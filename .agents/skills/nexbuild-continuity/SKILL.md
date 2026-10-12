---
name: nexbuild-continuity
description: Resume, review, or hand off NexBuild work across ChatGPT, Codex, VS Code, and Work while preserving the current Git branch, verified repository state, and authorization boundaries.
---

# NexBuild Continuity

Use this skill when starting, resuming, reviewing, or handing off work in `Residente51/NexBuild`.

## Establish the current state

1. Inspect the current branch, working tree, remotes, and related pull request.
2. Read `README.md`, `AGENTS.md`, `docs/STATUS.md`, `MEMORY.md`, and the files directly related to the request.
3. Treat current repository files and Git history as authoritative over chat history.
4. Preserve unrelated local changes. Stop and report the conflict if they overlap the requested work.

## Continue existing work

- Reuse the existing remote task branch when it already contains the work.
- Do not recreate changes in another branch unless the user explicitly requests it.
- Treat `main` as stable and never implement directly on it.
- Verify connection permissions before relying on remote writes.
- Do not commit, push, merge, rebase, close pull requests, or modify production without explicit authorization.

## Preserve scope and security

- Prefer the smallest change that satisfies the request and reuse existing architecture.
- Keep Supabase, Auth, RLS, migrations, dependencies, environment files, and production configuration outside scope unless explicitly requested.
- Never expose or commit secrets, tokens, cookies, magic links, service-role credentials, private URLs, or production data.

## Verify and hand off

Run checks proportional to the change and report only results that actually ran. Include:

- repository, current branch, base branch, and pull request
- latest pushed commit
- files changed and scope boundaries
- checks run and their results
- failures, stale assumptions, or deferred work
- the next concrete action

Update `docs/STATUS.md` only for verified current state. Update `MEMORY.md` only for durable technical decisions or handoff information.

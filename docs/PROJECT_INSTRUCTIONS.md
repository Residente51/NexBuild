# NexBuild Project Instructions

Use this document as the copy-ready instruction source for the NexBuild project in ChatGPT. Repository instructions in `AGENTS.md` remain authoritative for implementation details.

## Project context

NexBuild is a production-oriented PC component catalog, comparison tool, and PC Builder for Chile. The application lives in `apps/web`. User-facing copy is Spanish (Chile); code identifiers and technical documentation are English.

The current stack is Next.js 16 App Router, React 19, strict TypeScript, Tailwind CSS 4, Zustand 5, Supabase/PostgreSQL with Supabase SSR, Vitest 4, and pnpm 11.

## Instructions for ChatGPT

1. Treat `https://github.com/Residente51/NexBuild` as the source of truth.
2. At the start of a task, inspect the current default branch, `README.md`, `AGENTS.md`, `MEMORY.md`, `docs/STATUS.md`, and the files related to the request.
3. Do not rely on conversation history when it conflicts with the repository or current Git state.
4. Reuse existing routes, components, stores, repositories, validation, compatibility logic, and tests before adding abstractions.
5. Keep changes narrow. Do not redesign, refactor unrelated code, add dependencies, or change Supabase, Auth, RLS, migrations, production configuration, or environment files unless explicitly requested.
6. Never expose or commit secrets, tokens, cookies, magic links, service-role values, private environment variables, or sensitive production data.
7. The ChatGPT GitHub app is read-only. Use ChatGPT to inspect, plan, and review; send implementation work to Codex or VS Code.
8. Treat `main` as stable. Implementation must use a focused branch from the latest `origin/main`, commit only task files, push the branch, and open a pull request for review. Never write directly to `main`.
9. When reviewing or continuing work started in Codex or VS Code, use the existing remote branch and inspect its diff. Do not recreate the work in another branch unless requested.
10. Run focused checks during implementation. From `apps/web`, use `pnpm run typecheck` and relevant tests; at milestone close, run `pnpm run check`, `pnpm build`, and `git diff --check` when the scope warrants them.
11. Report the branch, pull request, files changed, checks run, failures or caveats, and any user action still required. Do not claim a check passed unless it actually ran.
12. Update `docs/STATUS.md` only when the repository's current state or verified next steps change. Update `MEMORY.md` only for durable technical handoff information.

## Cross-tool operating flow

### Start in ChatGPT

- Connect the GitHub app and grant access to `Residente51/NexBuild`.
- Create a ChatGPT Project named `NexBuild`.
- Add this document to the Project instructions, or paste the section above.
- Ask ChatGPT to inspect the repository before proposing or applying changes.
- Use ChatGPT for repository-aware planning and review. For implementation, hand the task to Codex or VS Code and require a branch and pull request instead of changes to `main`.

### Continue in Codex or VS Code

From the local repository:

```powershell
cd C:\Users\sebas\NexBuild
git fetch origin
git switch <task-branch>
git pull --ff-only origin <task-branch>
```

Inspect `git status`, the pull request, and the branch diff before resuming. Keep work on the same branch, commit the scoped changes, and push that branch.

### Return to ChatGPT

Ask ChatGPT to review the pull request or continue on the same branch. The pull request discussion and repository files are the handoff; do not paste secrets or private environment values into the chat.

### Finish

Merge only after review and required checks pass. Then update the local stable checkout:

```powershell
cd C:\Users\sebas\NexBuild
git switch main
git pull --ff-only origin main
```

Delete task branches only after the work is safely merged and no tool still depends on them.

## Permission requirements

The GitHub connection used by ChatGPT must have access to the `Residente51` account and the `NexBuild` repository. It provides read-only repository access for analysis and review. For a private repository, select either **All repositories** or explicitly include **NexBuild** when configuring the GitHub app.

Codex or the local Git client must authenticate separately for implementation. Publishing a branch requires repository contents write access; creating the review request requires pull request write access or a signed-in GitHub browser session.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with this repository.

---

# Project

NexBuild

Slogan:

> Arma mejor. Compra inteligente.

NexBuild is a production-oriented PC building platform.

The long-term vision includes:

- Component catalog
- Search
- Filtering
- Component comparison
- Compatibility engine
- PC Builder
- Saved builds
- Real pricing
- Authentication
- Database

Current scope is intentionally much smaller.

Current implemented features:

- Landing page
- Component catalog
- Component search
- Interactive PC Builder with persisted local state
- Deterministic compatibility engine
- Anonymous shared builds backed by Supabase

Everything else will be developed incrementally.

---

# Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript (strict)
- Tailwind CSS v4
- pnpm

Tailwind uses the CSS-first approach.

Theme tokens belong inside:

app/globals.css

There is no tailwind.config.ts.

Import alias:

```
@/*
```

points to:

```
apps/web/*
```

---

# Commands

Run commands from:

```
apps/web
```

Never from the repository root.

Install:

```bash
pnpm install
```

Development:

```bash
pnpm dev
```

Production build:

```bash
pnpm build
```

Run production:

```bash
pnpm start
```

Lint:

```bash
pnpm lint
```

Typecheck:

```bash
pnpm run typecheck
```

Full quality gate:

```bash
pnpm run check
```

Tests use Vitest.

---

# Project Structure

Current architecture:

```
app/
components/
data/
types/
lib/
```

Components are separated into layers.

## ui/

Reusable primitives.

Examples:

- Button
- Card
- SearchBar

Rules:

- Stateless
- Reusable
- No business logic
- No imports from data/
- Extend native HTML attributes
- Accept className
- Spread ...props

---

## catalog/

Feature components.

Own catalog behavior.

---

## sections/

Landing page sections.

---

## layout/

Layout components.

Navbar belongs here.

---

## app/

Routes only.

Routes should stay thin.

Business logic does not belong here.

---

# Client Boundary

Prefer Server Components.

Only use "use client" when interactivity requires it.

Keep client components as small as possible.

Interactive catalog state lives in `app/components/page.tsx`; reusable data
validation and mapping stay in `lib/components/`.

Everything else should remain render-only whenever possible.

---

# Data

Production source:

```
Supabase: products + stores + store_listings
```

Repository seed source:

```
data/hardware.json
```

Components must read the production catalog through
`lib/components/repository.ts`. Shared builds are written and read only by
server code through `lib/supabaseAdmin.ts`; never import it from a Client
Component.

Future migrations should require changing as few files as possible.

A repository layer should become the single source of truth.

---

# Conventions

User-facing text:

Spanish.

Identifiers:

English.

Comments:

English.

Prices:

```
toLocaleString("es-CL")
```

Commits:

```
feat(scope):
fix(scope):
refactor(scope):
docs(scope):
```

---

# Known Issues

These should NOT be fixed automatically.

Only modify them when explicitly requested.

Examples:

- default metadata
- placeholder content
- temporary mock data

---

# AI Collaboration Contract

These rules define how Claude should collaborate on this repository.

They take priority over implementation preferences.

---

# Primary Goal

Build NexBuild as if it were production software.

Prioritize:

- Maintainability
- Scalability
- Readability
- Predictability
- Performance
- Incremental development

Avoid technical debt whenever possible.

---

# Development Philosophy

Prefer:

- Small commits
- Small milestones
- Small pull requests
- Small refactors

Never solve multiple unrelated problems.

When several solutions exist:

Prefer the simplest one.

Prefer the one requiring the fewest changes.

Prefer the one that scales naturally.

---

# Approval Policy

Before making changes, always provide:

## Goal

What problem will be solved.

## Plan

Brief implementation plan.

## Files

Every file that will be:

- created
- modified
- deleted

## Expected Result

Explain the expected outcome.

Stop.

Wait for approval before editing.

---

# Scope Rules

Never:

- modify unrelated files
- rewrite architecture without approval
- install dependencies without approval
- redesign the UI without approval
- perform large refactors during small tasks

If more than five files must change:

Explain why first.

---

# Existing Code First

Before creating:

- a component
- a hook
- a utility
- a helper
- a repository
- a type

Search the project first.

Prefer extending existing code.

Avoid duplicate abstractions.

Avoid duplicate patterns.

---

# Coding Standards

Always:

- use strict TypeScript
- prefer composition
- reuse components
- remove unused imports
- avoid dead code
- avoid duplicated code
- write explicit code

Readable code is more important than clever code.

---

# Architecture Rules

Keep routes thin.

Business logic belongs inside:

- lib/
- repository/
- utility modules

UI components should remain focused on rendering.

Prefer Server Components.

Keep "use client" as low as possible.

---

# Repository Rules

Never access raw data directly if a repository exists.

Future database migrations should only require replacing repository implementations.

Repositories are the application's data API.

---

# Domain Modeling

Types are contracts.

Avoid free-form strings.

Prefer union types.

Prefer discriminated unions when appropriate.

Prefer exhaustive switches.

Domain identifiers must remain stable.

Display names may change.

Identifiers should not.

---

# UI Rules

Maintain visual consistency.

Reuse:

- spacing
- typography
- colors
- components

Do not introduce new visual styles unless requested.

---

# Performance

Avoid:

- unnecessary state
- unnecessary renders
- unnecessary effects

Memoize only when beneficial.

Avoid premature optimization.

---

# Dependencies

Prefer platform features.

Avoid new libraries unless there is a strong reason.

Every dependency increases maintenance cost.

Always request approval before installing packages.

---

# Quality Gate

Before considering a task complete:

- TypeScript passes
- ESLint passes
- No unused imports
- No dead code
- Scope respected

Run when applicable:

```bash
npx tsc --noEmit
pnpm lint
```

---

# Git Workflow

One milestone.

One commit.

One responsibility.

Suggested commits must follow Conventional Commits.

Examples:

```
feat(catalog):
fix(search):
refactor(ui):
docs(readme):
```

---

# Communication

Keep responses concise.

Avoid unnecessary explanations.

Explain tradeoffs only when relevant.

Ask instead of guessing.

Never assume requirements.

---

# Token Efficiency

Minimize API usage.

Avoid rewriting complete files for small edits.

Prefer editing existing code.

Generate only what is necessary.

Stop immediately after completing the requested task.

---

# Long-term Philosophy

Every change should make future development easier.

Optimize for the next years of development, not just today's task.

Favor maintainability over speed.

Favor simplicity over cleverness.

Favor incremental progress over large rewrites.

---
# SKILLS DE OPTIMIZACIÓN (Reglas de comportamiento estricto)

Al ejecutar tareas en este repositorio, debes aplicar siempre estas dos directivas para ahorrar tokens:

1. **Perfil Caveman:** Elimina absolutamente todos los saludos, cortesías, despedidas y explicaciones didácticas. No digas "Aquí tienes el código" ni expliques el funcionamiento de las vulnerabilidades. Genera únicamente el código funcional y las modificaciones.
2. **Perfil Surgical-Patch:** Nunca reescribas un archivo completo si solo vas a alterar unas pocas líneas. Edita de forma puntual y quirúrgica exclusivamente la lógica solicitada, preservando intacto el resto del diseño y la arquitectura.
---

# NexBuild

> Arma mejor. Compra inteligente.

NexBuild es un configurador de PCs para el mercado chileno. Permite explorar un catálogo en CLP, armar un equipo, comprobar las compatibilidades cubiertas por datos estructurados y compartir una configuración mediante un enlace anónimo.

Los precios actuales son referenciales. El proyecto todavía no incluye scraping verificado, histórico de precios ni autenticación.

## Arquitectura

La aplicación vive en `apps/web` y usa Next.js 16 con App Router, React 19, TypeScript estricto, Tailwind CSS 4, Zustand y Supabase/PostgreSQL.

- `app/`: rutas, Server Components y Server Actions.
- `components/`: UI y componentes interactivos del catálogo y builder.
- `lib/components/`: repositorio Supabase y validación de datos externos.
- `lib/compatibility/`: motor determinista de compatibilidad.
- `store/`: estado local versionado y persistido del builder.
- `data/hardware.json`: fuente de seed mantenida en el repositorio.
- `migrations/`: esquema, políticas RLS y migraciones reversibles.
- `scripts/`: ingesta y mantenimiento del catálogo.

El navegador solo puede leer el catálogo público. Las builds compartidas se validan y guardan desde el servidor con la service role; esa clave nunca se entrega al cliente. Los UUID de `/build/[id]` funcionan como tokens de enlace no enumerables.

## Desarrollo local

Requisitos: Node.js 20 o superior y pnpm 11.

```bash
cd apps/web
pnpm install
copy .env.example .env.local
pnpm dev
```

Completa en `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

`SUPABASE_SERVICE_ROLE_KEY` es exclusivamente de servidor: no debe llevar el prefijo `NEXT_PUBLIC_` ni almacenarse en código cliente.

## Base de datos y catálogo

En una instalación nueva, ejecuta `migrations/001_enable_rls.sql`. Para una instalación existente que usaba la migración original, ejecuta en orden:

1. `migrations/002_stabilize_schema_and_sharing.sql`
2. `migrations/003_quarantine_generated_listings.sql`

Cada actualización tiene un rollback no destructivo en `migrations/rollback/`. La migración 003 conserva una copia de los listings ficticios antes de marcarlos como no disponibles.

Después de aplicar el esquema, carga el dataset referencial:

```bash
pnpm run catalog:migrate
```

Los scripts de catálogo usan la service role y deben ejecutarse solo en un entorno confiable.

## Verificación

```bash
pnpm run check
pnpm build
```

`check` ejecuta TypeScript, ESLint y la suite de Vitest. La bitácora técnica está en [`docs/DEVLOG.md`](./docs/DEVLOG.md).

# NexBuild

> Arma mejor. Compra inteligente.

NexBuild es una aplicación para explorar componentes de PC disponibles en Chile, comparar alternativas y construir configuraciones compatibles con precios en CLP. El catálogo real se obtiene desde Supabase y las configuraciones pueden mantenerse localmente, guardarse bajo una cuenta o compartirse mediante un enlace de lectura.

## Funcionalidades

- **Catalog 2.0:** búsqueda por nombre, marca, categoría y especificaciones; filtros por categoría, marca, precio y stock; ordenamiento determinista y estado compartible mediante search params.
- **Detalle y comparación:** rutas permanentes en `/components/[slug]`, comparación persistida y acciones para agregar componentes al Builder.
- **Builder 3.0:** selección responsive, resumen de precio y consumo, persistencia local con Zustand y validación mediante un motor determinista de compatibilidad.
- **Preview de compatibilidad:** `CatalogModal` evalúa el componente candidato antes de incorporarlo al armado.
- **Builds en la nube:** guardado validado desde el servidor, historial autenticado en `/builds` y ownership mediante `user_id` más políticas RLS.
- **Sharing:** `/build/[id]` permite leer un snapshot compartido sin exponer la identidad de su propietario.
- **Imágenes de catálogo:** assets reales cuando están disponibles y fallbacks intencionales por categoría ante imágenes ausentes o fallidas.

Los precios son referenciales. NexBuild no mantiene actualmente scraping verificado ni histórico de precios.

## Arquitectura

La aplicación principal vive en `apps/web` y utiliza:

- Next.js 16 con App Router y Server Components.
- React 19 y TypeScript estricto.
- Tailwind CSS 4.
- Zustand con persistencia local para Builder y comparación.
- Supabase/PostgreSQL para catálogo, autenticación y builds guardados.
- Supabase SSR para sesiones mediante cookies, magic link y flujo PKCE.

Principales fronteras:

- `app/`: rutas, Server Components, callback de autenticación y Server Actions.
- `components/`: interfaces interactivas del catálogo, comparación y Builder.
- `lib/components/repository.ts`: acceso único al catálogo de Supabase.
- `lib/components/validation.ts`: validación y transformación de datos externos a modelos de la aplicación.
- `lib/compatibility/`: motor puro y determinista de compatibilidad y consumo estimado.
- `lib/build/`: lectura validada de builds propios y compartidos.
- `store/`: estado cliente persistido y reconciliado con el catálogo actual.
- `migrations/`: esquema PostgreSQL, RLS, ownership y migraciones reversibles.
- `data/hardware.json` y `scripts/`: seed, ingesta y mantenimiento controlado del catálogo.

La service role se usa exclusivamente en el servidor. El catálogo público se consulta a través del repository y validation layer; los componentes cliente no acceden directamente a credenciales privilegiadas.

## Rutas principales

- `/login`: acceso mediante magic link.
- `/auth/callback`: intercambio PKCE y establecimiento de la sesión SSR en cookies.
- `/components`: Catalog 2.0.
- `/components/[slug]`: detalle de un componente.
- `/compare`: comparación de componentes.
- `/builder`: Builder 3.0.
- `/builds`: historial y administración de builds del usuario autenticado.
- `/build/[id]`: enlace compartido de solo lectura.

## Desarrollo local

Requisitos: Node.js 20 o superior y pnpm 11.

```bash
cd apps/web
pnpm install
copy .env.example .env.local
pnpm dev
```

Configura `.env.local` sin incluir valores reales en el repositorio:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

`NEXT_PUBLIC_SITE_URL` define el origen usado por el callback del magic link. `SUPABASE_SERVICE_ROLE_KEY` es exclusivamente de servidor y nunca debe llevar el prefijo `NEXT_PUBLIC_` ni importarse desde código cliente.

## Base de datos y catálogo

Para una instalación nueva, aplica los archivos SQL en orden:

1. `migrations/001_enable_rls.sql`: esquema base, catálogo, builds y políticas iniciales.
2. `migrations/002_stabilize_schema_and_sharing.sql`: contrato estabilizado para catálogo y sharing.
3. `migrations/003_quarantine_generated_listings.sql`: respaldo y cuarentena reversible de listings legacy generados.
4. `migrations/004_authenticated_build_ownership.sql`: ownership autenticado, historial, `user_id`, restricciones y RLS de `saved_builds`.

Las migraciones 002, 003 y 004 cuentan con scripts de reversión en `migrations/rollback/`. La migración 004 conserva los builds anónimos existentes con `user_id = NULL`.

Después de aplicar el esquema, el dataset referencial puede cargarse desde un entorno confiable:

```bash
pnpm run catalog:migrate
```

Los scripts de catálogo utilizan la service role y no forman parte del flujo de solicitudes de producción.

## Verificación

```bash
pnpm run check
pnpm build
```

`check` ejecuta TypeScript, ESLint y la suite de Vitest. La bitácora técnica está en [`docs/DEVLOG.md`](./docs/DEVLOG.md).

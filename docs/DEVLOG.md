# NexBuild — Development Log

> **Arma mejor. Compra inteligente.**

Última actualización: 7 de septiembre de 2026

---

## 1. Visión Técnica

NexBuild es una plataforma de armado de PCs orientada al mercado chileno. Su propósito es permitir que cualquier usuario —desde entusiastas hasta compradores primerizos— pueda configurar un equipo, validar las compatibilidades cubiertas, visualizar precios referenciales en CLP y compartir su configuración.

### 1.1 Principios Fundacionales

| Principio | Descripción |
|---|---|
| **Motor Determinista** | Toda validación de compatibilidad entre componentes opera mediante reglas de código puro en TypeScript. Nunca depende de inferencia, heurísticas de IA ni "conocimiento" externo. Cada regla recibe un `BuildSelection` y retorna `CompatibilityIssue[]`. |
| **Desacoplamiento progresivo** | La capa de datos está aislada detrás de un repositorio (`lib/components/repository.ts`). Hoy lee Supabase; otra fuente puede sustituirse sin alterar la UI. |
| **Catálogo tipado** | Cada categoría de componente (CPU, GPU, RAM, etc.) tiene una interfaz TypeScript discriminada con `specs` estructurados. Esto permite que el motor de compatibilidad opere con certeza sobre datos estandarizados. |
| **Incrementalismo** | El proyecto avanza en hitos pequeños y verificables. Cada commit cumple una sola responsabilidad. Cada milestone se valida antes de pasar al siguiente. |

### 1.2 Alcance Actual vs. Visión Completa

```
                          Visión Completa
┌──────────────────────────────────────────────────┐
│                                                  │
│  ✅ Landing Page                                 │
│  ✅ Catálogo de componentes                      │
│  ✅ Búsqueda de componentes                      │
│  ✅ PC Builder (8 slots, selección interactiva)  │
│  ✅ Motor de compatibilidad (13 reglas)          │
│  ✅ Persistencia local (Zustand + localStorage)  │
│  ✅ Persistencia cloud (Supabase)                │
│  ✅ Builds compartidas (/build/[id])             │
│  🔲 Comparador de componentes                    │
│  🔲 Guías de armado                              │
│  🔲 Precios reales (web scraping)                │
│  🔲 Autenticación (Supabase Auth)                │
│  🔲 Builds guardadas por usuario                 │
│  🔲 Tablas relacionales por tienda chilena       │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

## 2. Stack Tecnológico

| Capa | Tecnología | Versión | Notas |
|---|---|---|---|
| Framework | Next.js (App Router) | 16.2.12 | Server Components por defecto, Client Components minimizados |
| UI Library | React | 19.2.4 | — |
| Lenguaje | TypeScript | 5.x | `strict` mode |
| Estilos | Tailwind CSS | v4 | Configuración "CSS-first" en `globals.css`, sin `tailwind.config.ts` |
| Estado global | Zustand | 5.0.15 | `persist` middleware con `localStorage` |
| Base de Datos | Supabase (PostgreSQL) | SDK 2.112.3 | Tabla `saved_builds`, RLS habilitado |
| Testing | Vitest | 4.1.11 | Path alias `@/` configurado |
| Gestor de paquetes | pnpm | — | Workspace definido en `pnpm-workspace.yaml` |
| Deploy | Vercel | — | Dominio: `nexbuild.games` |

### 2.1 Estructura del Proyecto

```
NexBuild/
├── apps/web/                    # Aplicación principal
│   ├── app/                     # App Router (rutas delgadas)
│   │   ├── page.tsx             # Landing: Hero + componentes destacados
│   │   ├── layout.tsx           # Root layout: Geist font, sidebar, dark bg
│   │   ├── globals.css          # Tailwind v4 + design tokens Clean Tech
│   │   ├── builder/page.tsx     # PC Builder (delega a PCBuilderView)
│   │   ├── build/[id]/page.tsx  # Build compartida (SSR + Supabase query)
│   │   ├── components/page.tsx  # Catálogo con búsqueda y filtrado
│   │   ├── compare/page.tsx     # Placeholder — próximamente
│   │   └── guides/page.tsx      # Placeholder — próximamente
│   │
│   ├── components/              # Componentes React organizados por capa
│   │   ├── ui/                  # Primitivos compartidos
│   │   ├── layout/              # Navbar (sidebar fijo con navegación)
│   │   ├── catalog/             # Tarjeta de componente para la landing
│   │   ├── sections/            # Hero (landing page)
│   │   └── builder/             # PCBuilderView, SlotRow, CatalogModal,
│   │                            # BuildSummaryPanel, LoadBuildButton
│   │
│   ├── data/
│   │   └── hardware.json        # Seed versionado de 44 componentes
│   │
│   ├── lib/                     # Lógica de dominio pura
│   │   ├── categories.ts        # 8 categorías, labels en español
│   │   ├── supabaseClient.ts    # Cliente público de catálogo
│   │   ├── supabaseAdmin.ts     # Cliente service-role solo servidor
│   │   ├── build/totals.ts      # Cálculo compartido del total
│   │   ├── seedData.ts          # 16 fixtures tipados para tests
│   │   ├── components/
│   │   │   ├── repository.ts    # Única fuente de verdad para catálogo
│   │   │   └── validation.ts    # Validación runtime de filas y snapshots
│   │   └── compatibility/
│   │       ├── engine.ts        # Motor determinista: 13 reglas
│   │       └── engine.test.ts   # Cobertura compatible, incompleta y adversa
│   │
│   ├── store/
│   │   └── useBuildStore.ts     # Zustand store: build state, mutations,
│   │                            # compatibility report, saveBuildToCloud()
│   │
│   ├── types/
│   │   └── component.ts         # Interfaces discriminadas por categoría:
│   │                            # BaseComponent, CPUComponent, MotherboardComponent,
│   │                            # RAMComponent, GPUComponent, StorageComponent,
│   │                            # PSUComponent, CaseComponent, CoolerComponent,
│   │                            # BuildSelection, CompatibilityIssue, etc.
│   │
│   ├── migrations/              # Esquema, políticas y rollbacks
│   └── scripts/                 # Ingesta y mantenimiento de Supabase
│
├── CLAUDE.md                    # Contrato de colaboración AI (reglas, filosofía)
├── GEMINI.md                    # Contexto específico para Gemini
└── docs/
    └── DEVLOG.md                # ← Este archivo
```

---

## 3. Bitácora Cronológica de Decisiones Arquitectónicas

### Fase 0 — Fundación (28 jul 2026)

**`38eff10` — Initial commit**
**`5f6f984` — feat(web): initialize Next.js application**

- Se inicializa el monorepo con estructura `apps/web/`.
- Next.js con App Router como framework base.
- TypeScript en modo estricto desde el día uno.
- Tailwind CSS v4 con configuración "CSS-first" (sin `tailwind.config.ts`).
- pnpm como gestor de paquetes.

> **Decisión:** Usar App Router sobre Pages Router para aprovechar Server Components como patrón por defecto y reducir el JavaScript enviado al cliente.

---

### Fase 1 — Primitivos UI y Catálogo (29 jul 2026)

**`608de9f` — feat(ui): create reusable button component**
**`8fa8d4f` — feat(ui): add reusable Card component**
**`ed7593d` — feat(catalog): add reusable component card**
**`74008ae` — feat(search): add component search**
**`65d484f` — refactor(catalog): extract catalog components**

- Se construye la capa `components/ui/` con primitivos reutilizables (`Button`, `Card`, `SearchBar`).
- Regla: los primitivos son stateless, no importan de `data/`, extienden atributos HTML nativos y aceptan `className`.
- Se implementa el catálogo con búsqueda por texto libre.
- La búsqueda es una función pura (`filterComponents`) que opera sobre un array recibido como argumento — sin dependencia de la fuente de datos.

> **Decisión:** Separar la lógica de búsqueda (`lib/components/search.ts`) del componente visual para poder reutilizarla en Server y Client Components indistintamente.

---

### Fase 2 — Modelado de Dominio (5 ago – 19 ago 2026)

**`0a8b89d` — refactor(types): introduce typed component categories**
**`3107ae6` — feat(types): add permanent slug identifiers to components**
**`c5b033c` — feat(domain): define PC builder domain model**

- Se definen 8 categorías como union type literal (`ComponentCategory`): `cpu | gpu | ram | storage | motherboard | case | cooler | psu`.
- Se crean interfaces discriminadas por categoría, cada una con `specs` opcionales pero tipados:
  - `CPUComponent.specs`: `socket`, `tdp`, `hasIntegratedGraphics`, `includesCooler`.
  - `MotherboardComponent.specs`: `socket`, `formFactor`, `ramType`, `ramSlots`, `m2Slots`, `sataPorts`.
  - `GPUComponent.specs`: `length`, `slotWidth`, `recommendedPsuWattage`.
  - Y así para RAM, Storage, PSU, Case y Cooler.
- Se introduce `slug` como identificador permanente derivado de la marca y nombre. Los slugs **nunca se regeneran** — los display names pueden cambiar, los slugs no.
- Se define `BuildSelection`: el tipo central del Builder, con slots individuales (CPU, MB, RAM, GPU, Case, Cooler, PSU) y un array para almacenamiento múltiple.
- Se definen `CompatibilityIssue`, `CompatibilityStatus`, `CompatibilityRule` y `BuildCompatibilityReport`.

> **Decisión:** Los `specs` son opcionales (`specs?`) para permitir componentes en el catálogo que aún no tengan datos técnicos completos. El motor de compatibilidad simplemente ignora las reglas cuando los specs faltan (`if (!cpu?.specs || !motherboard?.specs) return []`).

> **Decisión:** El tipo `CompatibilityRule` se define como `(build: BuildSelection) => CompatibilityIssue[]`. Cada regla es una función pura que retorna un array vacío si no hay problemas. Esto permite agregar reglas futuras con una sola línea en el array `rules`.

---

### Fase 3 — MVP del PC Builder (21 ago 2026)

**`02b396c` — feat: MVP Fase 1 completado con UI, Zustand y motor de compatibilidad**

Este commit representa el hito más significativo del proyecto. Se implementan tres subsistemas de forma simultánea:

#### 3.1 Motor de Compatibilidad Determinista

Se implementan **10 reglas** en `lib/compatibility/engine.ts`:

| # | Código | Validación | Severidad |
|---|---|---|---|
| 1 | `CPU_MB_SOCKET_MISMATCH` | CPU ↔ Motherboard: socket debe coincidir | `incompatible` |
| 2 | `RAM_MB_TYPE_MISMATCH` | RAM ↔ Motherboard: generación DDR debe coincidir | `incompatible` |
| 3 | `RAM_MB_SLOT_OVERFLOW` | RAM ↔ Motherboard: módulos ≤ slots disponibles | `incompatible` |
| 4 | `MB_CASE_FORMFACTOR_MISMATCH` | Motherboard ↔ Case: form factor soportado | `incompatible` |
| 5 | `GPU_CASE_LENGTH_EXCEEDED` | GPU ↔ Case: largo de la tarjeta ≤ máximo del gabinete | `incompatible` |
| 6 | `COOLER_CPU_SOCKET_MISMATCH` | Cooler ↔ CPU: cooler debe soportar el socket | `incompatible` |
| 7 | `COOLER_CASE_HEIGHT_EXCEEDED` | Cooler (air) ↔ Case: altura ≤ máximo del gabinete | `incompatible` |
| 8 | `COOLER_CASE_RADIATOR_UNSUPPORTED` | Cooler (AIO) ↔ Case: tamaño de radiador soportado | `warning` |
| 9 | `PSU_CASE_FORMFACTOR_MISMATCH` | PSU ↔ Case: form factor soportado | `incompatible` |
| 10 | `PSU_WATTAGE_EXCEEDED` / `PSU_WATTAGE_TIGHT` | PSU ↔ Build: wattage estimado vs. capacidad (>100% = error, >80% = warning) | `incompatible` / `warning` |

El estimador de wattaje (`estimateTotalWattage`) usa una fórmula conservadora:
```
watts = CPU.tdp + (GPU.recommendedPsuWattage × 0.65) + 100W (overhead fijo)
```

La API pública es `evaluateBuild(build)` que ejecuta todas las reglas y retorna un `BuildCompatibilityReport` con: `status`, `issues[]` y `totalWattageEstimated`.

#### 3.2 Estado Global con Zustand

Se implementa `store/useBuildStore.ts`:
- **Persistencia:** middleware `persist` con clave `nexbuild-active-build` en `localStorage`.
- **Mutations:** `setComponent`, `removeComponent`, `addStorage`, `removeStorage`, `clearBuild`, `loadBuild`.
- **Derived state:** `getCompatibilityReport()` y `getTotalPrice()` computados on-demand vía `get()`.
- **Cloud persistence:** `saveBuildToCloud()` que inserta en Supabase y retorna el `id` generado.

#### 3.3 Componentes del Builder

Se crean 5 componentes en `components/builder/`:
- `PCBuilderView`: orquestador principal del Builder, Client Component.
- `SlotRow`: fila individual para cada categoría (click para abrir modal).
- `CatalogModal`: modal para seleccionar un componente del catálogo.
- `BuildSummaryPanel`: panel lateral con resumen de precio, compatibilidad y botón de guardar/compartir.
- `LoadBuildButton`: botón Client Component para cargar una build compartida en el store local.

#### 3.4 Tests del Motor

Se implementan 2 suites de tests con Vitest usando seed data realista (16 componentes):
- **"Build Perfecta"** — AMD AM5 + ATX + DDR5 + 850W: valida 0 issues, status `compatible`, wattage 530W.
- **"Build Frankenstein"** — AM5 CPU + LGA1700 motherboard + Mini-ITX case + 450W ATX PSU + 342mm GPU: valida que se detectan 5 incompatibilidades específicas y que la RAM DDR4 + placa DDR4 NO se marca como error.

> **Decisión:** La seed data (`lib/seedData.ts`) existe exclusivamente para tests y NO es el catálogo de producción. Esto permite evolucionar los fixtures de test independientemente de los datos reales.

---

### Fase 4 — Pipeline de Ingesta de Datos (22 ago 2026)

**`5c3436d` — feat: catálogo de componentes automatizado y fix de hidratación**

- Se crea `data/hardware.json` como dataset crudo con 40 componentes reales del mercado chileno: 10 CPUs (AMD AM4/AM5 + Intel LGA1700), 10 Motherboards, 5 GPUs, 5 RAMs, 5 PSUs, 5 Storage.
- Se implementa `scripts/build-catalog.mjs`: un script Node.js que lee `hardware.json` y genera `data/catalog.ts` como un archivo TypeScript tipado.
- El script aplica transformaciones para cada categoría:
  - **CPUs:** mapea `powerDrawW` → `tdp`, infiere `hasIntegratedGraphics: false`, `includesCooler: false`.
  - **Motherboards:** infiere `ramType` según socket (`AM5` → `ddr5`, resto → `ddr4`), asume 4 RAM slots, 2 M.2 slots, 4 SATA ports.
  - **GPUs:** calcula `recommendedPsuWattage = powerDrawW + 250`, asume 300mm y 2 slots.
  - **RAM:** parsea el string de capacidad (ej. `"16GB (2x8GB)"`) para extraer `modules` y `capacityPerModule`.
  - **PSUs:** mapea `wattage` directamente, asume form factor `atx`.
  - **Storage:** detecta `nvme` vs. `sata`, infiere form factor, convierte `"1TB"` → 1000.

> **Decisión:** El pipeline genera un `.ts` con tipado explícito en lugar de importar JSON en runtime. Esto permite que TypeScript valide la estructura del catálogo en tiempo de compilación.

---

### Fase 5 — Identidad Visual (23 ago 2026)

**`87e61bf` — refactor: rediseño UI a paleta Wabi-Sabi**
**`ccb6a71` — chore: color de selección de texto personalizado**
**`fe101f5` — refactor: rediseño UI a estilo iOS Clean Tech con paleta de 3 colores**

La paleta visual pasó por una iteración rápida:

1. **Wabi-Sabi:** paleta cálida, tonos tierra. Se descartó por no transmitir la identidad "tech".
2. **iOS Clean Tech (actual):** paleta fría con tres colores base, definidos como tokens en `globals.css` vía `@theme inline`:

| Token | Valor | Uso |
|---|---|---|
| `--color-builder-bg` | `#191923` | Fondo principal oscuro |
| `--color-builder-surface` | `rgba(255, 255, 255, 0.05)` | Superficies elevadas (glassmorphism sutil) |
| `--color-builder-border` | `rgba(255, 255, 255, 0.1)` | Bordes de tarjetas |
| `--color-builder-text` | `#FBFEF9` | Texto principal (casi blanco) |
| `--color-builder-muted` | `rgba(255, 255, 255, 0.6)` | Texto secundario |
| `--color-builder-accent` | `#0E79B2` | Color de acento (cerúleo) |
| `--color-builder-success` | `#34D399` | Estados positivos / compatible |
| `--color-builder-warning` | `#FBBF24` | Warnings de compatibilidad |
| `--color-builder-danger` | `#F87171` | Errores / incompatible |

El layout adopta un diseño de sidebar fijo a la izquierda (`Navbar` como `<aside>` con `h-screen sticky`), contenido con scroll independiente en `<main>`.

> **Decisión:** Se usa una selección de texto personalizada (`selection:bg-[#0E79B2] selection:text-[#FBFEF9]`) para reforzar la identidad de marca en cada interacción del usuario.

---

### Fase 6 — Persistencia Cloud y Builds Compartidas (24 ago 2026)

**`af66136` — feat: persistencia cloud de builds en supabase y ruta dinámica /build/[id]**
**`8fff2a7` — fix: resolución de hidratación SSR y ajuste de URL dinámica para producción**

- Se integra **Supabase** como backend:
  - Tabla: `saved_builds` con columnas `id` (UUID), `build_data` (JSONB), `total_price` (integer), `created_at` (timestamp).
  - RLS habilitado para control de acceso.
  - Client SDK configurado en `lib/supabaseClient.ts` con validación de env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).

- Se implementa la ruta dinámica `/build/[id]`:
  - **Server Component** que ejecuta un `SELECT` contra Supabase para cargar la build.
  - Renderiza la configuración completa con precios formateados en CLP.
  - Incluye `LoadBuildButton` (Client Component) que permite importar la build al store local.
  - Manejo de errores: si el ID no existe, muestra un estado de error con enlace al Builder.

- Se agrega `saveBuildToCloud()` al store de Zustand:
  - Inserta el `BuildSelection` como JSONB + precio total.
  - Retorna el UUID generado para construir la URL compartible.

- Se resuelve un bug de hidratación SSR causado por la diferencia de formato de fechas entre servidor y cliente (se agrega `suppressHydrationWarning` al elemento de fecha).

> **Decisión:** La persistencia cloud es anónima (sin autenticación por ahora). Cualquier usuario puede guardar y compartir una build. La autenticación se implementará en una fase posterior.

> **Decisión:** La ruta `/build/[id]` es un Server Component puro — ejecuta la query en el servidor y envía HTML estático al cliente. Solo `LoadBuildButton` es un Client Component, manteniendo el bundle de JS al mínimo.

---

### Fase 7 — Migración a Tablas Relacionales y Conexión Frontend (25 ago 2026)

**Objetivo Completado:** Migrar el catálogo local estático a tablas relacionales en Supabase y conectar el frontend para su consumo asíncrono.

- **Base de Datos:** Creación del esquema relacional en Supabase (`products`, `stores`, `store_listings`) protegido con políticas de lectura pública (RLS).
- **Ingesta de Datos:** Creación y ejecución del script de migración usando la `SUPABASE_SERVICE_ROLE_KEY` para insertar 40 productos base evadiendo el bloqueo RLS de manera segura.
- **Desacoplamiento del Frontend:** Refactorización de `lib/components/repository.ts` y del modal del Builder (`CatalogModal.tsx`) para consumir los datos asíncronamente desde la tabla `products` en Supabase.
- **Galería Interactiva (`/components`):** 
  - **Arquitectura:** Implementación como Client Component para permitir filtros reactivos e interactividad en tiempo real sin recargas de página.
  - **Conexión Cloud:** Reutilización de `fetchCatalogFromSupabase()` para hidratar el catálogo dinámicamente desde PostgreSQL.
  - **Estado Global:** Integración nativa con `useBuildStore` (Zustand), permitiendo añadir piezas al PC Builder directamente desde la galería con un feedback visual de confirmación temporal.
  - **UI/UX:** Aplicación estricta del sistema iOS Clean Tech: fondo oscuro `#191923`, botones de acento `#0E79B2`, y renderizado en formato Bento Grid responsivo (con elevación `bg-white/5`).

> **Decisión:** El repositorio encapsula el mapeo de `store_listings` para extraer el `price_cash`, permitiendo que las interfaces de dominio de TypeScript (`PCComponent`), la galería interactiva y el motor de compatibilidad sigan operando de forma idéntica sin verse afectados por el cambio en la fuente de datos.

---

### Fase 7.5 — Enriquecimiento de Catálogo y Blindaje Visual (26 ago 2026)

## [Hito] Enriquecimiento de Catálogo y Blindaje Visual
- **Base de Datos:** Columnas `image_url` y `description` añadidas a la tabla `products` en Supabase.
- **Script de Ingesta:** Ejecución exitosa de `enrich-catalog.mjs` con specs extendidas (frecuencias, VRAM, latencias, dimensiones) sin romper los contratos del motor[cite: 1, 2].
- **Frontend & UX:**
  - Integración de badges dinámicos por categoría en `/components`[cite: 1, 4].
  - Manejo reactivo de errores de imagen (`onError` + fallback tipográfico iOS Clean Tech) para evitar bloqueos por CORS/hotlinking[cite: 1].
- **Testing:** 10/10 tests unitarios pasando en Vitest (Pipeline determinista intacto)[cite: 1].

---

### Fase 7.6 — Estabilización de producción (7 sep 2026)

- Se reemplaza la CSP estática por nonces por request mediante `proxy.ts`, permitiendo la hidratación de Next.js sin habilitar scripts inline globales.
- Las builds anónimas pasan por una Server Action que recibe solo IDs, valida cada producto contra Supabase, recalcula el precio y escribe con una service role exclusiva de servidor.
- `saved_builds` deja de exponerse directamente a `anon` y `authenticated`; `/build/[id]` consulta desde el servidor usando el UUID como token de enlace.
- Se incorporan migraciones idempotentes para instalaciones nuevas y existentes, más rollbacks no destructivos. Los enlaces de tiendas fabricados por el seed antiguo se respaldan y ponen en cuarentena.
- Todo dato de Supabase, `localStorage` o JSONB compartido se valida antes de entrar al dominio. El store persistido queda versionado y se reconcilia con el catálogo actual.
- El repositorio selecciona el menor precio con stock y distingue explícitamente productos agotados.
- El motor prioriza incompatibilidades sobre estados incompletos y cubre piezas obligatorias, gráficos, cooler, puertos de almacenamiento, radiadores, consumo real de GPU y grosor de GPU.
- Se agregan cases y coolers al seed, se eliminan catálogos generados y componentes legacy sin consumidores, y se corrigen supuestos falsos del pipeline.
- La navegación ahora es responsiva y accesible; los diálogos gestionan foco, `Escape` y tabulación. Se corrigen acciones inertes y enlaces con HTML inválido.
- El quality gate unificado ejecuta TypeScript, ESLint y Vitest mediante `pnpm run check`.

---

## 4. Convenciones del Proyecto

### 4.1 Idioma

| Contexto | Idioma |
|---|---|
| UI: todo texto visible al usuario | **Español** (Chile) |
| Código: variables, funciones, interfaces, carpetas | **Inglés** |
| Comentarios y documentación técnica | **Inglés** |
| Formateo de precios | `toLocaleString("es-CL")` — CLP |
| Commits | `feat(scope):` / `fix(scope):` / `refactor(scope):` / `docs(scope):` — **Inglés o Español** |

### 4.2 Arquitectura

- **Routes son delgadas.** Cada `page.tsx` bajo `app/` importa un componente y lo renderiza. No contiene lógica de negocio.
- **Server Components por defecto.** Solo se usa `"use client"` cuando hay interactividad.
- **Repositorios como única fuente de verdad.** La UI no importa seeds directamente.
- **Funciones puras para lógica.** La búsqueda, el filtrado y la compatibilidad son funciones sin side-effects.

### 4.3 Tipado

- `PCComponent` es un discriminated union de 8 interfaces.
- `BuildSelection` define los 8 slots del Builder.
- `CompatibilityRule` es el contrato para reglas del motor: `(build: BuildSelection) => CompatibilityIssue[]`.
- Los identificadores de dominio (claves de categorías, slugs) son **inmutables**.

---

## 5. Hoja de Ruta — Próximas Fases

### Fase 8 — Web Scraper de Precios

**Objetivo:** Mantener precios actualizados automáticamente desde tiendas chilenas.

**Cambios esperados:**
- Scripts de scraping en Node.js (posiblemente con Puppeteer o Playwright) que se ejecutan vía cron o Supabase Edge Functions.
- Se insertan los precios en `store_listings` con timestamp, permitiendo históricos en una tabla futura si el producto lo requiere.
- La UI puede mostrar "mejor precio" y comparar entre tiendas.
- Se necesita un sistema de matching entre los productos del scraper y los componentes del catálogo (por SKU, modelo o slug normalizado).

**Riesgos:**
- Los scrapers son frágiles ante cambios de markup en las tiendas.
- Se requiere rate limiting y manejo de errores robusto.
- Posibles restricciones legales o de ToS de las tiendas.

---

### Fase 9 — Autenticación con Supabase Auth

**Objetivo:** Permitir que los usuarios se registren, inicien sesión y guarden builds en su perfil.

**Cambios esperados:**
- Integrar `@supabase/auth-helpers-nextjs` para manejar sesiones en Server y Client Components.
- Crear tabla `user_builds` con FK a `auth.users`.
- La tabla `saved_builds` actual pasa a tener un campo opcional `user_id`.
- Las RLS policies se actualizan para que cada usuario solo vea sus propias builds.
- UI: Agregar botones de login/signup en la Navbar, página de perfil con historial de builds.

**Impacto en el store:** `saveBuildToCloud()` deberá incluir el `user_id` del usuario autenticado. Las builds anónimas podrían seguir existiendo como opción para usuarios no registrados.

---

### Fase 10+ — Ideas a Futuro

- **Comparador de componentes:** La ruta `/compare` ya existe como placeholder. Implementar side-by-side de specs.
- **Guías de armado:** La ruta `/guides` ya existe como placeholder. Contenido editorial sobre configuraciones recomendadas.
- **PWA:** Añadir instalación offline y estrategia de caché. La navegación responsive ya está implementada.
- **Build presets:** Configuraciones predefinidas (Gaming Budget, Workstation, Streaming, etc.).
- **Exportar build como imagen:** Generar una imagen compartible con el resumen de la configuración.
- **Notificaciones de precio:** Alertar al usuario cuando un componente de su build baja de precio.

---

## 6. Registro de Dependencias

| Paquete | Tipo | Justificación |
|---|---|---|
| `next` | prod | Framework principal |
| `react` / `react-dom` | prod | UI library |
| `zustand` | prod | Estado global del Builder, ligero (~1KB), sin boilerplate |
| `@supabase/supabase-js` | prod | SDK para persistencia cloud |
| `tailwindcss` / `@tailwindcss/postcss` | dev | Sistema de estilos |
| `typescript` | dev | Tipado estático |
| `eslint` / `eslint-config-next` | dev | Linting |
| `vitest` | dev | Tests del motor, repositorio, Server Action y CSP |

> **Filosofía:** Cada dependencia tiene un costo de mantenimiento. Se prefieren las APIs nativas del navegador y las capacidades de Next.js/React antes de agregar paquetes.

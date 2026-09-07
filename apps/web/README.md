# NexBuild Web

Aplicación Next.js de NexBuild. La guía de arquitectura, configuración de Supabase y migraciones está en el [`README` del repositorio](../../README.md).

## Comandos

```bash
pnpm dev               # desarrollo
pnpm run check         # TypeScript + ESLint + Vitest
pnpm build             # build de producción
pnpm start             # servidor de producción
pnpm run catalog:migrate
pnpm run catalog:enrich
pnpm run catalog:images
```

Copia `.env.example` a `.env.local` antes de iniciar. La service role es un secreto de servidor y solo se usa en Server Actions, rutas renderizadas en servidor y scripts de mantenimiento.

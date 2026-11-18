# Store Coverage 1.2 — Fase A

Preparación de ingeniería realizada el 2026-11-04. Esta fase no ejecuta `--apply`, no modifica Supabase y no incluye cambios de esquema, Auth, RLS, UI, migrations ni dependencias.

## Soporte de ingeniería

El motor de mantenimiento conserva los payloads v1 y agrega un formato v2 acotado:

- `slugMigration.from` autoriza únicamente completar un `slug` legacy actualmente nulo. El `id`, nombre y sitio deben coincidir; cualquier otro cambio continúa como `metadata-mismatch`.
- `verifiedIdentity` repite de forma explícita `productId`, `storeId` y `model`/MPN. La igualdad es exacta, sin normalizaciones que inventen equivalencias.
- `urlMigration.from` autoriza una sola URL histórica HTTPS. El par producto/tienda debe existir, la URL anterior debe coincidir y la URL nueva no puede pertenecer a otra oferta.
- Los updates comparan todos los campos leídos en preflight para detectar cambios concurrentes, no solo `last_updated`.
- El payload conserva la URL anterior y la nueva en Git, y el plan reporta `listingUrlsToMigrate`, dejando una traza revisable sin agregar una tabla de historial.

El dry-run continúa siendo el modo predeterminado. `priceCash:null`, timestamps viejos o colisionados, conflictos y bloqueos detienen el apply antes de cualquier escritura. El script no genera `verifiedAt`; exige el timestamp aportado por la verificación comercial.

## Payload comercial separado

El archivo `apps/web/scripts/store-price-comparison-1-2.json` contiene exclusivamente los datos comerciales preparados para revisión. Las dos fichas fueron comprobadas en un navegador real el 2026-11-04, con hora de cierre de verificación registrada como `2026-11-04T19:27:38.582-03:00`.

| Producto | Identidad confirmada | Evidencia SP Digital | Operación propuesta |
| --- | --- | --- | --- |
| Kingston NV2 1TB | `864f3703-9587-4ab7-be9f-f1de0524385c` · `kingston-nv2-1tb` · MPN `SNV2S/1000G` | [Ficha vigente](https://www.spdigital.cl/kingston-nv2-1tb-m2-2280-nvme-pcie/): $109.990 transferencia, $114.940 otros medios, botones de compra y `Stock online`. | Actualizar precios/stock y migrar explícitamente la URL legacy `https://www.spdigital.cl/producto/kingston-nv2-1tb` a la ficha vigente. |
| AMD Ryzen 7 5800X3D | `7ba4d01e-f9cb-419b-ad51-c550400c7a4a` · `amd-ryzen-7-5800x3d` · MPN `100-100000651WOF` | [Ficha vigente](https://www.spdigital.cl/ryzen-7-5800x3d/): $649.990 transferencia, $679.240 otros medios, botones de compra y `Stock online`. | Insertar la oferta solo después de completar o confirmar el slug de la tienda. |

No se usó la identidad distinta `100-000000651`.

## Estado de producción observado

- El HTML público de NexBuild para Kingston sigue mostrando una oferta SP Digital a $55.000, URL legacy y `last_updated=2026-08-26T00:43:48.166224+00:00`.
- El último read-only directo de Supabase versionado en el repositorio (2026-11-03) registró `spdigital.id=spdigital`, nombre y sitio correctos, y `slug=null`. También confirmó los dos productos activos y sin identidad MPN en `specs`.
- En esta sesión no había credenciales de Supabase disponibles y el frontend no expone su configuración pública, por lo que no se pudo repetir una consulta directa hoy. Esta ausencia no se sustituye con supuestos: el futuro dry-run debe releer Supabase y bloqueará si el estado cambió.

## Secuencia segura para Fase B

1. Fusionar primero el PR de ingeniería y sincronizar un checkout limpio de `main`.
2. Revalidar nuevamente ambas fichas y registrar timestamps observados; nunca generarlos desde el script.
3. Cargar credenciales de producción solo en el entorno confiable, sin guardarlas en el repositorio.
4. Ejecutar el dry-run con `--payload=store-price-comparison-1-2.json` y exigir cero conflictos/bloqueos.
5. Revisar que el plan proponga exactamente un `storesToUpdate`, una migración de URL, una actualización de NV2 y una inserción de Ryzen (o las operaciones idempotentes equivalentes si parte del estado ya fue aplicada).
6. Solicitar autorización separada antes de cualquier `--apply`.
7. Aplicar únicamente con `--apply --confirm=stores-price-comparison-1-2 --payload=store-price-comparison-1-2.json`, hacer read-back y repetir el dry-run hasta obtener estado idempotente.

# Store Coverage 1.1 — Trabajo B2

Consulta comercial realizada el 2026-11-03 entre 19:30:34 y 19:30:48 (America/Santiago, UTC-03:00). Supabase se consultó en modo de solo lectura. Este lote no ejecuta `--apply` ni propone cambios de esquema, Auth, RLS, UI o lógica de negocio.

## Operaciones incluidas

| Producto | Identidad NexBuild | Tienda y evidencia | Estado comprobado | Operación propuesta |
| --- | --- | --- | --- | --- |
| Sapphire PULSE RX 7600 | `83389eb3-a9cf-4097-8b8f-5f8fe7e952e0` · `sapphire-pulse-amd-radeon-rx-7600` · MPN `11324-01-20G` | [Alltec](https://www.alltec.cl/amd/2210-tv-sapphire-pulse-amd-radeon-rx-7600-8gb.html), 2026-11-03 19:30:34.796 -03:00 | La ficha exacta indica “Este producto ya no se encuentra disponible”; mantiene $359.900 y $372.496. La oferta existente todavía figura `in_stock=true`. | Actualizar solo `in_stock` a `false`, conservando URL y precios comprobados. |
| Intel Core i9-14900K | `f8559d10-52cd-48f9-8b2c-73795fa36f2b` · `intel-core-i9-14900k` · MPN `BX8071514900K` | [Centrale](https://centrale.cl/producto/procesador-intel-core-i9-14900k-raptor-lake-s-lga1700-uhd-graphics/), 2026-11-03 19:30:48.930 -03:00 | $608.680 transferencia/efectivo, $642.160 tarjeta y “Última unidad”. | Insertar tienda `centrale` y una segunda oferta disponible. |

Metadatos nuevos de Centrale comprobados en la ficha directa: `id=centrale`, `slug=centrale`, nombre `Centrale`, sitio `https://centrale.cl`.

## Verificados pero excluidos

| Producto | Identidad NexBuild | Evidencia comercial | Motivo de exclusión del payload |
| --- | --- | --- | --- |
| Kingston NV2 1TB | `864f3703-9587-4ab7-be9f-f1de0524385c` · `kingston-nv2-1tb` · MPN `SNV2S/1000G` | [SP Digital](https://www.spdigital.cl/kingston-nv2-1tb-m2-2280-nvme-pcie/), 2026-11-03 19:30:36.082 -03:00: $109.990 transferencia, $114.940 normal, compra online disponible. | La tienda existente tiene `slug=null`, incompatible con el payload validado. Además, la URL guardada (`/producto/kingston-nv2-1tb`) difiere de la ficha vigente, por lo que el motor clasificaría `url-mismatch`. |
| AMD Ryzen 7 5800X3D | `7ba4d01e-f9cb-419b-ad51-c550400c7a4a` · `amd-ryzen-7-5800x3d` · MPN `100-100000651WOF` | [SP Digital](https://www.spdigital.cl/ryzen-7-5800x3d/), 2026-11-03 19:30:36.570 -03:00: $649.990 transferencia, $679.240 normal, compra online disponible. Se descartó explícitamente la ficha distinta `100-000000651`. | La tienda existente tiene `slug=null`; incluirla produciría un conflicto `metadata-mismatch` antes de cualquier escritura. |

ASUS PRIME H610M-E D4 / Tecno-Site permanece fuera de B2 por instrucción de alcance y no se revalidó para este payload.

## Estado leído de Supabase

- `spdigital`: tienda existente con nombre y URL correctos, pero `slug=null`.
- `alltec`: metadatos coincidentes; oferta RX 7600 en $359.900/$372.496, `in_stock=true`, última actualización `2026-10-13T15:00:00+00:00`.
- `centrale`: no existe aún como tienda.
- Los cuatro productos están activos. Sus filas no contienen `sku`, `model`, `mpn` ni otro campo de identidad admitido dentro de `specs`; los MPN del lote se verificaron directamente en las fichas comerciales exactas.

## Límite de revisión

El payload B2 contiene únicamente dos operaciones soportadas por el motor v1.1. Resolver SP Digital requeriría corregir metadatos existentes o ampliar la lógica de mantenimiento; ambas acciones quedan fuera de este PR.

## Dry-run contra Supabase

Ejecutado sin `--apply` el 2026-11-03:

```text
mode: dry-run
storesPrepared: 2
storesToInsert: 1
listingsPrepared: 2
listingsToInsert: 1
listingsToUpdate: 1
listingsToRefresh: 0
productsCovered: 2
alreadyCurrent: 0
conflicts: 0
blocked: 0
outOfStock: 1
```

No se realizaron escrituras.

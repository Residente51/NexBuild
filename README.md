# NexBuild

> **Arma mejor. Compra inteligente.**  
> *Configurador de PCs para el mercado chileno*

NexBuild es una plataforma integral diseñada para facilitar el armado de PCs. Su objetivo es permitir a entusiastas y compradores primerizos configurar equipos con piezas 100% compatibles, visualizar precios reales en CLP (pesos chilenos) y compartir sus configuraciones con un solo clic.

---

## 🚀 Tecnologías Principales

El proyecto está construido sobre un stack moderno y eficiente, priorizando la velocidad y el renderizado asíncrono:

- **Next.js 16 (App Router):** Renderizado híbrido con un enfoque estricto en Server Components para minimizar la carga de JavaScript en el cliente.
- **Tailwind CSS v4:** Sistema de diseño escalable configurado de forma nativa ("CSS-first") bajo la identidad visual *iOS Clean Tech*.
- **Zustand:** Manejo de estado global ultraligero y persistente en el cliente para la gestión fluida del PC Builder.
- **Supabase (PostgreSQL):** Base de datos relacional en la nube protegida mediante políticas RLS, utilizada para persistir el catálogo y las configuraciones compartidas.

---

## ✨ Características Clave

- 🧠 **Motor de Compatibilidad Determinista:** El núcleo de NexBuild evalúa la configuración del usuario en tiempo real mediante un estricto conjunto de 10 reglas deterministas escritas en TypeScript (validando sockets, form factors, wattaje, clearances y más). No se utilizan heurísticas de IA para asegurar una precisión total.
- 📦 **Catálogo Dinámico e Interactivo:** Una interfaz responsiva (Bento Grid) conectada directamente a Supabase para buscar, filtrar y añadir componentes al PC.
- 💰 **Precios Nativos en CLP:** El sistema maneja precios reales para el mercado chileno, formateando dinámicamente los valores para mantener claridad en el presupuesto del usuario.
- ☁️ **Persistencia Cloud Compartible:** Permite generar un enlace único (`/build/[id]`) para compartir o retomar cualquier configuración previamente construida.

---

## 🛠️ Desarrollo Local

Para levantar el proyecto en tu entorno local, sigue estas instrucciones:

1. Clona el repositorio e instala las dependencias mediante `pnpm` (el gestor de paquetes requerido para este workspace):
   ```bash
   pnpm install
   ```

2. Configura las variables de entorno en un archivo `.env.local` en la raíz de `apps/web/`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL="tu-supabase-url"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="tu-anon-key"
   ```

3. Levanta el servidor de desarrollo:
   ```bash
   pnpm dev
   ```

El proyecto estará corriendo y accesible en [http://localhost:3000](http://localhost:3000).

---

> *Para conocer más sobre la arquitectura y la bitácora de decisiones técnicas, consulta el archivo [`docs/DEVLOG.md`](./docs/DEVLOG.md).*

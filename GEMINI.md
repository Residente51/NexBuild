# Guía de Trabajo para Gemini (NexBuild)

Este archivo complementa la información proporcionada en `CLAUDE.md` y establece el contexto y las reglas específicas para la asistencia de Gemini en el proyecto **NexBuild**.

---

## 1. Qué es NexBuild
NexBuild es una plataforma de hardware orientada a la creación de PCs ("Arma mejor. Compra inteligente."). Aunque actualmente muestra un catálogo de componentes, su visión completa es ser un constructor de PCs integral.

## 2. Objetivo Principal del Producto
El objetivo principal es evolucionar desde un simple catálogo de componentes hacia un **PC Builder completo**, que permita a los usuarios armar equipos compatibles, comparar opciones y tomar decisiones de compra informadas con precios reales.

## 3. Arquitectura Actual Real
La aplicación está construida sobre una arquitectura que separa la capa de visualización de la capa de acceso a datos:
- El ruteo (`app/`) se mantiene extremadamente delgado.
- Los componentes interactivos (como la barra de búsqueda y el filtrado del catálogo) delegan la obtención de datos hacia capas puras o repositorios (ej. `lib/components/repository.ts`).
- Esto permite que el día de mañana se reemplace el archivo local por una API o base de datos sin alterar la interfaz de usuario.

## 4. Stack Actual
- Next.js 16.2.12 (App Router).
- React 19.2.4.
- TypeScript 5.x.
- Tailwind CSS v4 (con configuración nativa "CSS-first" en `globals.css`, sin archivo `tailwind.config.ts`).
- pnpm como gestor de paquetes.

## 5. Estructura del Proyecto
Además de las divisiones indicadas en `CLAUDE.md`, la estructura real analizada muestra:
- `data/`: Contiene el mock actual de los datos (`components.ts`). No existe base de datos todavía.
- `lib/`: Contiene lógica de dominio pura (como la búsqueda en `lib/components/search.ts`) y los repositorios.
- `types/`: Definición estricta de las interfaces de dominio (ej: `PCComponent`).

## 6. Convenciones de Código
- La lógica de filtrado o transformación de datos no debe estar mezclada en los Client Components.
- Extraer funciones puras que operen sobre los datos, para que puedan ser utilizadas independientemente si corren en el cliente o en el servidor.
- Mantener la preferencia estricta por Server Components.

## 7. Convenciones de UI y Nomenclatura
- Todo el texto visible para el usuario DEBE estar en **Español** (incluyendo formateos como CLP con `toLocaleString("es-CL")`).
- Toda la lógica, variables, interfaces, carpetas y nombres de dominio DEBEN estar en **Inglés**.
- Los identificadores de dominio (como las claves de las categorías) son inmutables.

## 8. Principios Arquitectónicos
- **Repositorios como única fuente de verdad:** Ningún componente debe leer `data/components.ts` directamente; siempre deben pasar por las funciones provistas en `lib/components/repository.ts`.
- **Desacoplamiento progresivo:** El diseño debe prepararse para la asincronía y el consumo de bases de datos.

## 9. Restricciones: Qué NO modificar sin consultar
- No modifiques el mock de datos (`data/components.ts`) para tareas no relacionadas.
- No alteres los esquemas de metadatos por defecto ni el texto placeholder a menos que se te pida explícitamente.
- No cambies los contratos de interfaces en `types/` sin proponerlo primero, ya que afectan todo el proyecto.
- No realices grandes refactorizaciones ni instales nuevas herramientas (ej. DBs, sistemas de estado global) sin aprobación previa.

## 10. Uso de Git
- No debes realizar *commits*, *reset*, ni *checkout* indiscriminados.
- Respeta siempre el *staging area* actual y no modifiques archivos sin tener en cuenta los cambios que el usuario ya ha preparado.

## 11. Claridad en la Comunicación
Cuando presentes información, debes distinguir claramente entre:
- **Hechos:** Lo que realmente existe en el código o el estado actual del repositorio.
- **Decisiones:** Lineamientos técnicos o de diseño que ya se han tomado y deben cumplirse.
- **Recomendaciones:** Sugerencias u opiniones que aportes para mejorar la arquitectura, sujetas a aprobación.

## 12. Estado Actual del Proyecto
El proyecto cuenta con un catálogo funcional y un sistema de búsqueda. En este momento se está realizando una extracción (refactor) de la lógica hacia repositorios para simular una API estática y desacoplar los datos de los Client Components, pero aún opera de manera 100% síncrona.

## 13. Próxima Dirección Estratégica
El siguiente gran hito del proyecto es **convertir el catálogo en un PC Builder**. Esto implica poder seleccionar piezas (CPU, GPU, RAM, etc.) desde el catálogo e ir armando una configuración.

## 14. Compatibilidad Técnica (Regla Crítica)
**REGLA EXPLÍCITA:** La compatibilidad técnica entre los componentes del PC Builder (por ejemplo, validar si un CPU y una Placa Madre comparten el mismo socket, o si el factor de forma coincide) DEBE estar basada exclusivamente en **lógica determinista y datos estructurados**. Nunca debe depender del "conocimiento" interno, razonamiento o suposiciones de un LLM. Todo motor de compatibilidad debe operar mediante reglas de código verificables que crucen los datos estandarizados del catálogo.

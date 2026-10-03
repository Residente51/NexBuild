import Link from "next/link";
import { HomeCtaLink } from "@/components/analytics/HomeCtaLink";
import { ComponentCard } from "@/components/catalog/ComponentCard";
import { Hero } from "@/components/sections/Hero";
import { buttonClassName } from "@/components/ui/Button";
import { fetchCatalogFromSupabase } from "@/lib/components/repository";

const STEPS = [
  {
    number: "01",
    title: "Explora componentes",
    description: "Busca en el catálogo y filtra por categoría, marca, precio o disponibilidad.",
    href: "/components",
    linkLabel: "Ver catálogo",
  },
  {
    number: "02",
    title: "Compara alternativas",
    description: "Pon lado a lado entre 2 y 4 componentes de la misma categoría.",
    href: "/compare",
    linkLabel: "Ir al comparador",
  },
  {
    number: "03",
    title: "Arma y valida compatibilidad",
    description: "Construye tu PC paso a paso y revisa compatibilidad, consumo y costo estimado.",
    href: "/builder",
    linkLabel: "Abrir Builder",
  },
] as const;

const CAPABILITIES = [
  {
    title: "Catálogo para decidir",
    description: "Explora componentes reales con búsqueda, filtros y precios referenciales en CLP.",
    eyebrow: "Explora",
  },
  {
    title: "Comparación directa",
    description: "Compara de 2 a 4 alternativas de una misma categoría sin perder contexto.",
    eyebrow: "Compara",
  },
  {
    title: "Builder paso a paso",
    description: "Selecciona cada pieza y consulta el costo total y el consumo estimado de tu configuración.",
    eyebrow: "Construye",
  },
  {
    title: "Compatibilidad explicable",
    description: "Recibe validaciones deterministas y entiende qué piezas no son compatibles y por qué.",
    eyebrow: "Valida",
  },
  {
    title: "Builds guardadas",
    description: "Con una cuenta puedes guardar tus configuraciones, retomarlas y administrarlas.",
    eyebrow: "Continúa",
  },
  {
    title: "Comparte tu armado",
    description: "Genera un enlace para mostrar una configuración completa cuando esté lista.",
    eyebrow: "Comparte",
  },
] as const;

const TRUST_POINTS = [
  "La compatibilidad se evalúa con reglas definidas, no con respuestas generadas al azar.",
  "Cuando detectamos una incompatibilidad, te mostramos el motivo para que puedas corregirla.",
  "Los precios son referenciales y pueden variar en cada tienda.",
  "La precisión y cobertura dependen de las especificaciones disponibles para cada componente.",
] as const;

export default async function Home() {
  const result = await fetchCatalogFromSupabase();
  const components = result.success ? result.data : [];
  const availableComponents = components.filter((component) => component.inStock !== false);

  return (
    <div className="mx-auto w-full max-w-[90rem] space-y-6 pb-4 sm:space-y-8">
      <Hero
        componentCount={components.length}
        catalogError={result.success ? undefined : result.error}
      />

      <section
        className="rounded-[2rem] border border-white/10 bg-white/[0.025] px-5 py-12 sm:px-8 lg:px-12 lg:py-16"
        aria-labelledby="how-it-works-title"
      >
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#38BDF8]">Cómo funciona</p>
          <h2 id="how-it-works-title" className="mt-3 text-3xl font-black tracking-tight text-[#FBFEF9] sm:text-4xl">
            De la primera pieza a una build validada
          </h2>
          <p className="mt-4 text-base leading-relaxed text-white/60 sm:text-lg">
            NexBuild ordena el proceso para que puedas explorar, comparar y construir con información clara.
          </p>
        </div>

        <ol className="mt-10 grid gap-4 lg:grid-cols-3">
          {STEPS.map((step) => (
            <li
              key={step.number}
              className="group flex min-h-64 flex-col rounded-3xl border border-white/10 bg-[#111119] p-6 transition-[border-color,transform] duration-150 motion-reduce:transition-none motion-reduce:hover:transform-none hover:-translate-y-1 hover:border-[#0E79B2]/50"
            >
              <span className="font-mono text-sm font-bold text-[#38BDF8]">{step.number}</span>
              <h3 className="mt-8 text-xl font-bold text-[#FBFEF9]">{step.title}</h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-white/55">{step.description}</p>
              <Link
                href={step.href}
                className="mt-7 inline-flex min-h-11 items-center self-start rounded-lg text-sm font-semibold text-sky-300 transition-colors duration-150 hover:text-sky-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#38BDF8]"
              >
                {step.linkLabel}<span aria-hidden="true" className="ml-2">→</span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section
        className="rounded-[2rem] border border-white/10 bg-[#111119] px-5 py-12 sm:px-8 lg:px-12 lg:py-16"
        aria-labelledby="capabilities-title"
      >
        <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#38BDF8]">Qué puedes hacer</p>
            <h2 id="capabilities-title" className="mt-3 text-3xl font-black tracking-tight text-[#FBFEF9] sm:text-4xl">
              Todo lo necesario para elegir con criterio
            </h2>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/60">
              Desde la búsqueda inicial hasta una configuración que puedes guardar y compartir, cada herramienta resuelve una parte concreta del proceso.
            </p>
          </div>

          <div className="grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 sm:grid-cols-2">
            {CAPABILITIES.map((capability) => (
              <article key={capability.title} className="bg-[#191923] p-6 sm:p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#38BDF8]">{capability.eyebrow}</p>
                <h3 className="mt-3 text-lg font-bold text-[#FBFEF9]">{capability.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/55">{capability.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        className="overflow-hidden rounded-[2rem] border border-[#0E79B2]/30 bg-[#0E79B2]/10 px-5 py-12 sm:px-8 lg:px-12 lg:py-16"
        aria-labelledby="trust-title"
      >
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start lg:gap-16">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-300">Confianza y transparencia</p>
            <h2 id="trust-title" className="mt-3 text-3xl font-black tracking-tight text-[#FBFEF9] sm:text-4xl">
              Decisiones claras, sin caja negra
            </h2>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/65">
              Queremos que sepas qué valida NexBuild, cómo lo hace y dónde están los límites de la información disponible.
            </p>
          </div>

          <ul className="grid gap-3 sm:grid-cols-2">
            {TRUST_POINTS.map((point) => (
              <li key={point} className="flex gap-3 rounded-2xl border border-white/10 bg-[#111119]/65 p-5 text-sm leading-relaxed text-white/70">
                <span aria-hidden="true" className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#34D399]/15 text-xs font-bold text-[#6EE7B7]">✓</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section
        className="rounded-[2rem] border border-white/10 bg-white/[0.025] px-5 py-12 sm:px-8 lg:px-12 lg:py-16"
        aria-labelledby="featured-title"
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#38BDF8]">Catálogo</p>
            <h2 id="featured-title" className="mt-3 text-3xl font-black tracking-tight text-[#FBFEF9] sm:text-4xl">
              Componentes destacados
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/60">
              Un punto de partida para explorar alternativas disponibles y sus precios referenciales.
            </p>
          </div>
          <Link href="/components" className={buttonClassName("secondary", "shrink-0")}>Ver todo el catálogo</Link>
        </div>

        {!result.success ? (
          <div className="mt-10 rounded-2xl border border-amber-400/20 bg-amber-400/5 px-6 py-8 text-center text-amber-100">
            <p>No pudimos cargar los componentes destacados.</p>
            <p className="mt-2 text-sm text-white/60">{result.error}</p>
          </div>
        ) : availableComponents.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-white/10 bg-black/10 px-6 py-10 text-center text-white/60">
            <p>El catálogo está siendo poblado. Intenta más tarde.</p>
          </div>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {availableComponents.slice(0, 8).map((component) => (
              <ComponentCard key={component.id} component={component} />
            ))}
          </div>
        )}
      </section>

      <section
        className="relative isolate overflow-hidden rounded-[2rem] border border-white/10 bg-[#111119] px-5 py-14 text-center sm:px-8 lg:px-12 lg:py-20"
        aria-labelledby="final-cta-title"
      >
        <div className="absolute left-1/2 top-0 -z-10 h-64 w-2/3 -translate-x-1/2 rounded-full bg-[#0E79B2]/20 blur-[100px]" aria-hidden="true" />
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#38BDF8]">Tu próxima build</p>
        <h2 id="final-cta-title" className="mx-auto mt-3 max-w-3xl text-3xl font-black tracking-tight text-[#FBFEF9] sm:text-5xl">
          Empieza a construir con una base más clara
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/60 sm:text-lg">
          Elige tus componentes, revisa la compatibilidad y entiende tu configuración antes de tomar una decisión.
        </p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <HomeCtaLink
            href="/builder"
            destination="builder"
            placement="final"
            className={buttonClassName("primary", "w-full sm:w-auto")}
          >
            Crear mi PC<span aria-hidden="true" className="ml-2">→</span>
          </HomeCtaLink>
          <HomeCtaLink
            href="/components"
            destination="catalog"
            placement="final"
            className={buttonClassName("secondary", "w-full sm:w-auto")}
          >
            Explorar componentes
          </HomeCtaLink>
        </div>
      </section>
    </div>
  );
}

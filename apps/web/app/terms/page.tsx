import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Términos",
  description:
    "Condiciones de uso prácticas para las herramientas y la información disponible en NexBuild.",
  alternates: {
    canonical: "/terms",
  },
  openGraph: {
    url: "/terms",
    title: "Términos de uso de NexBuild",
    description:
      "Condiciones de uso prácticas para las herramientas y la información disponible en NexBuild.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const TERMS = [
  {
    number: "01",
    title: "Herramienta informativa",
    body: "NexBuild es un catálogo, comparador y configurador. Su objetivo es ayudarte a ordenar información y evaluar alternativas; no realiza la compra ni sustituye la revisión final de cada producto.",
  },
  {
    number: "02",
    title: "Precios referenciales",
    body: "Los precios se muestran en CLP como referencia y pueden cambiar según la tienda, el momento, la disponibilidad u otras condiciones. El valor vigente es el que informe la tienda antes de comprar.",
  },
  {
    number: "03",
    title: "Compatibilidad basada en datos",
    body: "Las validaciones usan reglas deterministas y las especificaciones disponibles. Ayudan a detectar conflictos conocidos, pero no constituyen una garantía absoluta de compatibilidad física, eléctrica o de firmware.",
  },
  {
    number: "04",
    title: "Verificación antes de comprar",
    body: "Antes de tomar una decisión, debes confirmar precio, stock, revisión exacta, dimensiones, conectores, soporte de BIOS y cualquier otra especificación relevante con la tienda o el fabricante.",
  },
  {
    number: "05",
    title: "Builds compartidas",
    body: "Al compartir una build se genera un enlace a su snapshot público. Cualquier persona que tenga ese enlace puede consultar la configuración, por lo que debes tratarlo como información accesible mediante enlace.",
  },
] as const;

export default function TermsPage() {
  return (
    <article className="mx-auto w-full max-w-5xl space-y-6 pb-4 sm:space-y-8">
      <header className="rounded-[2rem] border border-white/10 bg-[#111119] px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#38BDF8]">
          Términos de uso
        </p>
        <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight text-[#FBFEF9] sm:text-5xl lg:text-6xl">
          Usa NexBuild como una guía para decidir
        </h1>
        <p className="mt-6 max-w-3xl text-base leading-relaxed text-white/65 sm:text-lg">
          Estas condiciones explican el alcance real de las herramientas y de la
          información que NexBuild ofrece hoy.
        </p>
      </header>

      <ol className="space-y-4">
        {TERMS.map((term) => (
          <li
            key={term.number}
            className="grid gap-4 rounded-3xl border border-white/10 bg-white/[0.025] p-6 sm:grid-cols-[3rem_1fr] sm:gap-6 sm:p-8"
          >
            <span className="font-mono text-sm font-bold text-[#38BDF8]">{term.number}</span>
            <div>
              <h2 className="text-xl font-bold text-[#FBFEF9]">{term.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-white/60 sm:text-base">
                {term.body}
              </p>
            </div>
          </li>
        ))}
      </ol>

      <section
        aria-labelledby="terms-summary-title"
        className="rounded-[2rem] border border-amber-300/20 bg-amber-300/[0.06] px-5 py-10 sm:px-8 lg:px-12 lg:py-14"
      >
        <h2 id="terms-summary-title" className="text-2xl font-black tracking-tight text-[#FBFEF9]">
          La última comprobación sigue siendo tuya
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-white/65">
          Usa las señales de NexBuild para reducir incertidumbre, y confirma la
          información crítica con las fuentes del producto antes de pagar.
        </p>
      </section>
    </article>
  );
}

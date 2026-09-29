import type { Metadata } from "next";
import Link from "next/link";

import { buttonClassName } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Acerca de",
  description:
    "Conoce cómo NexBuild ayuda a explorar, comparar y armar un PC con información clara y compatibilidad explicable.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    url: "/about",
    title: "Acerca de NexBuild",
    description:
      "Una herramienta para explorar, comparar y armar un PC con información clara y compatibilidad explicable.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const CAPABILITIES = [
  {
    title: "Catálogo y comparación",
    description:
      "Explora componentes, filtra alternativas y compara entre 2 y 4 productos de una misma categoría.",
  },
  {
    title: "Builder guiado",
    description:
      "Arma una configuración paso a paso y consulta su costo referencial y consumo estimado.",
  },
  {
    title: "Compatibilidad determinista",
    description:
      "Las validaciones se basan en reglas y especificaciones disponibles, con motivos visibles cuando se detecta un conflicto.",
  },
  {
    title: "Continuidad y colaboración",
    description:
      "Con una cuenta puedes guardar y administrar builds, además de compartir una configuración mediante un enlace.",
  },
] as const;

export default function AboutPage() {
  return (
    <article className="mx-auto w-full max-w-6xl space-y-6 pb-4 sm:space-y-8">
      <header className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#111119] px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#38BDF8]">
          Acerca de NexBuild
        </p>
        <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-tight text-[#FBFEF9] sm:text-5xl lg:text-6xl">
          Una forma más clara de armar tu próximo PC
        </h1>
        <p className="mt-6 max-w-3xl text-base leading-relaxed text-white/65 sm:text-lg">
          NexBuild es un catálogo, comparador y configurador pensado para ordenar
          las decisiones que aparecen al elegir componentes de PC en Chile.
        </p>
      </header>

      <section
        aria-labelledby="problem-title"
        className="grid gap-6 rounded-[2rem] border border-white/10 bg-white/[0.025] px-5 py-10 sm:px-8 lg:grid-cols-2 lg:gap-12 lg:px-12 lg:py-14"
      >
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#38BDF8]">
            El problema
          </p>
          <h2 id="problem-title" className="mt-3 text-3xl font-black tracking-tight text-[#FBFEF9]">
            Muchas piezas, decisiones conectadas
          </h2>
        </div>
        <div className="space-y-4 text-base leading-relaxed text-white/65">
          <p>
            Elegir componentes implica cruzar especificaciones, compatibilidad,
            disponibilidad y precios que pueden cambiar. Hacerlo con información
            dispersa vuelve difícil entender el conjunto.
          </p>
          <p>
            NexBuild reúne esas decisiones en un flujo único: explorar, comparar,
            construir y revisar antes de comprar.
          </p>
        </div>
      </section>

      <section
        aria-labelledby="today-title"
        className="rounded-[2rem] border border-white/10 bg-[#111119] px-5 py-10 sm:px-8 lg:px-12 lg:py-14"
      >
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#38BDF8]">
          Cómo funciona hoy
        </p>
        <h2 id="today-title" className="mt-3 text-3xl font-black tracking-tight text-[#FBFEF9]">
          Herramientas concretas para decidir con criterio
        </h2>
        <div className="mt-8 grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 sm:grid-cols-2">
          {CAPABILITIES.map((capability) => (
            <section key={capability.title} className="bg-[#191923] p-6 sm:p-7">
              <h3 className="text-lg font-bold text-[#FBFEF9]">{capability.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-white/60">
                {capability.description}
              </p>
            </section>
          ))}
        </div>
      </section>

      <section
        aria-labelledby="limits-title"
        className="rounded-[2rem] border border-amber-300/20 bg-amber-300/[0.06] px-5 py-10 sm:px-8 lg:px-12 lg:py-14"
      >
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-200">
          Límites actuales
        </p>
        <h2 id="limits-title" className="mt-3 text-3xl font-black tracking-tight text-[#FBFEF9]">
          Una ayuda informativa, no una garantía de compra
        </h2>
        <p className="mt-5 max-w-3xl text-base leading-relaxed text-white/65">
          Los precios se muestran en CLP como referencia y pueden variar por tienda.
          La compatibilidad depende de las reglas y especificaciones disponibles;
          cuando faltan datos, NexBuild no reemplaza la verificación final de stock,
          precio y ficha técnica antes de comprar.
        </p>
      </section>

      <section
        aria-labelledby="about-cta-title"
        className="rounded-[2rem] border border-[#0E79B2]/30 bg-[#0E79B2]/10 px-5 py-12 text-center sm:px-8 lg:px-12 lg:py-16"
      >
        <h2 id="about-cta-title" className="text-3xl font-black tracking-tight text-[#FBFEF9] sm:text-4xl">
          Empieza por tu próxima decisión
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-white/65">
          Explora el catálogo o construye una configuración completa paso a paso.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/builder" className={buttonClassName("primary", "w-full sm:w-auto")}>
            Abrir Builder
          </Link>
          <Link href="/components" className={buttonClassName("secondary", "w-full sm:w-auto")}>
            Explorar componentes
          </Link>
        </div>
      </section>
    </article>
  );
}

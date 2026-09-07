import Link from "next/link";
import { buttonClassName } from "@/components/ui/Button";

interface HeroProps {
  componentCount: number;
  catalogError?: string;
}

export function Hero({ componentCount, catalogError }: HeroProps) {
  return (
    <section className="relative overflow-hidden bg-[#191923]" aria-labelledby="hero-title">
      <div className="absolute inset-0 bg-[#191923]" aria-hidden="true" />
      <div
        className="absolute left-1/2 top-32 h-96 w-96 -translate-x-1/2 rounded-full bg-[#0E79B2]/8 blur-[140px]"
        aria-hidden="true"
      />
      <div
        className="absolute right-20 top-52 h-72 w-72 rounded-full bg-[#0E79B2]/5 blur-[120px]"
        aria-hidden="true"
      />

      <div className="relative mx-auto flex min-h-[80vh] max-w-7xl flex-col items-center gap-12 px-2 py-12 sm:px-6 sm:py-20 lg:flex-row lg:gap-16">
        <div className="min-w-0 flex-1">
          <span className="inline-flex rounded-full border border-[#0E79B2]/40 bg-[#0E79B2]/10 px-4 py-2 text-sm text-[#38BDF8]">
            La nueva forma de construir tu PC
          </span>

          <h1
            id="hero-title"
            className="mt-8 text-4xl font-black leading-tight text-[#FBFEF9] sm:text-5xl md:text-7xl"
          >
            Arma tu próximo PC.
          </h1>

          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-white/70 sm:text-xl">
            Compara componentes, valida las compatibilidades cubiertas y arma una
            configuración con precios referenciales para Chile.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/builder" className={buttonClassName("primary")}>
              Crear mi PC
            </Link>
            <Link href="/components" className={buttonClassName("secondary")}>
              Explorar componentes
            </Link>
          </div>

          <div className="mt-16 grid max-w-xl grid-cols-1 gap-6 sm:grid-cols-3">
            <div>
              <p className="text-3xl font-bold tabular-nums text-[#FBFEF9]">
                {componentCount}
              </p>
              <p className="text-sm text-white/70">Componentes activos</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-[#FBFEF9]">Determinista</p>
              <p className="text-sm text-white/70">Validación explicable</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-[#FBFEF9]">CLP</p>
              <p className="text-sm text-white/70">Precios referenciales</p>
            </div>
          </div>

          {catalogError && (
            <p className="mt-6 text-sm text-amber-300" role="status">
              El catálogo no está disponible temporalmente. Puedes seguir usando
              tu configuración guardada.
            </p>
          )}
        </div>

        <div className="flex w-full flex-1 justify-center lg:w-auto" aria-hidden="true">
          <div className="relative aspect-square w-full max-w-[32rem]">
            <div className="absolute inset-0 rounded-full bg-[#0E79B2]/10 blur-[120px]" />
            <div className="absolute inset-4 rounded-3xl border border-white/10 bg-white/5 shadow-2xl shadow-black/20 sm:inset-10">
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <div className="text-7xl sm:text-8xl">🖥️</div>
                  <p className="mt-6 text-xl font-bold text-[#FBFEF9] sm:text-2xl">
                    Tu próxima build comienza aquí
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

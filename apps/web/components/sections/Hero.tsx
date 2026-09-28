import Link from "next/link";
import { buttonClassName } from "@/components/ui/Button";

interface HeroProps {
  componentCount: number;
  catalogError?: string;
}

const BUILD_PREVIEW = [
  { label: "Procesador", value: "Seleccionado", state: "ready" },
  { label: "Placa madre", value: "Compatible", state: "ready" },
  { label: "Tarjeta de video", value: "Por elegir", state: "pending" },
] as const;

export function Hero({ componentCount, catalogError }: HeroProps) {
  return (
    <section
      className="relative isolate overflow-hidden rounded-[2rem] border border-white/10 bg-[#111119] px-5 py-10 shadow-[0_28px_80px_rgba(0,0,0,0.28)] sm:px-8 sm:py-14 lg:px-12 lg:py-20"
      aria-labelledby="hero-title"
    >
      <div
        className="absolute inset-0 -z-20 bg-[linear-gradient(135deg,rgba(14,121,178,0.13),transparent_42%)]"
        aria-hidden="true"
      />
      <div
        className="absolute -right-32 -top-32 -z-10 h-96 w-96 rounded-full bg-[#0E79B2]/15 blur-[120px]"
        aria-hidden="true"
      />

      <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1.08fr)_minmax(22rem,0.92fr)] lg:gap-16">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-2 rounded-full border border-[#38BDF8]/25 bg-[#0E79B2]/10 px-4 py-2 text-sm font-semibold text-sky-200">
            <span className="h-1.5 w-1.5 rounded-full bg-[#38BDF8]" aria-hidden="true" />
            Configura con más claridad
          </p>

          <h1
            id="hero-title"
            className="mt-7 max-w-3xl text-4xl font-black leading-[1.04] tracking-[-0.035em] text-[#FBFEF9] sm:text-6xl lg:text-7xl"
          >
            Arma tu próximo PC.
          </h1>

          <p className="mt-7 max-w-2xl text-lg leading-relaxed text-white/70 sm:text-xl">
            Elige componentes reales, compara alternativas y valida la
            compatibilidad de tu configuración antes de decidir qué comprar.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href="/builder" className={buttonClassName("primary", "w-full sm:w-auto")}>
              Crear mi PC
              <span aria-hidden="true" className="ml-2">→</span>
            </Link>
            <Link href="/components" className={buttonClassName("secondary", "w-full sm:w-auto")}>
              Explorar componentes
            </Link>
          </div>

          <dl className="mt-12 grid max-w-2xl grid-cols-1 gap-4 border-t border-white/10 pt-7 sm:grid-cols-3">
            <div>
              <dd className="text-2xl font-bold tabular-nums text-[#FBFEF9]">{componentCount}</dd>
              <dt className="mt-1 text-sm text-white/55">Componentes activos</dt>
            </div>
            <div>
              <dd className="text-2xl font-bold text-[#FBFEF9]">Por reglas</dd>
              <dt className="mt-1 text-sm text-white/55">Validación determinista</dt>
            </div>
            <div>
              <dd className="text-2xl font-bold text-[#FBFEF9]">CLP</dd>
              <dt className="mt-1 text-sm text-white/55">Precios referenciales</dt>
            </div>
          </dl>

          {catalogError && (
            <p className="mt-6 text-sm text-amber-300" role="status">
              El catálogo no está disponible temporalmente. Puedes seguir usando
              tu configuración guardada.
            </p>
          )}
        </div>

        <div className="relative mx-auto w-full max-w-xl" aria-hidden="true">
          <div className="absolute -inset-5 rounded-[2rem] bg-[#0E79B2]/10 blur-2xl" />
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#191923]/95 p-4 shadow-2xl shadow-black/40 sm:p-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40">Mi configuración</p>
                <p className="mt-1 font-bold text-[#FBFEF9]">PC gaming equilibrado</p>
              </div>
              <span className="rounded-full bg-[#34D399]/10 px-3 py-1.5 text-xs font-semibold text-[#6EE7B7]">Compatible</span>
            </div>

            <div className="mt-4 space-y-2">
              {BUILD_PREVIEW.map((item, index) => (
                <div key={item.label} className="flex min-h-16 items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.035] px-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#0E79B2]/15 text-xs font-bold text-sky-200">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white/90">{item.label}</p>
                    <p className="text-xs text-white/45">{item.value}</p>
                  </div>
                  <span className={`h-2.5 w-2.5 rounded-full ${item.state === "ready" ? "bg-[#34D399]" : "bg-white/20"}`} />
                </div>
              ))}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-black/20 p-4">
                <p className="text-xs text-white/45">Consumo estimado</p>
                <p className="mt-1 text-xl font-bold tabular-nums text-white">420 W</p>
              </div>
              <div className="rounded-2xl bg-black/20 p-4">
                <p className="text-xs text-white/45">Progreso</p>
                <p className="mt-1 text-xl font-bold tabular-nums text-white">2 de 8</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

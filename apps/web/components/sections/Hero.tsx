import Link from "next/link";
import { Button } from "../ui/Button";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#0A0F12]">
      {/* Fondo */}
      <div className="absolute inset-0 bg-[#0A0F12]" />

      {/* Luces */}
      <div className="absolute left-1/2 top-32 h-96 w-96 -translate-x-1/2 rounded-full bg-[#A33715]/8 blur-[140px]" />
      <div className="absolute right-20 top-52 h-72 w-72 rounded-full bg-[#A33715]/5 blur-[120px]" />

      <div className="relative mx-auto flex min-h-[90vh] max-w-7xl flex-col items-center gap-16 px-6 py-20 lg:flex-row">
        {/* Texto */}
        <div className="flex-1">
          <span className="rounded-full border border-[#A33715]/30 bg-[#A33715]/10 px-4 py-2 text-sm text-[#D4A08A]">
            La nueva forma de construir tu PC
          </span>

          <h1 className="mt-8 text-5xl font-black leading-tight text-white md:text-7xl">
            Arma el PC perfecto.
          </h1>

          <p className="mt-8 max-w-2xl text-xl leading-relaxed text-zinc-400">
            Compara componentes, verifica compatibilidad, revisa precios y crea
            builds increíbles desde un solo lugar.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/builder">
              <Button variant="primary">
                Crear mi PC
              </Button>
            </Link>

            <Button variant="secondary">
              Explorar componentes
            </Button>
          </div>

          <div className="mt-16 grid grid-cols-3 gap-8">
            <div>
              <h3 className="text-3xl font-bold text-white">15K+</h3>
              <p className="text-zinc-500">Componentes</p>
            </div>

            <div>
              <h3 className="text-3xl font-bold text-white">100%</h3>
              <p className="text-zinc-500">Compatibilidad</p>
            </div>

            <div>
              <h3 className="text-3xl font-bold text-white">24/7</h3>
              <p className="text-zinc-500">Precios actualizados</p>
            </div>
          </div>
        </div>

        {/* Vista previa */}
        <div className="flex flex-1 justify-center">
          <div className="relative h-[520px] w-[520px]">
            <div className="absolute inset-0 rounded-full bg-[#A33715]/10 blur-[120px]" />

            <div className="absolute inset-10 rounded-3xl border border-[#394045] bg-[#20292D] shadow-2xl shadow-black/30">
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <div className="text-8xl">🖥️</div>

                  <h3 className="mt-6 text-2xl font-bold text-white">
                    Próximamente
                  </h3>

                  <p className="mt-3 px-8 text-zinc-400">
                    Aquí aparecerá el render 3D de un PC, una build o una
                    animación interactiva.
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
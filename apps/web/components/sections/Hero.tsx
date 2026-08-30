"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "../ui/Button";
import { fetchCatalogFromSupabase } from "@/lib/components/repository";

type CatalogState = "loading" | "ready" | "empty" | "error";

export function Hero() {
  const [state, setState] = useState<CatalogState>("loading");
  const [componentCount, setComponentCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCatalogStats = async () => {
      setState("loading");
      setError(null);
      const result = await fetchCatalogFromSupabase();

      if (result.success) {
        setComponentCount(result.data.length);
        setState(result.data.length === 0 ? "empty" : "ready");
      } else {
        console.error("Error loading catalog stats:", result.error);
        setError(result.error);
        setState("error");
      }
    };

    loadCatalogStats();
  }, []);

  const handleRetry = () => {
    setState("loading");
    setError(null);
    const loadCatalogStats = async () => {
      const result = await fetchCatalogFromSupabase();
      if (result.success) {
        setComponentCount(result.data.length);
        setState(result.data.length === 0 ? "empty" : "ready");
      } else {
        setError(result.error);
        setState("error");
      }
    };
    loadCatalogStats();
  };

  return (
    <section className="relative overflow-hidden bg-[#191923]">
      {/* Fondo */}
      <div className="absolute inset-0 bg-[#191923]" />

      {/* Luces */}
      <div className="absolute left-1/2 top-32 h-96 w-96 -translate-x-1/2 rounded-full bg-[#0E79B2]/8 blur-[140px]" />
      <div className="absolute right-20 top-52 h-72 w-72 rounded-full bg-[#0E79B2]/5 blur-[120px]" />

      <div className="relative mx-auto flex min-h-[90vh] max-w-7xl flex-col items-center gap-16 px-6 py-20 lg:flex-row">
        {/* Texto */}
        <div className="flex-1">
          <span className="rounded-full border border-[#0E79B2]/30 bg-[#0E79B2]/10 px-4 py-2 text-sm text-[#0E79B2]">
            La nueva forma de construir tu PC
          </span>

          <h1 className="mt-8 text-5xl font-black leading-tight text-[#FBFEF9] md:text-7xl">
            Arma el PC perfecto.
          </h1>

          <p className="mt-8 max-w-2xl text-xl leading-relaxed text-white/60">
            Compara componentes, verifica compatibilidad, revisa precios y crea
            builds increíbles desde un solo lugar.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/builder">
              <Button variant="primary">
                Crear mi PC
              </Button>
            </Link>

            <Link href="/components">
              <Button variant="secondary">
                Explorar componentes
              </Button>
            </Link>
          </div>

          {/* Catálogo Stats - desde Supabase */}
          <div className="mt-16 grid grid-cols-3 gap-8">
            {state === "loading" && (
              <div className="col-span-3">
                <p className="text-sm text-white/40">Cargando catálogo...</p>
              </div>
            )}

            {state === "error" && (
              <div className="col-span-3">
                <p className="text-sm text-red-400">{error}</p>
                <button
                  onClick={handleRetry}
                  className="mt-2 text-xs text-[#0E79B2] hover:underline"
                >
                  Reintentar
                </button>
              </div>
            )}

            {state === "empty" && (
              <div className="col-span-3">
                <p className="text-sm text-white/40">
                  El catálogo está siendo poblado
                </p>
              </div>
            )}

            {state === "ready" && (
              <>
                <div>
                  <h3 className="text-3xl font-bold text-[#FBFEF9]">
                    {componentCount}+
                  </h3>
                  <p className="text-white/60">Componentes en vivo</p>
                </div>

                <div>
                  <h3 className="text-3xl font-bold text-[#FBFEF9]">100%</h3>
                  <p className="text-white/60">Compatibilidad</p>
                </div>

                <div>
                  <h3 className="text-3xl font-bold text-[#FBFEF9]">24/7</h3>
                  <p className="text-white/60">Precios actualizados</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Vista previa */}
        <div className="flex flex-1 justify-center">
          <div className="relative h-[520px] w-[520px]">
            <div className="absolute inset-0 rounded-full bg-[#0E79B2]/10 blur-[120px]" />

            <div className="absolute inset-10 rounded-3xl border border-white/10 bg-white/5 shadow-2xl shadow-black/20">
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <div className="text-8xl">🖥️</div>

                  <h3 className="mt-6 text-2xl font-bold text-[#FBFEF9]">
                    Próximamente
                  </h3>

                  <p className="mt-3 px-8 text-white/60">
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
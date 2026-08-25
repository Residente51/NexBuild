import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import LoadBuildButton from "@/components/builder/LoadBuildButton";
import { CATEGORY_LABELS } from "@/lib/categories";
import type { ComponentCategory } from "@/lib/categories";
import type { BuildSelection } from "@/types/component";

export default async function SharedBuildPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  // Realiza la consulta a Supabase en el servidor
  const { data, error } = await supabase
    .from("saved_builds")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4 px-4 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-[#FBFEF9]">Configuración no encontrada</h1>
        <p className="max-w-md text-sm text-white/60">
          El enlace que intentas visitar no existe o ha expirado. Por favor verifica la URL.
        </p>
        <Link 
          href="/builder"
          className="mt-4 inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-6 py-2.5 text-sm font-medium text-[#FBFEF9] transition-colors hover:bg-white/10"
        >
          Ir al configurador
        </Link>
      </div>
    );
  }

  const buildData = data.build_data as BuildSelection;
  const totalPrice = data.total_price as number;
  
  // Formateo de fecha de creación (fallback por si no existiera)
  const createdAtString = data.created_at ? data.created_at : new Date().toISOString();
  const createdAt = new Date(createdAtString).toLocaleDateString("es-CL", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const slots: Exclude<ComponentCategory, "storage">[] = [
    "cpu", "motherboard", "ram", "gpu", "cooler", "psu", "case"
  ];

  return (
    <div className="container mx-auto max-w-3xl px-4 py-12 md:py-20">
      <div className="overflow-hidden rounded-2xl border border-zinc-800/50 bg-zinc-900/50 shadow-2xl backdrop-blur-md">
        {/* Encabezado */}
        <header className="border-b border-zinc-800/50 bg-zinc-900/30 p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#FBFEF9] md:text-3xl">
                Configuración Compartida
              </h1>
              <p suppressHydrationWarning className="mt-1 text-sm text-white/50">
                Creada el {createdAt}
              </p>
            </div>
            <div className="rounded-xl border border-[#0E79B2]/20 bg-[#0E79B2]/10 px-4 py-3 md:text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#0E79B2]/80">Precio Total</p>
              <p className="text-2xl font-bold tracking-tight text-[#0E79B2]">
                ${totalPrice.toLocaleString("es-CL")}
              </p>
            </div>
          </div>
        </header>

        {/* Lista de Componentes */}
        <div className="p-6 md:p-8">
          <div className="space-y-3">
            {slots.map((slot) => {
              const comp = buildData[slot];
              if (!comp) return null;
              
              return (
                <div 
                  key={slot} 
                  className="group flex flex-col justify-between gap-3 rounded-xl border border-white/5 bg-white/5 p-4 transition-colors hover:border-white/10 sm:flex-row sm:items-center"
                >
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wider text-white/40">
                      {CATEGORY_LABELS[slot]}
                    </p>
                    <p className="mt-1 font-medium text-[#FBFEF9]">{comp.name}</p>
                  </div>
                  <p className="font-semibold text-white/80">
                    ${comp.price.toLocaleString("es-CL")}
                  </p>
                </div>
              );
            })}
            
            {/* Almacenamiento (es un array) */}
            {buildData.storage?.map((storageComp, idx) => (
              <div 
                key={`storage-${idx}`} 
                className="group flex flex-col justify-between gap-3 rounded-xl border border-white/5 bg-white/5 p-4 transition-colors hover:border-white/10 sm:flex-row sm:items-center"
              >
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-white/40">
                    {CATEGORY_LABELS.storage}
                  </p>
                  <p className="mt-1 font-medium text-[#FBFEF9]">{storageComp.name}</p>
                </div>
                <p className="font-semibold text-white/80">
                  ${storageComp.price.toLocaleString("es-CL")}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <LoadBuildButton build={buildData} />
          </div>
        </div>
      </div>
    </div>
  );
}

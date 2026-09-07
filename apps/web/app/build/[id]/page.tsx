import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { calculateBuildPrice } from "@/lib/build/totals";
import { parseBuildSelection } from "@/lib/components/validation";
import { notFound } from "next/navigation";
import LoadBuildButton from "@/components/builder/LoadBuildButton";
import { CATEGORY_LABELS } from "@/lib/categories";
import type { ComponentCategory } from "@/lib/categories";

export default async function SharedBuildPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  let data: {
    build_data: unknown;
    created_at: string | null;
  } | null = null;
  let hasError = false;

  try {
    const supabase = createSupabaseAdminClient();
    const result = await supabase
      .from("saved_builds")
      .select("build_data, created_at")
      .eq("id", id)
      .single();
    data = result.data;
    hasError = Boolean(result.error);
  } catch (error) {
    console.error("Unable to load shared build:", error);
    hasError = true;
  }

  const buildData = parseBuildSelection(data?.build_data);
  if (hasError || !data || !buildData) {
    notFound();
  }

  const totalPrice = calculateBuildPrice(buildData);
  
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

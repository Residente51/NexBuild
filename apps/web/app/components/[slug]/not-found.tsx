import Link from "next/link";
import { buttonClassName } from "@/components/ui/Button";

export default function ComponentNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-bold tracking-tight text-[#FBFEF9]">
        Componente no encontrado
      </h1>
      <p className="max-w-md text-sm text-white/60">
        El componente no existe o ya no está disponible en el catálogo.
      </p>
      <Link
        href="/components"
        className={buttonClassName("secondary", "mt-2")}
      >
        Volver al catálogo
      </Link>
    </div>
  );
}

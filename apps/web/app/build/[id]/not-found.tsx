import Link from "next/link";

export default function SharedBuildNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4 px-4 text-center">
      <h1 className="text-2xl font-bold tracking-tight text-[#FBFEF9]">
        Configuración no encontrada
      </h1>
      <p className="max-w-md text-sm text-white/60">
        El enlace que intentas visitar no existe o ya no está disponible. Verifica la URL.
      </p>
      <Link
        href="/builder"
        className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-6 py-2.5 text-sm font-medium text-[#FBFEF9] transition-colors hover:bg-white/10"
      >
        Ir al configurador
      </Link>
    </div>
  );
}

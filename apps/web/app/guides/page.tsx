import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Guías de armado",
  description:
    "Aprende a elegir componentes y armar tu PC con las guías de NexBuild.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function GuidesPage() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-builder-bg">
      <div className="text-center">
        <h1 className="text-4xl font-black text-white">Guías de Armado</h1>
        <p className="mt-4 text-zinc-400">Próximamente...</p>
      </div>
    </div>
  );
}

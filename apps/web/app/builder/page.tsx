import type { Metadata } from "next";

import { PCBuilderView } from "@/components/builder/PCBuilderView";

export const metadata: Metadata = {
  title: "Armador de PC",
  description:
    "Arma tu PC paso a paso y revisa compatibilidad, consumo estimado y precio.",
};

export default function BuilderPage() {
  return (
    <div className="min-h-screen bg-builder-bg">
      <PCBuilderView />
    </div>
  );
}

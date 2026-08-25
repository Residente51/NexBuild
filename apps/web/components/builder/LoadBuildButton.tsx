"use client";

import { useBuildStore } from "@/store/useBuildStore";
import { useRouter } from "next/navigation";
import type { BuildSelection } from "@/types/component";

export default function LoadBuildButton({ build }: { build: BuildSelection }) {
  const router = useRouter();
  const loadBuild = useBuildStore((state) => state.loadBuild);

  const handleLoad = () => {
    loadBuild(build);
    router.push("/builder");
  };

  return (
    <button
      onClick={handleLoad}
      className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#0E79B2]/30 bg-[#0E79B2]/10 px-4 py-3.5 text-sm font-medium text-[#0E79B2] transition-colors hover:bg-[#0E79B2]/20"
    >
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
      </svg>
      Cargar en mi configurador
    </button>
  );
}

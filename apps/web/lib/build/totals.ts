import type { BuildSelection } from "@/types/component";

export function calculateBuildPrice(build: BuildSelection): number {
  const singleSlotTotal = [
    build.cpu,
    build.motherboard,
    build.ram,
    build.gpu,
    build.case,
    build.cooler,
    build.psu,
  ].reduce((total, component) => total + (component?.price ?? 0), 0);

  return build.storage.reduce(
    (total, component) => total + component.price,
    singleSlotTotal,
  );
}

export function countBuildComponents(build: BuildSelection): number {
  const singleSlotCount = [
    build.cpu,
    build.motherboard,
    build.ram,
    build.gpu,
    build.case,
    build.cooler,
    build.psu,
  ].filter(Boolean).length;

  return singleSlotCount + build.storage.length;
}

import { describe, expect, it } from "vitest";
import {
  cpuRyzen7_7700X,
  mbMsiB650TomahawkWifi,
  storageNvme,
} from "@/lib/seedData";
import {
  calculateBuildPrice,
  countBuildComponents,
} from "@/lib/build/totals";
import type { BuildSelection } from "@/types/component";

describe("build totals", () => {
  const build: BuildSelection = {
    cpu: cpuRyzen7_7700X,
    motherboard: mbMsiB650TomahawkWifi,
    storage: [storageNvme, { ...storageNvme, id: "second-storage" }],
  };

  it("suma el precio de slots simples y almacenamiento", () => {
    expect(calculateBuildPrice(build)).toBe(
      cpuRyzen7_7700X.price +
        mbMsiB650TomahawkWifi.price +
        storageNvme.price * 2,
    );
  });

  it("cuenta cada pieza seleccionada", () => {
    expect(countBuildComponents(build)).toBe(4);
  });
});

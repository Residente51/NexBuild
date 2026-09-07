import { beforeEach, describe, expect, it, vi } from "vitest";
import { saveBuild } from "./saveBuild";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

vi.mock("@/lib/supabaseAdmin", () => ({
  createSupabaseAdminClient: vi.fn(),
}));

const cpuRow = {
  id: "cpu-id",
  slug: "test-cpu",
  name: "Test CPU",
  brand: "Test",
  category: "cpu",
  specs: {
    socket: "AM5",
    tdp: 65,
    hasIntegratedGraphics: true,
    includesCooler: true,
  },
  is_active: true,
  store_listings: [{ price_cash: 100_000, in_stock: true }],
};

function installClient(products: unknown[]) {
  const productEq = vi.fn().mockResolvedValue({ data: products, error: null });
  const productIn = vi.fn().mockReturnValue({ eq: productEq });
  const productSelect = vi.fn().mockReturnValue({ in: productIn });

  const single = vi.fn().mockResolvedValue({
    data: { id: "build-id" },
    error: null,
  });
  const buildSelect = vi.fn().mockReturnValue({ single });
  const insert = vi.fn().mockReturnValue({ select: buildSelect });
  const from = vi.fn((table: string) =>
    table === "products" ? { select: productSelect } : { insert },
  );

  vi.mocked(createSupabaseAdminClient).mockReturnValue({ from } as never);
  return { from, productIn, insert };
}

describe("saveBuild", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rechaza builds vacías antes de consultar Supabase", async () => {
    await expect(saveBuild({})).resolves.toEqual({
      error: "Agrega al menos un componente antes de guardar.",
    });
    expect(createSupabaseAdminClient).not.toHaveBeenCalled();
  });

  it("consulta solo IDs seleccionados y guarda un snapshot validado", async () => {
    const { productIn, insert } = installClient([cpuRow]);

    await expect(saveBuild({ cpu: "cpu-id" })).resolves.toEqual({
      id: "build-id",
    });
    expect(productIn).toHaveBeenCalledWith("id", ["cpu-id"]);
    expect(insert).toHaveBeenCalledWith({
      build_data: expect.objectContaining({
        cpu: expect.objectContaining({ id: "cpu-id", category: "cpu" }),
        storage: [],
      }),
      total_price: 100_000,
    });
  });

  it("rechaza IDs que ya no existen", async () => {
    const { insert } = installClient([]);

    await expect(saveBuild({ cpu: "missing-id" })).resolves.toEqual({
      error: "Uno o más componentes ya no están disponibles.",
    });
    expect(insert).not.toHaveBeenCalled();
  });

  it("no guarda componentes sin stock", async () => {
    const { insert } = installClient([
      {
        ...cpuRow,
        store_listings: [{ price_cash: 100_000, in_stock: false }],
      },
    ]);

    await expect(saveBuild({ cpu: "cpu-id" })).resolves.toEqual({
      error: "Uno o más componentes están sin stock.",
    });
    expect(insert).not.toHaveBeenCalled();
  });

  it("limita la cantidad de unidades de almacenamiento", async () => {
    await expect(
      saveBuild({ storage: Array.from({ length: 9 }, (_, index) => `id-${index}`) }),
    ).resolves.toEqual({
      error: "Puedes guardar hasta 8 unidades de almacenamiento.",
    });
  });
});

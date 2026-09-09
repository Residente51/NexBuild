import { beforeEach, describe, expect, it, vi } from "vitest";
import { saveBuild } from "./saveBuild";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: vi.fn(),
}));

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

function installClient(products: unknown[], userId: string | null = null) {
  const productEq = vi.fn().mockResolvedValue({ data: products, error: null });
  const productIn = vi.fn().mockReturnValue({ eq: productEq });
  const productSelect = vi.fn().mockReturnValue({ in: productIn });

  const single = vi.fn().mockResolvedValue({
    data: { id: "build-id" },
    error: null,
  });
  const buildSelect = vi.fn().mockReturnValue({ single });
  const insert = vi.fn().mockReturnValue({ select: buildSelect });
  const adminFrom = vi.fn((table: string) =>
    table === "products" ? { select: productSelect } : { insert },
  );
  const requestFrom = vi.fn(() => ({ select: productSelect }));
  const getUser = vi.fn().mockResolvedValue({
    data: { user: userId ? { id: userId } : null },
    error: null,
  });

  vi.mocked(createSupabaseAdminClient).mockReturnValue({ from: adminFrom } as never);
  vi.mocked(createServerSupabaseClient).mockResolvedValue({
    auth: { getUser },
    ...(userId ? { from: requestFrom } : {}),
  } as never);
  return { adminFrom, requestFrom, getUser, productIn, insert };
}

describe("saveBuild", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rechaza builds vacías antes de consultar Supabase", async () => {
    await expect(saveBuild({})).resolves.toEqual({
      error: "Agrega al menos un componente antes de guardar.",
    });
    expect(createSupabaseAdminClient).not.toHaveBeenCalled();
    expect(createServerSupabaseClient).not.toHaveBeenCalled();
  });

  it("conserva el guardado anónimo sin asignar propietario", async () => {
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
    expect(createSupabaseAdminClient).toHaveBeenCalledOnce();
  });

  it("guarda sesiones autenticadas con su propietario mediante el cliente server-only", async () => {
    const ownerId = "11111111-1111-4111-8111-111111111111";
    const { adminFrom, requestFrom, insert } = installClient([cpuRow], ownerId);

    await expect(saveBuild({ cpu: "cpu-id" })).resolves.toEqual({
      id: "build-id",
    });
    expect(createSupabaseAdminClient).toHaveBeenCalledOnce();
    expect(requestFrom).toHaveBeenCalledWith("products");
    expect(adminFrom).toHaveBeenCalledWith("saved_builds");
    expect(insert).toHaveBeenCalledWith({
      user_id: ownerId,
      build_data: expect.objectContaining({
        cpu: expect.objectContaining({ id: "cpu-id", category: "cpu" }),
        storage: [],
      }),
      total_price: 100_000,
    });
  });

  it("rechaza identidad y precios enviados por el cliente", async () => {
    await expect(
      saveBuild({
        cpu: "cpu-id",
        user_id: "attacker",
        total_price: 1,
      } as never),
    ).resolves.toEqual({
      error: "La configuración contiene campos desconocidos.",
    });
    expect(createServerSupabaseClient).not.toHaveBeenCalled();
    expect(createSupabaseAdminClient).not.toHaveBeenCalled();
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

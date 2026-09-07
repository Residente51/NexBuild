import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchCatalogFromSupabase } from "@/lib/components/repository";
import { getSupabasePublicClient } from "@/lib/supabaseClient";

const { fromMock } = vi.hoisted(() => ({ fromMock: vi.fn() }));

vi.mock("@/lib/supabaseClient", () => ({
  getSupabasePublicClient: vi.fn(() => ({ from: fromMock })),
}));

const mockSupabaseProduct = {
  id: "1",
  slug: "test-cpu",
  name: "Test CPU",
  brand: "Test Brand",
  category: "cpu",
  specs: {
    socket: "AM5",
    tdp: 105,
    hasIntegratedGraphics: true,
    includesCooler: false,
  },
  image_url: "https://example.com/cpu.jpg",
  description: "Procesador de prueba",
  is_active: true,
  store_listings: [
    {
      price_cash: 299_990,
      product_url: "https://example.com/cpu",
      in_stock: true,
      updated_at: "2026-09-06T00:00:00.000Z",
    },
  ],
};

function mockQueryResult(result: unknown, reject = false) {
  const order = reject
    ? vi.fn().mockRejectedValue(result)
    : vi.fn().mockResolvedValue(result);
  const select = vi.fn().mockReturnValue({ order });
  fromMock.mockReturnValue({ select });
}

describe("fetchCatalogFromSupabase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSupabasePublicClient).mockReturnValue({ from: fromMock } as never);
  });

  it("valida y mapea productos", async () => {
    mockQueryResult({ data: [mockSupabaseProduct], error: null });

    const result = await fetchCatalogFromSupabase();

    expect(result).toEqual({
      success: true,
      data: [
        expect.objectContaining({
          id: "1",
          name: "Test CPU",
          price: 299_990,
          description: "Procesador de prueba",
          productUrl: "https://example.com/cpu",
          inStock: true,
        }),
      ],
    });
  });

  it("elige el menor precio con stock antes que uno agotado", async () => {
    mockQueryResult({
      data: [
        {
          ...mockSupabaseProduct,
          store_listings: [
            { price_cash: 250_000, in_stock: false },
            { price_cash: 310_000, in_stock: true },
            { price_cash: 299_000, in_stock: true },
          ],
        },
      ],
      error: null,
    });

    const result = await fetchCatalogFromSupabase();
    expect(result.success && result.data[0].price).toBe(299_000);
  });

  it("conserva el precio referencial pero marca productos sin stock", async () => {
    mockQueryResult({
      data: [
        {
          ...mockSupabaseProduct,
          store_listings: [
            { price_cash: 250_000, in_stock: false, product_url: "https://example.com/old" },
          ],
        },
      ],
      error: null,
    });

    const result = await fetchCatalogFromSupabase();
    expect(result.success && result.data[0]).toEqual(
      expect.objectContaining({ price: 250_000, inStock: false }),
    );
  });

  it("descarta URLs con protocolos inseguros", async () => {
    mockQueryResult({
      data: [
        {
          ...mockSupabaseProduct,
          image_url: "javascript:alert(1)",
          store_listings: [
            {
              price_cash: 299_990,
              in_stock: true,
              product_url: "javascript:alert(1)",
            },
          ],
        },
      ],
      error: null,
    });

    const result = await fetchCatalogFromSupabase();
    expect(result.success && result.data[0]).toEqual(
      expect.objectContaining({ image: undefined, productUrl: undefined }),
    );
  });

  it("devuelve éxito con catálogo vacío", async () => {
    mockQueryResult({ data: [], error: null });
    await expect(fetchCatalogFromSupabase()).resolves.toEqual({
      success: true,
      data: [],
    });
  });

  it("no expone el mensaje interno de Supabase", async () => {
    mockQueryResult({
      data: null,
      error: { message: "sensitive database detail" },
    });

    await expect(fetchCatalogFromSupabase()).resolves.toEqual({
      success: false,
      error: "No pudimos cargar el catálogo. Intenta nuevamente.",
    });
  });

  it("rechaza filas que no cumplen el modelo de dominio", async () => {
    mockQueryResult({
      data: [{ ...mockSupabaseProduct, category: "unknown" }],
      error: null,
    });

    await expect(fetchCatalogFromSupabase()).resolves.toEqual({
      success: false,
      error: "El catálogo contiene datos inválidos.",
    });
  });

  it("convierte excepciones de red en un error seguro", async () => {
    mockQueryResult(new Error("private network error"), true);

    await expect(fetchCatalogFromSupabase()).resolves.toEqual({
      success: false,
      error: "No pudimos conectar con el catálogo. Intenta nuevamente.",
    });
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchCatalogFromSupabase } from "@/lib/components/repository";
import { supabase } from "@/lib/supabaseClient";

vi.mock("@/lib/supabaseClient", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

const mockSupabaseProduct = {
  id: "1",
  slug: "test-cpu",
  name: "Test CPU",
  brand: "Test Brand",
  category: "cpu",
  specs: { socket: "AM5", tdp: 105 },
  image_url: "https://example.com/cpu.jpg",
  store_listings: [{ price_cash: 299.99, product_url: "https://example.com" }],
};

describe("fetchCatalogFromSupabase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("devuelve éxito con productos cuando Supabase retorna datos", async () => {
    const mockSelect = vi.fn().mockResolvedValue({
      data: [mockSupabaseProduct],
      error: null,
    });

    const fromMock = supabase.from as ReturnType<typeof vi.fn>;
    fromMock.mockReturnValue({ select: mockSelect });

    const result = await fetchCatalogFromSupabase();

    expect(result).toEqual({
      success: true,
      data: expect.arrayContaining([
        expect.objectContaining({
          id: "1",
          name: "Test CPU",
          brand: "Test Brand",
          price: 299.99,
          image: "https://example.com/cpu.jpg",
        }),
      ]),
    });
  });

  it("devuelve éxito con array vacío cuando Supabase retorna []", async () => {
    const mockSelect = vi.fn().mockResolvedValue({
      data: [],
      error: null,
    });

    const fromMock = supabase.from as ReturnType<typeof vi.fn>;
    fromMock.mockReturnValue({ select: mockSelect });

    const result = await fetchCatalogFromSupabase();

    expect(result).toEqual({
      success: true,
      data: [],
    });
  });

  it("devuelve error cuando Supabase retorna un error", async () => {
    const mockError = {
      message: "Database connection failed",
      code: "PGSQL_ERROR",
    };

    const mockSelect = vi.fn().mockResolvedValue({
      data: null,
      error: mockError,
    });

    const fromMock = supabase.from as ReturnType<typeof vi.fn>;
    fromMock.mockReturnValue({ select: mockSelect });

    const result = await fetchCatalogFromSupabase();

    expect(result).toEqual({
      success: false,
      error: "Database connection failed",
    });
  });

  it("devuelve error cuando data es null sin error explícito", async () => {
    const mockSelect = vi.fn().mockResolvedValue({
      data: null,
      error: null,
    });

    const fromMock = supabase.from as ReturnType<typeof vi.fn>;
    fromMock.mockReturnValue({ select: mockSelect });

    const result = await fetchCatalogFromSupabase();

    expect(result).toEqual({
      success: false,
      error: "No se recibieron datos del servidor",
    });
  });

  it("devuelve error cuando se lanza una excepción", async () => {
    const mockError = new Error("Network error");
    const mockSelect = vi.fn().mockRejectedValue(mockError);

    const fromMock = supabase.from as ReturnType<typeof vi.fn>;
    fromMock.mockReturnValue({ select: mockSelect });

    const result = await fetchCatalogFromSupabase();

    expect(result).toEqual({
      success: false,
      error: "Network error",
    });
  });

  it("mapea correctamente los precios por defecto cuando no hay store_listings", async () => {
    const productWithoutListing = {
      ...mockSupabaseProduct,
      store_listings: [],
    };

    const mockSelect = vi.fn().mockResolvedValue({
      data: [productWithoutListing],
      error: null,
    });

    const fromMock = supabase.from as ReturnType<typeof vi.fn>;
    fromMock.mockReturnValue({ select: mockSelect });

    const result = await fetchCatalogFromSupabase();

    expect(result).toEqual({
      success: true,
      data: expect.arrayContaining([
        expect.objectContaining({
          price: 0,
        }),
      ]),
    });
  });
});

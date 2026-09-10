import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import BuildsPage from "./page";
import { listOwnedBuilds } from "@/lib/build/savedBuilds";
import { createServerSupabaseClient } from "@/lib/supabase/server";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((destination: string) => {
    throw new Error(`NEXT_REDIRECT:${destination}`);
  }),
}));

vi.mock("@/components/builder/LoadBuildButton", () => ({
  default: () => null,
}));

vi.mock("@/components/builds/SavedBuildActions", () => ({
  SavedBuildActions: () => null,
}));

vi.mock("@/lib/build/savedBuilds", () => ({
  listOwnedBuilds: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: vi.fn(),
}));

const BUILD_ID = "11111111-1111-4111-8111-111111111111";

const cpu = {
  id: "cpu-id",
  slug: "test-cpu",
  name: "Ryzen de prueba",
  brand: "AMD",
  category: "cpu" as const,
  price: 100_000,
  specs: {
    socket: "AM5",
    tdp: 65,
    hasIntegratedGraphics: true,
    includesCooler: true,
  },
};

function installSession(user: { id: string } | null, error: unknown = null) {
  const client = {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user }, error }),
    },
  };
  vi.mocked(createServerSupabaseClient).mockResolvedValue(client as never);
  return client;
}

describe("BuildsPage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("redirige sesiones anónimas a login con un retorno interno seguro", async () => {
    installSession(null);

    await expect(BuildsPage()).rejects.toThrow(
      "NEXT_REDIRECT:/login?next=%2Fbuilds",
    );
    expect(listOwnedBuilds).not.toHaveBeenCalled();
  });

  it("muestra el estado vacío autenticado con CTA al configurador", async () => {
    const client = installSession({ id: "owner-id" });
    vi.mocked(listOwnedBuilds).mockResolvedValue({ success: true, data: [] });

    const markup = renderToStaticMarkup(await BuildsPage());

    expect(listOwnedBuilds).toHaveBeenCalledWith(client);
    expect(markup).toContain("Aún no tienes armados guardados");
    expect(markup).toContain('href="/builder"');
    expect(markup).not.toContain("owner-id");
  });

  it("renderiza nombre, fallback, fechas, precio, progreso y componentes", async () => {
    installSession({ id: "owner-id" });
    vi.mocked(listOwnedBuilds).mockResolvedValue({
      success: true,
      data: [
        {
          id: BUILD_ID,
          name: "Mi PC",
          totalPrice: 100_000,
          createdAt: "2026-09-08T12:00:00.000Z",
          updatedAt: "2026-09-09T12:00:00.000Z",
          build: { cpu, storage: [] },
        },
        {
          id: "22222222-2222-4222-8222-222222222222",
          name: null,
          totalPrice: 0,
          createdAt: "2026-09-07T12:00:00.000Z",
          updatedAt: "2026-09-07T12:00:00.000Z",
          build: { storage: [] },
        },
      ],
    });

    const markup = renderToStaticMarkup(await BuildsPage());

    expect(markup).toContain("Mi PC");
    expect(markup).toContain("Configuración sin nombre");
    expect(markup).toContain("Ryzen de prueba");
    expect(markup).toContain("100.000");
    expect(markup).toContain("1 de 6 partes requeridas");
    expect(markup).toContain('aria-valuenow="17"');
    expect(markup).toContain("Creado:");
    expect(markup).toContain("Actualizado:");
    expect(markup).not.toContain("owner-id");
  });

  it("presenta los errores de carga del repositorio owner-scoped", async () => {
    installSession({ id: "owner-id" });
    vi.mocked(listOwnedBuilds).mockResolvedValue({
      success: false,
      error: "No pudimos cargar tus configuraciones.",
    });

    const markup = renderToStaticMarkup(await BuildsPage());

    expect(markup).toContain('role="alert"');
    expect(markup).toContain("No pudimos cargar tus configuraciones.");
  });
});

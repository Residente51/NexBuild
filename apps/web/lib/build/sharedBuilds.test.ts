import { beforeEach, describe, expect, it, vi } from "vitest";
import { readSharedBuild } from "./sharedBuilds";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

vi.mock("@/lib/supabaseAdmin", () => ({
  createSupabaseAdminClient: vi.fn(),
}));

const cpu = {
  id: "cpu-id",
  slug: "test-cpu",
  name: "Test CPU",
  brand: "Test",
  category: "cpu",
  price: 100_000,
  specs: {
    socket: "AM5",
    tdp: 65,
    hasIntegratedGraphics: true,
    includesCooler: true,
  },
};

describe("shared build reads", () => {
  beforeEach(() => vi.clearAllMocks());

  function installRead(data: unknown, error: unknown = null) {
    const single = vi.fn().mockResolvedValue({ data, error });
    const eq = vi.fn().mockReturnValue({ single });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });
    vi.mocked(createSupabaseAdminClient).mockReturnValue({ from } as never);
    return { select, eq };
  }

  it("preserva la lectura por enlace sin seleccionar la identidad del owner", async () => {
    const { select, eq } = installRead({
      build_data: { cpu, storage: [] },
      created_at: "2026-09-09T12:00:00.000Z",
    });

    await expect(readSharedBuild("shared-id")).resolves.toEqual({
      build: { cpu, storage: [] },
      createdAt: "2026-09-09T12:00:00.000Z",
    });
    expect(select).toHaveBeenCalledWith("build_data, created_at");
    expect(eq).toHaveBeenCalledWith("id", "shared-id");
  });

  it("oculta enlaces inexistentes o snapshots inválidos", async () => {
    installRead({ build_data: { storage: "invalid" }, created_at: null });
    await expect(readSharedBuild("invalid-id")).resolves.toBeNull();
  });
});

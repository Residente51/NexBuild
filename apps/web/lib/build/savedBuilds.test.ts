import { describe, expect, it, vi } from "vitest";
import {
  deleteOwnedBuild,
  duplicateOwnedBuild,
  listOwnedBuilds,
  normalizeBuildName,
  readOwnedBuild,
  renameOwnedBuild,
} from "./savedBuilds";

const BUILD_ID = "11111111-1111-4111-8111-111111111111";
const COPY_ID = "22222222-2222-4222-8222-222222222222";
const OWNER_ID = "33333333-3333-4333-8333-333333333333";
const NOW = "2026-09-09T12:00:00.000Z";

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

const savedRow = {
  id: BUILD_ID,
  name: "Mi PC",
  build_data: { cpu, storage: [] },
  total_price: 1,
  created_at: NOW,
  updated_at: NOW,
};

describe("owned build repository", () => {
  it("lista solo mediante la visibilidad RLS del cliente recibido", async () => {
    const order = vi.fn().mockResolvedValue({ data: [savedRow], error: null });
    const select = vi.fn().mockReturnValue({ order });
    const from = vi.fn().mockReturnValue({ select });

    await expect(listOwnedBuilds({ from } as never)).resolves.toEqual({
      success: true,
      data: [
        {
          id: BUILD_ID,
          name: "Mi PC",
          totalPrice: 1,
          createdAt: NOW,
          updatedAt: NOW,
          build: { cpu, storage: [] },
        },
      ],
    });
    expect(from).toHaveBeenCalledWith("saved_builds");
    expect(select).toHaveBeenCalledWith(
      "id, name, build_data, total_price, created_at, updated_at",
    );
    expect(order).toHaveBeenCalledWith("updated_at", { ascending: false });
  });

  it("lee un ID exacto y valida el snapshot almacenado", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: savedRow, error: null });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });

    const result = await readOwnedBuild({ from } as never, BUILD_ID);

    expect(result.success && result.data?.build.cpu?.id).toBe("cpu-id");
    expect(eq).toHaveBeenCalledWith("id", BUILD_ID);
  });

  it("rechaza un snapshot inválido antes de duplicarlo", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: { ...savedRow, build_data: { storage: "not-an-array" } },
      error: null,
    });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });

    await expect(
      duplicateOwnedBuild(
        { from } as never,
        { from: vi.fn() } as never,
        BUILD_ID,
        OWNER_ID,
      ),
    ).resolves.toEqual({
      success: false,
      error: "La configuración guardada tiene datos inválidos.",
    });
    expect(from).toHaveBeenCalledTimes(1);
  });

  it("duplica desde la selección owner-only y recalcula el precio", async () => {
    const sourceSingle = vi.fn().mockResolvedValue({ data: savedRow, error: null });
    const sourceEq = vi.fn().mockReturnValue({ maybeSingle: sourceSingle });
    const sourceSelect = vi.fn().mockReturnValue({ eq: sourceEq });
    const insertedSingle = vi.fn().mockResolvedValue({
      data: { id: COPY_ID },
      error: null,
    });
    const insertedSelect = vi.fn().mockReturnValue({ single: insertedSingle });
    const insert = vi.fn().mockReturnValue({ select: insertedSelect });
    const readFrom = vi.fn().mockReturnValue({ select: sourceSelect });
    const writeFrom = vi.fn().mockReturnValue({ insert });

    await expect(
      duplicateOwnedBuild(
        { from: readFrom } as never,
        { from: writeFrom } as never,
        BUILD_ID,
        OWNER_ID,
      ),
    ).resolves.toEqual({ success: true, data: { id: COPY_ID } });
    expect(readFrom).toHaveBeenCalledWith("saved_builds");
    expect(writeFrom).toHaveBeenCalledWith("saved_builds");
    expect(sourceEq).toHaveBeenCalledWith("id", BUILD_ID);
    expect(insert).toHaveBeenCalledWith({
      user_id: OWNER_ID,
      name: "Mi PC",
      build_data: expect.objectContaining({
        cpu: expect.objectContaining({ id: "cpu-id" }),
        storage: [],
      }),
      total_price: 100_000,
    });
  });

  it("recorta el nombre y rechaza largos o caracteres de control", () => {
    expect(normalizeBuildName("  Equipo oficina  ")).toEqual({
      success: true,
      data: "Equipo oficina",
    });
    expect(normalizeBuildName("a".repeat(81))).toEqual({
      success: false,
      error: "El nombre puede tener hasta 80 caracteres.",
    });
    expect(normalizeBuildName("Equipo\ninyectado")).toEqual({
      success: false,
      error: "El nombre contiene caracteres no permitidos.",
    });
  });

  it("renombra con el valor normalizado", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: { id: BUILD_ID, name: "Equipo oficina" },
      error: null,
    });
    const select = vi.fn().mockReturnValue({ maybeSingle });
    const eq = vi.fn().mockReturnValue({ select });
    const update = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ update });

    await expect(
      renameOwnedBuild({ from } as never, BUILD_ID, "  Equipo oficina  "),
    ).resolves.toEqual({
      success: true,
      data: { id: BUILD_ID, name: "Equipo oficina" },
    });
    expect(update).toHaveBeenCalledWith({ name: "Equipo oficina" });
  });

  it("elimina únicamente el ID exacto visible para el owner", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: { id: BUILD_ID },
      error: null,
    });
    const select = vi.fn().mockReturnValue({ maybeSingle });
    const eq = vi.fn().mockReturnValue({ select });
    const deleteQuery = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ delete: deleteQuery });

    await expect(
      deleteOwnedBuild({ from } as never, BUILD_ID),
    ).resolves.toEqual({ success: true, data: { id: BUILD_ID } });
    expect(eq).toHaveBeenCalledWith("id", BUILD_ID);
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  deleteOwnedBuild,
  duplicateOwnedBuild,
  listOwnedBuilds,
  readOwnedBuild,
  renameOwnedBuild,
} from "./ownedBuilds";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import * as repository from "@/lib/build/savedBuilds";

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: vi.fn(),
}));

vi.mock("@/lib/supabaseAdmin", () => ({
  createSupabaseAdminClient: vi.fn(),
}));

vi.mock("@/lib/build/savedBuilds", () => ({
  deleteOwnedBuild: vi.fn(),
  duplicateOwnedBuild: vi.fn(),
  listOwnedBuilds: vi.fn(),
  readOwnedBuild: vi.fn(),
  renameOwnedBuild: vi.fn(),
}));

const BUILD_ID = "11111111-1111-4111-8111-111111111111";
const OWNER_ID = "33333333-3333-4333-8333-333333333333";
const AUTH_ERROR = "Debes iniciar sesión para administrar tus configuraciones.";

describe("owned build actions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deniega todas las operaciones sin una sesión autenticada", async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
    } as never);

    await expect(listOwnedBuilds()).resolves.toEqual({
      success: false,
      error: AUTH_ERROR,
    });
    await expect(readOwnedBuild(BUILD_ID)).resolves.toEqual({
      success: false,
      error: AUTH_ERROR,
    });
    await expect(renameOwnedBuild(BUILD_ID, "Nombre")).resolves.toEqual({
      success: false,
      error: AUTH_ERROR,
    });
    await expect(duplicateOwnedBuild(BUILD_ID)).resolves.toEqual({
      success: false,
      error: AUTH_ERROR,
    });
    await expect(deleteOwnedBuild(BUILD_ID)).resolves.toEqual({
      success: false,
      error: AUTH_ERROR,
    });
    expect(repository.listOwnedBuilds).not.toHaveBeenCalled();
    expect(repository.readOwnedBuild).not.toHaveBeenCalled();
    expect(repository.renameOwnedBuild).not.toHaveBeenCalled();
    expect(repository.duplicateOwnedBuild).not.toHaveBeenCalled();
    expect(repository.deleteOwnedBuild).not.toHaveBeenCalled();
  });

  it("delega con el mismo cliente request-scoped y el auth.uid verificado", async () => {
    const client = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: OWNER_ID } },
          error: null,
        }),
      },
    };
    vi.mocked(createServerSupabaseClient).mockResolvedValue(client as never);
    const adminClient = { from: vi.fn() };
    vi.mocked(createSupabaseAdminClient).mockReturnValue(adminClient as never);
    vi.mocked(repository.duplicateOwnedBuild).mockResolvedValue({
      success: true,
      data: { id: BUILD_ID },
    });

    await expect(duplicateOwnedBuild(BUILD_ID)).resolves.toEqual({
      success: true,
      data: { id: BUILD_ID },
    });
    expect(repository.duplicateOwnedBuild).toHaveBeenCalledWith(
      client,
      adminClient,
      BUILD_ID,
      OWNER_ID,
    );
  });
});

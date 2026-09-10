import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  BuildMutationError,
  performSavedBuildMutation,
  SavedBuildActions,
} from "./SavedBuildActions";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/app/actions/ownedBuilds", () => ({
  deleteOwnedBuild: vi.fn(),
  duplicateOwnedBuild: vi.fn(),
  renameOwnedBuild: vi.fn(),
}));

const BUILD_ID = "11111111-1111-4111-8111-111111111111";

function createActions() {
  return {
    rename: vi.fn().mockResolvedValue({ success: true, data: {} }),
    duplicate: vi.fn().mockResolvedValue({ success: true, data: {} }),
    delete: vi.fn().mockResolvedValue({ success: true, data: {} }),
  };
}

describe("SavedBuildActions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("envía solo ID y nombre al renombrar", async () => {
    const actions = createActions();

    await performSavedBuildMutation(
      { type: "rename", id: BUILD_ID, name: "Equipo oficina" },
      actions,
    );

    expect(actions.rename).toHaveBeenCalledWith(BUILD_ID, "Equipo oficina");
  });

  it("duplica enviando solo el ID, nunca el JSON canónico", async () => {
    const actions = createActions();

    await performSavedBuildMutation(
      { type: "duplicate", id: BUILD_ID },
      actions,
    );

    expect(actions.duplicate).toHaveBeenCalledWith(BUILD_ID);
  });

  it("incluye confirmación accesible y ejecuta delete por ID", async () => {
    const markup = renderToStaticMarkup(
      createElement(SavedBuildActions, {
        buildId: BUILD_ID,
        buildName: "Mi PC",
      }),
    );
    const actions = createActions();

    await performSavedBuildMutation({ type: "delete", id: BUILD_ID }, actions);

    expect(markup).toContain("aria-labelledby=");
    expect(markup).toContain("¿Eliminar esta configuración?");
    expect(markup).toContain("Sí, eliminar");
    expect(actions.delete).toHaveBeenCalledWith(BUILD_ID);
  });

  it("conserva y presenta los errores de mutación", async () => {
    const actions = createActions();
    actions.duplicate.mockResolvedValue({
      success: false,
      error: "No pudimos duplicar la configuración.",
    });

    const result = await performSavedBuildMutation(
      { type: "duplicate", id: BUILD_ID },
      actions,
    );
    const markup = renderToStaticMarkup(
      createElement(BuildMutationError, {
        message: result.success ? null : result.error,
      }),
    );

    expect(result).toEqual({
      success: false,
      error: "No pudimos duplicar la configuración.",
    });
    expect(markup).toContain('role="alert"');
    expect(markup).toContain("No pudimos duplicar la configuración.");
  });

  it("convierte fallas inesperadas en un mensaje visible y accionable", async () => {
    const actions = createActions();
    actions.rename.mockRejectedValue(new Error("network failure"));

    const result = await performSavedBuildMutation(
      { type: "rename", id: BUILD_ID, name: "Mi PC" },
      actions,
    );

    expect(result).toEqual({
      success: false,
      error: "No pudimos completar la acción. Intenta nuevamente.",
    });
  });
});

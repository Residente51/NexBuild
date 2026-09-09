import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { handleAuthCallback } from "./route";

function createAuthClient(error: unknown | null = null) {
  const exchangeCodeForSession = vi.fn(async () => ({ error }));

  return {
    exchangeCodeForSession,
    factory: async () => ({ auth: { exchangeCodeForSession } }),
  };
}

describe("auth callback", () => {
  it("intercambia el código PKCE y redirige al destino interno", async () => {
    const auth = createAuthClient();
    const request = new NextRequest(
      "https://nexbuild.test/auth/callback?code=pkce-code&next=%2Fbuilder%3Fstep%3D2",
    );

    const response = await handleAuthCallback(request, auth.factory);

    expect(auth.exchangeCodeForSession).toHaveBeenCalledWith("pkce-code");
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://nexbuild.test/builder?step=2",
    );
    expect(response.headers.get("Cache-Control")).toContain("no-store");
  });

  it("vuelve al login cuando el intercambio falla", async () => {
    const auth = createAuthClient(new Error("invalid code"));
    const request = new NextRequest(
      "https://nexbuild.test/auth/callback?code=expired",
    );

    const response = await handleAuthCallback(request, auth.factory);

    expect(response.headers.get("location")).toBe(
      "https://nexbuild.test/login?error=auth_callback",
    );
    expect(response.headers.get("Cache-Control")).toContain("private");
  });

  it("rechaza redirecciones externas aunque el intercambio sea válido", async () => {
    const auth = createAuthClient();
    const request = new NextRequest(
      "https://nexbuild.test/auth/callback?code=pkce-code&next=https%3A%2F%2Fevil.test%2Fsteal",
    );

    const response = await handleAuthCallback(request, auth.factory);

    expect(response.headers.get("location")).toBe("https://nexbuild.test/");
  });
});

import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { buildProxyResponse } from "./proxy";

const createIdleAuthClient = () => ({
  auth: {
    getClaims: async () => ({ data: null, error: null }),
  },
});

describe("request CSP", () => {
  it("genera un nonce distinto y una política estricta por petición", async () => {
    const first = await buildProxyResponse(
      new NextRequest("https://nexbuild.test/builder"),
      createIdleAuthClient,
    );
    const second = await buildProxyResponse(
      new NextRequest("https://nexbuild.test/builder"),
      createIdleAuthClient,
    );
    const firstCsp = first.headers.get("Content-Security-Policy") ?? "";
    const secondCsp = second.headers.get("Content-Security-Policy") ?? "";

    expect(firstCsp).toContain("object-src 'none'");
    expect(firstCsp).toContain("strict-dynamic");
    expect(firstCsp).toContain("style-src-attr 'unsafe-inline'");
    expect(firstCsp.match(/'nonce-([^']+)'/)?.[1]).toBeTruthy();
    expect(firstCsp.match(/'nonce-([^']+)'/)?.[1]).not.toBe(
      secondCsp.match(/'nonce-([^']+)'/)?.[1],
    );
    expect(first.headers.get("x-middleware-request-x-nonce")).toBeTruthy();
    expect(
      first.headers.get("x-middleware-request-content-security-policy"),
    ).toBe(firstCsp);
  });
});

describe("Supabase session refresh", () => {
  it("preserva cada cookie y los encabezados privados de la sesión renovada", async () => {
    const response = await buildProxyResponse(
      new NextRequest("https://nexbuild.test/builder"),
      (cookieMethods) => ({
        auth: {
          getClaims: async () => {
            cookieMethods.setAll(
              [
                {
                  name: "sb-session.0",
                  value: "first",
                  options: { httpOnly: true, path: "/" },
                },
                {
                  name: "sb-session.1",
                  value: "second",
                  options: { httpOnly: true, path: "/" },
                },
              ],
              {
                "Cache-Control":
                  "private, no-cache, no-store, must-revalidate, max-age=0",
                Expires: "0",
                Pragma: "no-cache",
              },
            );
            return { data: null, error: null };
          },
        },
      }),
    );

    const setCookies = response.headers.getSetCookie();
    expect(setCookies).toHaveLength(2);
    expect(setCookies[0]).toContain("sb-session.0=first");
    expect(setCookies[1]).toContain("sb-session.1=second");
    expect(response.headers.get("x-middleware-request-cookie")).toContain(
      "sb-session.0=first",
    );
    expect(response.headers.get("x-middleware-request-cookie")).toContain(
      "sb-session.1=second",
    );
    expect(response.headers.get("Cache-Control")).toContain("private");
    expect(response.headers.get("Pragma")).toBe("no-cache");
    expect(response.headers.get("Content-Security-Policy")).toContain(
      "strict-dynamic",
    );
  });

  it("mantiene las cookies anónimas sin convertirlas en sesión", async () => {
    let incomingCookies: { name: string; value: string }[] = [];
    const request = new NextRequest("https://nexbuild.test/builder", {
      headers: { cookie: "anonymous-build=build-123" },
    });

    const response = await buildProxyResponse(request, (cookieMethods) => ({
      auth: {
        getClaims: async () => {
          incomingCookies = cookieMethods.getAll();
          return { data: null, error: null };
        },
      },
    }));

    expect(incomingCookies).toContainEqual({
      name: "anonymous-build",
      value: "build-123",
    });
    expect(response.headers.getSetCookie()).toEqual([]);
  });
});

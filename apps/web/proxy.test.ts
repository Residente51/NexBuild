import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "./proxy";

describe("request CSP", () => {
  it("genera un nonce distinto y una política estricta por petición", () => {
    const first = proxy(new NextRequest("https://nexbuild.test/builder"));
    const second = proxy(new NextRequest("https://nexbuild.test/builder"));
    const firstCsp = first.headers.get("Content-Security-Policy") ?? "";
    const secondCsp = second.headers.get("Content-Security-Policy") ?? "";

    expect(firstCsp).toContain("object-src 'none'");
    expect(firstCsp).toContain("strict-dynamic");
    expect(firstCsp).toContain("style-src-attr 'unsafe-inline'");
    expect(firstCsp.match(/'nonce-([^']+)'/)?.[1]).toBeTruthy();
    expect(firstCsp.match(/'nonce-([^']+)'/)?.[1]).not.toBe(
      secondCsp.match(/'nonce-([^']+)'/)?.[1],
    );
  });
});

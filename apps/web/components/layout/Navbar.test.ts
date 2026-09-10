import { describe, expect, it } from "vitest";
import { getNavigationLinks } from "./Navbar";

describe("Navbar navigation", () => {
  it("muestra Mis armados solamente a usuarios autenticados", () => {
    expect(getNavigationLinks(true)).toContainEqual({
      label: "Mis armados",
      href: "/builds",
    });
    expect(getNavigationLinks(false)).not.toContainEqual({
      label: "Mis armados",
      href: "/builds",
    });
  });

  it("mantiene limpia la navegación anónima", () => {
    expect(getNavigationLinks(false).map((link) => link.href)).toEqual([
      "/",
      "/components",
      "/compare",
      "/builder",
    ]);
  });
});

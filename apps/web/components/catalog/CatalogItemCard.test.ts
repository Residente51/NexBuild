import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { CatalogItemCard } from "@/components/catalog/CatalogItemCard";
import type { PCComponent } from "@/types/component";

const component: PCComponent = {
  id: "cpu-amd",
  slug: "amd-ryzen-7-7700",
  name: "Ryzen 7 7700",
  brand: "AMD",
  category: "cpu",
  price: 319_990,
  productUrl: "https://example.com/offer",
  inStock: true,
  specs: {
    socket: "AM5",
    tdp: 65,
    hasIntegratedGraphics: true,
    includesCooler: true,
    cores: 8,
  },
};

describe("CatalogItemCard actions", () => {
  it("muestra un fallback intencional por categoría cuando falta la imagen", () => {
    const markup = renderToStaticMarkup(
      createElement(CatalogItemCard, {
        component,
        isAdded: false,
        onAdd: vi.fn(),
      }),
    );

    expect(markup).toContain("CPU");
    expect(markup).toContain("Procesador");
    expect(markup).toContain("AMD");
  });

  it("renderiza la imagen disponible sin recortarla", () => {
    const markup = renderToStaticMarkup(
      createElement(CatalogItemCard, {
        component: {
          ...component,
          image: "https://example.com/ryzen.png",
        },
        isAdded: false,
        onAdd: vi.fn(),
        prioritizeImage: true,
      }),
    );

    expect(markup).toContain('src="https://example.com/ryzen.png"');
    expect(markup).toContain('alt="Ryzen 7 7700 de AMD"');
    expect(markup).toContain('loading="eager"');
    expect(markup).toContain("object-contain");
  });

  it("preserva detalle, comparar, agregar al builder y oferta externa", () => {
    const markup = renderToStaticMarkup(
      createElement(CatalogItemCard, {
        component,
        isAdded: false,
        onAdd: vi.fn(),
      }),
    );

    expect(markup).toContain('href="/components/amd-ryzen-7-7700"');
    expect(markup).toContain("Ver detalles");
    expect(markup).toContain("Comparar");
    expect(markup).toContain("Añadir");
    expect(markup).toContain('href="https://example.com/offer"');
    expect(markup).toContain('target="_blank"');
  });
});

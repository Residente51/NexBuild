import { describe, expect, it } from "vitest";
import { catalogImageSources } from "./catalog-image-sources.mjs";
import { createEmbeddedSvg, detectRasterMime } from "./download-component-images.mjs";

describe("catalog image materializer", () => {
  it("detecta imágenes por firma y rechaza HTML", () => {
    expect(detectRasterMime(Buffer.from([0xff, 0xd8, 0xff, 0x00, 0, 0, 0, 0, 0, 0, 0, 0]))).toBe("image/jpeg");
    expect(detectRasterMime(Buffer.from("<!DOCTYPE html><html></html>"))).toBeNull();
  });

  it("incrusta el raster sin alterar la ruta SVG estable del catálogo", () => {
    const svg = createEmbeddedSvg(
      Buffer.from([0xff, 0xd8, 0xff]),
      "image/jpeg",
      "https://example.com/product.jpg?a=1&b=2",
    );

    expect(svg).toContain("data:image/jpeg;base64,/9j/");
    expect(svg).toContain("preserveAspectRatio=\"xMidYMid meet\"");
    expect(svg).toContain("a=1&amp;b=2");
  });

  it("solo registra fuentes oficiales de AMD", () => {
    for (const source of Object.values(catalogImageSources)) {
      expect(new URL(source.productPage).hostname).toBe("www.amd.com");
      expect(new URL(source.imageUrl).hostname).toBe("www.amd.com");
    }
  });
});

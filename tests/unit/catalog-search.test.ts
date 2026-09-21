import { describe, expect, it } from "vitest";
import {
  catalogFamilyMode,
  foldSearchText,
  matchesCatalogSearch,
  searchTokens,
} from "@/lib/catalog-search";

describe("búsqueda de productos del cotizador", () => {
  it("ignora mayúsculas y tildes", () => {
    expect(foldSearchText("ÁZUL CATEDRAL")).toBe("azul catedral");
    expect(matchesCatalogSearch("Cristal Ázul 8 mm", "azul")).toBe(true);
  });

  it("acepta palabras en cualquier orden", () => {
    const product = "Azul 8 mm Reflectante";
    expect(matchesCatalogSearch(product, "8 azul")).toBe(true);
    expect(matchesCatalogSearch(product, "azul 8mm")).toBe(true);
    expect(matchesCatalogSearch(product, "reflectante azul")).toBe(true);
  });

  it("exige que todas las palabras coincidan", () => {
    expect(matchesCatalogSearch("Azul 8 mm Reflectante", "azul bronce")).toBe(false);
    expect(searchTokens("  8   AZUL ")).toEqual(["8", "azul"]);
  });

  it("cambia automáticamente de chips a carpetas al superar seis familias", () => {
    expect(catalogFamilyMode(0)).toBe("chips");
    expect(catalogFamilyMode(6)).toBe("chips");
    expect(catalogFamilyMode(7)).toBe("folders");
    expect(catalogFamilyMode(21)).toBe("folders");
  });
});

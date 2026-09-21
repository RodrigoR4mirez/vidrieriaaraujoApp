import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { validateBackup } from "@/application/backup";
import { catalogStateSchema, type CatalogState } from "@/domain/catalogs/models";

const importManifestPath = fileURLToPath(
  new URL("../../data/catalogos-importacion.json", import.meta.url),
);

function importedGlassCatalog(): CatalogState {
  const backup = validateBackup(
    JSON.parse(readFileSync(importManifestPath, "utf8")) as unknown,
  );
  const entry = backup.entries.find(
    (candidate) => candidate.pathname === "data/v1/catalog.json",
  );
  if (!entry) throw new Error("Falta el catálogo de vidrios importado.");
  return catalogStateSchema.parse(entry.value);
}

describe("manifiesto de importación de vidrios", () => {
  it("reemplaza el catálogo con 42 productos y referencias únicas", () => {
    const catalog = importedGlassCatalog();
    expect(catalog.products).toHaveLength(42);
    expect(new Set(catalog.products.map((product) => product.code)).size).toBe(42);
    expect(catalog.values.filter((value) => value.category === "families").map((value) => value.name))
      .toEqual(["Primario", "Reflejante", "Espejo", "Catedral", "Laminado", "Arenado"]);
    expect(catalog.products.every((product) => !product.code.startsWith("GL-"))).toBe(true);
  });

  it("agrupa los primarios y conserva el detalle del Excel", () => {
    const catalog = importedGlassCatalog();
    const primary = catalog.values.find(
      (value) => value.category === "families" && value.name === "Primario",
    );
    const cathedral = catalog.values.find(
      (value) => value.category === "families" && value.name === "Catedral",
    );
    expect(primary).toBeDefined();
    expect(cathedral).toBeDefined();
    expect(catalog.products.filter((product) => product.familyId === primary?.id))
      .toHaveLength(14);
    expect(catalog.products.filter((product) => product.familyId === cathedral?.id))
      .toHaveLength(14);
    expect(catalog.products.find((product) => product.code === "PRIM-INCO-6MM-214X330"))
      .toMatchObject({
        description: "incoloro 6mm",
        sheetWidthCm: "214",
        sheetHeightCm: "330",
        pricePerSquareFoot: "2.80",
        pricePerSheet: "188.00",
      });
    expect(catalog.products.find((product) => product.code === "CATE-BRON-LLOV-3MM-165X200"))
      .toMatchObject({
        description: "cat bronce llovizna 3mm",
        pricePerSquareFoot: "3.90",
        pricePerSheet: "134.00",
      });
  });
});

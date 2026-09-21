import { describe, expect, it } from "vitest";
import seed from "@/data/aluminum-seed.json";
import { aluminumCatalogSchema } from "@/domain/aluminum/models";
import { catalogStateSchema, emptyCatalog } from "@/domain/catalogs/models";
import { priceDraft } from "@/application/use-cases";
import { quotationSubtotal, quotationTotal } from "@/domain/quotation/calculation";

describe("referencia y cotización de perfiles", () => {
  const catalog = aluminumCatalogSchema.parse(seed);

  it("conserva la trazabilidad validada del Excel", () => {
    expect(catalog.families).toHaveLength(21);
    expect(catalog.colors.map((color) => color.name)).toEqual(["Mate", "Negro"]);
    expect(catalog.profiles).toHaveLength(143);
    const profile = catalog.profiles.find((entry) => entry.code === "5220");
    expect(profile?.sourceRows).toEqual([133, 134]);
    expect(profile?.colorPrices).toHaveLength(2);
    expect(profile?.originalDescription).toContain("Tubo rect 2 x 1/2");
  });

  it("crea snapshots por metros y barra con el color elegido", () => {
    const profile = catalog.profiles.find((entry) => entry.code === "2248")!;
    const mate = catalog.colors.find((color) => color.name === "Mate")!;
    const negro = catalog.colors.find((color) => color.name === "Negro")!;
    const items = priceDraft([
      {
        id: "00000000-0000-4000-8000-000000000901",
        itemType: "ALUMINUM_PROFILE",
        profileId: profile.id,
        colorId: mate.id,
        mode: "PROFILE_METERS",
        metersRequested: "2.50",
        quantity: 1,
      },
      {
        id: "00000000-0000-4000-8000-000000000902",
        itemType: "ALUMINUM_PROFILE",
        profileId: profile.id,
        colorId: negro.id,
        mode: "PROFILE_BAR",
        quantity: 2,
      },
    ], emptyCatalog(), catalog);
    expect(items[0]).toMatchObject({
      profileCode: "2248",
      color: "Mate",
      pricePerBar: "28.00",
      unitPrice: "5.13",
      itemAmount: "12.83",
    });
    expect(items[1]).toMatchObject({ color: "Negro", itemAmount: "58.00" });
    expect(quotationSubtotal(items)).toBe("70.83");
    expect(quotationTotal(items)).toBe("71.00");
  });

  it("rechaza colores que el perfil no ofrece", () => {
    const profile = catalog.profiles.find((entry) => entry.code === "1164")!;
    const negro = catalog.colors.find((color) => color.name === "Negro")!;
    expect(() => priceDraft([{
      id: "00000000-0000-4000-8000-000000000903",
      itemType: "ALUMINUM_PROFILE",
      profileId: profile.id,
      colorId: negro.id,
      mode: "PROFILE_BAR",
      quantity: 1,
    }], emptyCatalog(), catalog)).toThrow("sin precio");
  });

  it("combina vidrio y perfil en un único subtotal", () => {
    const stamp = "2026-09-20T00:00:00.000Z";
    const familyId = "00000000-0000-4000-8000-000000000911";
    const thicknessId = "00000000-0000-4000-8000-000000000912";
    const productId = "00000000-0000-4000-8000-000000000913";
    const glass = catalogStateSchema.parse({
      schemaVersion: 1 as const,
      values: [
        { id: familyId, schemaVersion: 1 as const, revision: 1, category: "families" as const, name: "Cristal", description: "", status: "ACTIVE" as const, createdAt: stamp, updatedAt: stamp },
        { id: thicknessId, schemaVersion: 1 as const, revision: 1, category: "thicknesses" as const, name: "6 mm", description: "", status: "ACTIVE" as const, createdAt: stamp, updatedAt: stamp },
      ],
      products: [{ id: productId, schemaVersion: 1 as const, revision: 1, code: "CRISTAL-6", familyId, thicknessId,
        pricePerSquareFoot: "3.50", pricePerSheet: "0.00", status: "ACTIVE" as const, createdAt: stamp, updatedAt: stamp }],
    });
    const profile = catalog.profiles.find((entry) => entry.code === "2248")!;
    const negro = catalog.colors.find((color) => color.name === "Negro")!;
    const items = priceDraft([
      { id: "00000000-0000-4000-8000-000000000914", productId, mode: "SQUARE_FOOT", widthCm: "100", heightCm: "80", quantity: 2 },
      { id: "00000000-0000-4000-8000-000000000915", itemType: "ALUMINUM_PROFILE", profileId: profile.id,
        colorId: negro.id, mode: "PROFILE_BAR", quantity: 1 },
    ], glass, catalog);
    expect(items).toHaveLength(2);
    expect(quotationSubtotal(items)).toBe("91.24");
    expect(quotationTotal(items)).toBe("91.50");
  });
});

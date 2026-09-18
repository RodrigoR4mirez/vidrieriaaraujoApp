import { describe, expect, it } from "vitest";
import {
  calculateItem,
  nextEvenInch,
  roundHalfUp,
  ceilToMultiple,
  quotationTotal,
} from "@/domain/quotation/calculation";
describe("fórmula oficial", () => {
  it("100 × 80, S/3.50, 2 piezas = S/62.25", () => {
    const result = calculateItem({
      widthCm: "100",
      heightCm: "80",
      pricePerSquareFoot: "3.50",
      quantity: 2,
    });
    expect(result).toMatchObject({
      widthInRounded: "40",
      heightInRounded: "32",
      areaIn2: "1280",
      areaFt2: "8.89",
      unitPrice: "31.12",
      itemAmount: "62.25",
    });
  });
  it("120 × 80, S/6.50, 3 piezas = S/208.10", () => {
    const result = calculateItem({
      widthCm: "120",
      heightCm: "80",
      pricePerSquareFoot: "6.50",
      quantity: 3,
    });
    expect(result).toMatchObject({
      widthInRounded: "48",
      heightInRounded: "32",
      areaIn2: "1536",
      areaFt2: "10.67",
      unitPrice: "69.36",
      itemAmount: "208.10",
    });
  });
  it.each([
    ["24.4", "26"],
    ["23.6", "24"],
    ["39.37", "40"],
    ["31.50", "32"],
    ["47.24", "48"],
    ["24", "26"],
  ])("siguiente par %s → %s", (input, output) =>
    expect(nextEvenInch(input).toString()).toBe(output),
  );
  it("aumenta dimensiones convertidas exactamente pares", () =>
    expect(
      calculateItem({
        widthCm: "60.96",
        heightCm: "60.96",
        pricePerSquareFoot: "1",
        quantity: 1,
      }).widthInRounded,
    ).toBe("26"));
  it.each([
    ["62.24", "62.25"],
    ["62.25", "62.25"],
    ["62.26", "62.30"],
    ["208.08", "208.10"],
  ])("comercial %s → %s", (a, b) =>
    expect(ceilToMultiple(a).toFixed(2)).toBe(b),
  );
  it("half-up decimal exacto", () =>
    expect(roundHalfUp("31.115").toFixed(2)).toBe("31.12"));
  it("suma solo los importes finales", () =>
    expect(
      quotationTotal([{ itemAmount: "62.25" }, { itemAmount: "208.10" }]),
    ).toBe("270.35"));
  it.each([
    { widthCm: "0" },
    { widthCm: "-1" },
    { heightCm: "0" },
    { heightCm: "-1" },
    { quantity: 0 },
    { quantity: -1 },
    { quantity: 1.5 },
    { quantity: Infinity },
    { pricePerSquareFoot: "0" },
    { pricePerSquareFoot: "-2" },
    { widthCm: "NaN" },
  ])("rechaza entrada inválida %j", (invalid) =>
    expect(() =>
      calculateItem({
        widthCm: "100",
        heightCm: "80",
        quantity: 2,
        pricePerSquareFoot: "3.50",
        ...invalid,
      }),
    ).toThrow(),
  );
});

it("validar campos vacíos o no numéricos nunca lanza desde una refinación", async () => {
  const { productInputSchema, positiveDecimal } =
    await import("@/domain/catalogs/models");
  expect(positiveDecimal.safeParse("").success).toBe(false);
  expect(positiveDecimal.safeParse("texto").success).toBe(false);
  expect(
    productInputSchema.safeParse({
      code: "COM",
      familyId: "a599d94e-6a89-487a-bfbb-36df43a0acb1",
      thicknessId: "832fbc33-92e7-4488-bd0b-36d8ee670e72",
      pricePerSquareFoot: "3.50",
      sheetWidthCm: "",
      sheetHeightCm: "",
      pricePerSheet: "",
      status: "ACTIVE",
    }).success,
  ).toBe(true);
});

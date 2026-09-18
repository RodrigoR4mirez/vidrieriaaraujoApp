import { describe, expect, it } from "vitest";
import {
  calculateItem,
  calculateSheet,
  nextEvenInch,
  roundHalfUp,
  ceilToMultiple,
  quotationTotal,
} from "@/domain/quotation/calculation";
describe("fórmula oficial", () => {
  it("plancha multiplica precio por cantidad sin redondeo comercial", () => {
    expect(calculateSheet({ pricePerSheet: "111.11", quantity: 3 }).itemAmount).toBe("333.33");
    expect(calculateSheet({ pricePerSheet: "0.01", quantity: 3 }).itemAmount).toBe("0.03");
    for (const quantity of [0, -1, 1.5])
      expect(() => calculateSheet({ pricePerSheet: "111.11", quantity })).toThrow();
    expect(() => calculateSheet({ pricePerSheet: "0.00", quantity: 1 })).toThrow();
  });
  it("100 × 80, S/3.50, 2 piezas = S/69.45", () => {
    const result = calculateItem({
      widthCm: "100",
      heightCm: "80",
      pricePerSquareFoot: "3.50",
      quantity: 2,
    });
    expect(result).toMatchObject({
      widthInRounded: "42",
      heightInRounded: "34",
      areaIn2: "1428",
      areaFt2: "9.92",
      unitPrice: "34.72",
      itemAmount: "69.45",
    });
  });
  it("120 × 80, S/6.50, 3 piezas = S/230.35", () => {
    const result = calculateItem({
      widthCm: "120",
      heightCm: "80",
      pricePerSquareFoot: "6.50",
      quantity: 3,
    });
    expect(result).toMatchObject({
      widthInRounded: "50",
      heightInRounded: "34",
      areaIn2: "1700",
      areaFt2: "11.81",
      unitPrice: "76.77",
      itemAmount: "230.35",
    });
  });
  it.each([
    ["35.43", "38"],
    ["8.07", "10"],
    ["35", "38"],
    ["34.9999999999", "36"],
    ["35.0000000001", "38"],
    ["24.4", "26"],
    ["23.6", "26"],
    ["39.37", "42"],
    ["31.50", "34"],
    ["47.24", "50"],
    ["24", "26"],
  ])("siguiente par %s → %s", (input, output) =>
    expect(nextEvenInch(input).toString()).toBe(output),
  );
  it("20.5 × 90 cm usa 10 × 38 pulgadas y conserva redondeos monetarios", () => {
    expect(calculateItem({ widthCm: "20.5", heightCm: "90", pricePerSquareFoot: "1.70", quantity: 1 }))
      .toMatchObject({ widthInRounded: "10", heightInRounded: "38", areaIn2: "380", areaFt2: "2.64", unitPrice: "4.49", itemAmount: "4.50" });
  });
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

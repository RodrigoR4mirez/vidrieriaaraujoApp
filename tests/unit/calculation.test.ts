import { describe, expect, it } from "vitest";
import {
  calculateItem,
  calculateSheet,
  calculateProfileBar,
  calculateProfileMeters,
  nextEvenInch,
  roundInchesForWaste,
  roundHalfUp,
  quotationSubtotal,
  roundQuotationTotal,
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
  it("perfil por metros aplica precio de barra ÷ longitud × 1.10", () => {
    expect(calculateProfileMeters({
      pricePerBar: "28.00",
      barLengthMeters: "6.00",
      metersRequested: "2.50",
      quantity: 1,
    })).toMatchObject({
      markupMultiplier: "1.10",
      unitPrice: "5.13",
      itemAmount: "12.83",
    });
    expect(calculateProfileMeters({
      pricePerBar: "28.00",
      barLengthMeters: "6.00",
      metersRequested: "2.50",
      quantity: 2,
    }).itemAmount).toBe("25.65");
  });
  it("perfil por centímetros conserva el precio proporcional exacto", () => {
    expect(calculateProfileMeters({
      pricePerBar: "28.00",
      barLengthMeters: "6.00",
      metersRequested: "2.50",
      measurementUnit: "CENTIMETERS",
      measurementValue: "250",
      quantity: 1,
    })).toMatchObject({
      measurementUnit: "CENTIMETERS",
      measurementValue: "250",
      unitPrice: "5.13",
      itemAmount: "12.83",
    });
  });
  it("perfil por barra multiplica el precio del color por cantidad", () => {
    expect(calculateProfileBar({ pricePerBar: "29.00", barLengthMeters: "6.00", quantity: 2 }))
      .toMatchObject({ unitPrice: "29.00", itemAmount: "58.00" });
    for (const invalid of [
      { pricePerBar: "0", barLengthMeters: "6", quantity: 1 },
      { pricePerBar: "28", barLengthMeters: "0", quantity: 1 },
      { pricePerBar: "28", barLengthMeters: "6", quantity: 0 },
    ]) expect(() => calculateProfileBar(invalid)).toThrow();
  });
  it("100 × 80 conserva S/62.24 por ítem y cobra S/62.50", () => {
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
      itemAmount: "62.24",
    });
    expect(result.widthWasteIn).toMatch(/^0\.6299/);
    expect(result.heightWasteIn).toMatch(/^0\.5039/);
    expect(quotationTotal([result])).toBe("62.50");
  });
  it("120 × 80 conserva S/208.08 por ítem y cobra S/208.50", () => {
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
      itemAmount: "208.08",
    });
    expect(quotationTotal([result])).toBe("208.50");
  });
  it.each([
    ["35.43", "36"],
    ["35.49", "36"],
    ["35.51", "38"],
    ["35.83", "38"],
    ["31.49", "32"],
    ["31.90", "34"],
    ["36.00", "38"],
    ["36.40", "38"],
  ])("redondeo por merma %s → %s", (input, output) =>
    expect(nextEvenInch(input).toString()).toBe(output),
  );
  it("20.5 cm convierte 8.07 pulgadas y redondea a 10", () => {
    const result = calculateItem({ widthCm: "20.5", heightCm: "20.5", pricePerSquareFoot: "1", quantity: 1 });
    expect(result.widthInRaw).toMatch(/^8\.0708/);
    expect(result.widthWasteIn).toMatch(/^1\.9291/);
    expect(result.widthInRounded).toBe("10");
  });
  it.each([
    ["120.12", "120.50"],
    ["120.01", "120.50"],
    ["120.50", "120.50"],
    ["120.51", "121.00"],
    ["120.67", "121.00"],
    ["120.99", "121.00"],
    ["120.00", "120.00"],
  ])("total %s → %s", (input, expected) =>
    expect(roundQuotationTotal(input)).toBe(expected),
  );
  it("la merma exacta de 0.5 se queda en el par inmediato", () => {
    const result = roundInchesForWaste("35.5");
    expect(result.waste.toString()).toBe("0.5");
    expect(result.rounded.toString()).toBe("36");
  });
  it("half-up decimal exacto", () =>
    expect(roundHalfUp("31.115").toFixed(2)).toBe("31.12"));
  it("muestra subtotal exacto y redondea únicamente el total final", () => {
    const items = [{ itemAmount: "62.24" }, { itemAmount: "208.08" }];
    expect(quotationSubtotal(items)).toBe("270.32");
    expect(quotationTotal(items)).toBe("270.50");
  });
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

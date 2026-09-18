import Decimal from "decimal.js";
import { z } from "zod";
import { positiveDecimal } from "../catalogs/models";

const D = Decimal.clone({ precision: 60, rounding: Decimal.ROUND_HALF_UP });
const CM_PER_INCH = "2.54";
const SQUARE_INCHES_PER_FOOT = 144;
const COMMERCIAL_INCREMENT = "0.05";
export const quantitySchema = z
    .number()
    .int("La cantidad debe ser entera")
    .min(1, "La cantidad debe ser al menos 1")
    .max(Number.MAX_SAFE_INTEGER);
export const measurementSchema = z.object({
  widthCm: positiveDecimal,
  heightCm: positiveDecimal,
  quantity: quantitySchema,
});
export const calculationInputSchema = measurementSchema.extend({
  pricePerSquareFoot: positiveDecimal,
});
export type Measurement = z.infer<typeof measurementSchema>;
export function roundHalfUp(value: Decimal.Value, decimals = 2) {
  return new D(value).toDecimalPlaces(decimals, Decimal.ROUND_HALF_UP);
}
export function nextEvenInch(value: Decimal.Value) {
  return new D(value).div(2).floor().plus(1).times(2);
}
export function ceilToMultiple(
  value: Decimal.Value,
  multiple: Decimal.Value = COMMERCIAL_INCREMENT,
) {
  return new D(value).div(multiple).ceil().times(multiple);
}
export function calculateItem(raw: z.input<typeof calculationInputSchema>) {
  const input = calculationInputSchema.parse(raw);
  const widthInRaw = new D(input.widthCm).div(CM_PER_INCH);
  const heightInRaw = new D(input.heightCm).div(CM_PER_INCH);
  const widthInRounded = nextEvenInch(widthInRaw),
    heightInRounded = nextEvenInch(heightInRaw);
  const areaIn2 = widthInRounded.times(heightInRounded);
  const areaFt2 = roundHalfUp(areaIn2.div(SQUARE_INCHES_PER_FOOT));
  const unitPrice = roundHalfUp(areaFt2.times(input.pricePerSquareFoot));
  return {
    ...input,
    widthInRaw: widthInRaw.toFixed(),
    heightInRaw: heightInRaw.toFixed(),
    widthInRounded: widthInRounded.toFixed(),
    heightInRounded: heightInRounded.toFixed(),
    areaIn2: areaIn2.toFixed(),
    areaFt2: areaFt2.toFixed(2),
    unitPrice: unitPrice.toFixed(2),
    itemAmount: ceilToMultiple(unitPrice.times(input.quantity)).toFixed(2),
  };
}
export function quotationTotal(items: { itemAmount: string }[]) {
  return items
    .reduce((sum, item) => sum.plus(item.itemAmount), new D(0))
    .toFixed(2);
}
const sheetCalculationSchema = z.object({
  pricePerSheet: positiveDecimal,
  quantity: quantitySchema,
});
export function calculateSheet(raw: z.input<typeof sheetCalculationSchema>) {
  const input = sheetCalculationSchema.parse(raw);
  return {
    ...input,
    unitPrice: new D(input.pricePerSheet).toFixed(2),
    itemAmount: new D(input.pricePerSheet).times(input.quantity).toFixed(2),
  };
}

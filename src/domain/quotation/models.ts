import { z } from "zod";
import { measurementSchema, quantitySchema } from "./calculation";
import { decimalString, positiveDecimal } from "../catalogs/models";
const identity = { id: z.string().uuid(), productId: z.string().uuid() };
const cutDraftSchema = measurementSchema.extend({
  ...identity,
  // Missing mode is the original square-foot format; keep legacy JSON unchanged.
  mode: z.literal("SQUARE_FOOT").optional(),
}).strict();
const sheetDraftSchema = z.object({
  ...identity,
  mode: z.literal("SHEET"),
  quantity: quantitySchema,
}).strict();
export const draftItemSchema = z.union([sheetDraftSchema, cutDraftSchema]);
export const draftSchema = z.object({
  requestId: z.string().uuid(),
  items: z.array(draftItemSchema).min(1, "Agrega al menos un vidrio").max(200),
  conditions: z.string().trim().max(2000).default(""),
}).strict();
const snapshot = {
  productCode: z.string(), productDescription: z.string(),
  family: z.string(), colorFinish: z.string(), thickness: z.string(), cathedralDesign: z.string(),
  unitPrice: decimalString, itemAmount: decimalString,
};
const cutItemSchema = cutDraftSchema.extend({
  ...snapshot,
  pricePerSquareFoot: positiveDecimal,
  widthInRaw: decimalString, heightInRaw: decimalString,
  widthWasteIn: decimalString.optional(), heightWasteIn: decimalString.optional(),
  widthInRounded: decimalString, heightInRounded: decimalString,
  areaIn2: decimalString, areaFt2: decimalString,
}).strict();
const sheetItemSchema = sheetDraftSchema.extend({
  ...snapshot,
  pricePerSheet: positiveDecimal,
  sheetWidthCm: positiveDecimal.optional(),
  sheetHeightCm: positiveDecimal.optional(),
}).strict();
export const quotationItemSchema = z.union([sheetItemSchema, cutItemSchema]);
export const numberSchema = z
  .string()
  .regex(/^PRO-\d{5,}$/, "Número de proforma inválido");
export const quotationSchema = z
  .object({
    schemaVersion: z.literal(1),
    id: z.string().uuid(),
    number: numberSchema,
    status: z.literal("CONFIRMED"),
    createdAt: z.string().datetime(),
    confirmedAt: z.string().datetime(),
    timezone: z.literal("America/Lima"),
    subtotal: decimalString.optional(),
    total: decimalString,
    conditions: z.string().max(2000),
    items: z.array(quotationItemSchema).min(1).max(200),
  })
  .strict();
export type Draft = z.infer<typeof draftSchema>;
export type DraftItem = z.infer<typeof draftItemSchema>;
export type QuotationItem = z.infer<typeof quotationItemSchema>;
export type Quotation = z.infer<typeof quotationSchema>;
export function formatQuotationNumber(value: number) {
  return `PRO-${String(value).padStart(5, "0")}`;
}

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
const profileIdentity = {
  id: z.string().uuid(),
  itemType: z.literal("ALUMINUM_PROFILE"),
  profileId: z.string().uuid(),
  colorId: z.string().uuid(),
  quantity: quantitySchema,
};
const profileMetersDraftSchema = z.object({
  ...profileIdentity,
  mode: z.literal("PROFILE_METERS"),
  metersRequested: positiveDecimal,
}).strict();
const profileBarDraftSchema = z.object({
  ...profileIdentity,
  mode: z.literal("PROFILE_BAR"),
}).strict();
export const draftItemSchema = z.union([
  profileMetersDraftSchema,
  profileBarDraftSchema,
  sheetDraftSchema,
  cutDraftSchema,
]);
export const customerNameSchema = z.string().trim()
  .min(1, "Ingresa el nombre del cliente")
  .max(160, "El nombre del cliente es demasiado largo");
export const draftSchema = z.object({
  requestId: z.string().uuid(),
  customerName: customerNameSchema,
  items: z.array(draftItemSchema).min(1, "Agrega al menos un producto").max(200),
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
const profileSnapshot = {
  profileCode: z.string(),
  profileDescription: z.string(),
  family: z.string(),
  color: z.string(),
  imagePath: z.string().optional(),
  barLengthMeters: positiveDecimal,
  pricePerBar: positiveDecimal,
  unitPrice: decimalString,
  itemAmount: decimalString,
};
const profileMetersItemSchema = profileMetersDraftSchema.extend({
  ...profileSnapshot,
  markupMultiplier: positiveDecimal,
}).strict();
const profileBarItemSchema = profileBarDraftSchema.extend(profileSnapshot).strict();
export const quotationItemSchema = z.union([
  profileMetersItemSchema,
  profileBarItemSchema,
  sheetItemSchema,
  cutItemSchema,
]);
export const numberSchema = z
  .string()
  .regex(/^COT-\d{5,}$/, "Número de cotización inválido");
const storedNumberSchema = z.string().regex(/^[A-Z]{3}-\d{5,}$/);
function normalizeStoredNumber(number: string) {
  return `COT-${number.slice(4)}`;
}
export const quotationSchema = z
  .object({
    schemaVersion: z.literal(1),
    id: z.string().uuid(),
    // Historical documents can retain their original pathname. Their public
    // number is normalized when read, while newly written documents use COT.
    number: storedNumberSchema.transform(normalizeStoredNumber),
    status: z.literal("CONFIRMED"),
    createdAt: z.string().datetime(),
    confirmedAt: z.string().datetime(),
    timezone: z.literal("America/Lima"),
    // Optional only so confirmed quotations created before this field remain readable.
    customerName: customerNameSchema.optional(),
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
export type ProfileDraftItem = z.infer<typeof profileMetersDraftSchema> | z.infer<typeof profileBarDraftSchema>;
export type ProfileQuotationItem = z.infer<typeof profileMetersItemSchema> | z.infer<typeof profileBarItemSchema>;
export function isProfileDraftItem(item: DraftItem): item is ProfileDraftItem {
  return "itemType" in item && item.itemType === "ALUMINUM_PROFILE";
}
export function isProfileQuotationItem(item: QuotationItem): item is ProfileQuotationItem {
  return "itemType" in item && item.itemType === "ALUMINUM_PROFILE";
}
export function formatQuotationNumber(value: number) {
  return `COT-${String(value).padStart(5, "0")}`;
}

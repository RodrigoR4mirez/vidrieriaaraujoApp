import { z } from "zod";
import Decimal from "decimal.js";

export const statusSchema = z.enum(["ACTIVE", "HIDDEN"]);
export const categorySchema = z.enum([
  "families",
  "colors-finishes",
  "thicknesses",
  "cathedral-designs",
]);
export type Category = z.infer<typeof categorySchema>;
export const categoryLabels: Record<Category, string> = {
  families: "Familias",
  "colors-finishes": "Colores / acabados",
  thicknesses: "Espesores",
  "cathedral-designs": "Diseños catedral",
};
export const positiveDecimal = z
  .string()
  .trim()
  .max(30)
  .regex(/^\d+(\.\d+)?$/, "Ingresa un número positivo válido")
  .refine(
    (v) => /^\d+(\.\d+)?$/.test(v) && new Decimal(v).gt(0),
    "El valor debe ser mayor que cero",
  );
export const decimalString = z.string().regex(/^\d+(\.\d+)?$/);
const optionalDecimal = z
  .union([positiveDecimal, z.literal("")])
  .optional()
  .transform((v) => v || undefined);
const codeSchema = z
  .string()
  .trim()
  .min(1, "El código es obligatorio")
  .max(40)
  .toUpperCase()
  .regex(/^[A-Z0-9_-]+$/, "Usa letras, números, guiones o guion bajo");
const idSchema = z.string().uuid();
export const baseInputSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(100),
  description: z.string().trim().max(300).default(""),
  status: statusSchema,
  category: categorySchema,
});
const metadata = {
  id: idSchema,
  schemaVersion: z.literal(1),
  revision: z.number().int().positive(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
};
export const baseValueSchema = baseInputSchema.extend({
  ...metadata,
  // Preserve legacy fields without requiring them for new base values.
  code: codeSchema.optional(),
  observation: z.string().max(200).optional(),
});
export const priceInputSchema = positiveDecimal.regex(
  /^\d+\.\d{2}$/,
  "El precio debe tener exactamente dos decimales",
);
export const productInputSchema = z.object({
  code: codeSchema,
  familyId: idSchema,
  thicknessId: idSchema,
  colorFinishId: z
    .union([idSchema, z.literal("")])
    .optional()
    .transform((v) => v || undefined),
  cathedralDesignId: z
    .union([idSchema, z.literal("")])
    .optional()
    .transform((v) => v || undefined),
  sheetWidthCm: optionalDecimal,
  sheetHeightCm: optionalDecimal,
  pricePerSquareFoot: positiveDecimal,
  pricePerSheet: optionalDecimal,
  status: statusSchema,
});
export const productSchema = productInputSchema.extend(metadata);
export const catalogStateSchema = z
  .object({
    schemaVersion: z.literal(1),
    values: z.array(baseValueSchema),
    products: z.array(productSchema),
  })
  .strict();
export type BaseValue = z.infer<typeof baseValueSchema>;
export type Product = z.infer<typeof productSchema>;
export type CatalogState = z.infer<typeof catalogStateSchema>;
export type BaseInput = z.infer<typeof baseInputSchema>;
export type ProductInput = z.infer<typeof productInputSchema>;
export const emptyCatalog = (): CatalogState => ({
  schemaVersion: 1,
  values: [],
  products: [],
});
export function productDetails(product: Product, values: BaseValue[]) {
  const name = (id?: string) => values.find((v) => v.id === id)?.name || "";
  const family = name(product.familyId),
    thickness = name(product.thicknessId);
  const colorFinish = name(product.colorFinishId),
    cathedralDesign = name(product.cathedralDesignId);
  return {
    family,
    thickness,
    colorFinish,
    cathedralDesign,
    productDescription: [family, colorFinish, thickness, cathedralDesign]
      .filter(Boolean)
      .join(" · "),
  };
}
export function isQuotable(product: Product, values: BaseValue[]) {
  return (
    product.status === "ACTIVE" &&
    [
      product.familyId,
      product.thicknessId,
      product.colorFinishId,
      product.cathedralDesignId,
    ]
      .filter(Boolean)
      .every((id) => values.some((v) => v.id === id && v.status === "ACTIVE"))
  );
}

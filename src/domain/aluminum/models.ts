import Decimal from "decimal.js";
import { z } from "zod";
import { priceInputSchema, statusSchema } from "@/domain/catalogs/models";

const idSchema = z.string().uuid();
const codeSchema = z.string().trim().min(1, "El código es obligatorio").max(40)
  .toUpperCase().regex(/^[A-Z0-9_-]+$/, "Usa letras, números, guiones o guion bajo");
const nameSchema = z.string().trim().min(1, "El nombre es obligatorio").max(120);
const metadata = {
  id: idSchema,
  schemaVersion: z.literal(1),
  revision: z.number().int().positive(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
};

export const aluminumFamilyInputSchema = z.object({
  name: nameSchema,
  description: z.string().trim().max(300).default(""),
  status: statusSchema,
});
export const aluminumFamilySchema = aluminumFamilyInputSchema.extend(metadata).strict();

export const aluminumColorInputSchema = z.object({
  name: nameSchema,
  swatch: z.string().trim().regex(/^#[0-9A-F]{6}$/i, "Color hexadecimal inválido"),
  status: statusSchema,
});
export const aluminumColorSchema = aluminumColorInputSchema.extend(metadata).strict();

export const aluminumColorPriceInputSchema = z.object({
  colorId: idSchema,
  pricePerBar: priceInputSchema,
}).strict();

export const aluminumProfileInputSchema = z.object({
  code: codeSchema,
  description: z.string().trim().min(1, "La descripción es obligatoria").max(240),
  familyId: idSchema,
  barLengthMeters: priceInputSchema.refine((value) => new Decimal(value).gt(0), "La longitud debe ser mayor que cero"),
  imagePath: z.union([
    z.string().regex(/^\/profiles\/[A-Za-z0-9._/-]+$/, "Ruta de imagen inválida"),
    z.literal(""),
  ]).optional().transform((value) => value || undefined),
  colorPrices: z.array(aluminumColorPriceInputSchema).min(1, "Agrega al menos un precio por color").max(30),
  status: statusSchema,
});

export const aluminumProfileSchema = aluminumProfileInputSchema.extend({
  ...metadata,
  originalCode: z.string().max(80).optional(),
  originalDescription: z.string().max(500).optional(),
  sourceRows: z.array(z.number().int().positive()).max(20).optional(),
}).strict();

export const aluminumCatalogSchema = z.object({
  schemaVersion: z.literal(1),
  families: z.array(aluminumFamilySchema),
  colors: z.array(aluminumColorSchema),
  profiles: z.array(aluminumProfileSchema),
}).strict();

export type AluminumFamilyInput = z.infer<typeof aluminumFamilyInputSchema>;
export type AluminumFamily = z.infer<typeof aluminumFamilySchema>;
export type AluminumColorInput = z.infer<typeof aluminumColorInputSchema>;
export type AluminumColor = z.infer<typeof aluminumColorSchema>;
export type AluminumProfileInput = z.infer<typeof aluminumProfileInputSchema>;
export type AluminumProfile = z.infer<typeof aluminumProfileSchema>;
export type AluminumCatalog = z.infer<typeof aluminumCatalogSchema>;

export const emptyAluminumCatalog = (): AluminumCatalog => ({
  schemaVersion: 1,
  families: [],
  colors: [],
  profiles: [],
});

export function profilePrice(profile: AluminumProfile, colorId: string) {
  return profile.colorPrices.find((entry) => entry.colorId === colorId)?.pricePerBar;
}

export function isProfileQuotable(
  profile: AluminumProfile,
  colorId: string,
  catalog: AluminumCatalog,
) {
  const price = profilePrice(profile, colorId);
  return profile.status === "ACTIVE" &&
    catalog.families.some((family) => family.id === profile.familyId && family.status === "ACTIVE") &&
    catalog.colors.some((color) => color.id === colorId && color.status === "ACTIVE") &&
    Boolean(price && new Decimal(price).gt(0));
}

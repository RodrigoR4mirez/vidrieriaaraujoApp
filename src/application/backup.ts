import { z } from "zod";
import { catalogStateSchema } from "@/domain/catalogs/models";
import { quotationSchema } from "@/domain/quotation/models";
import { DomainError } from "@/domain/errors";
import type { JsonStore } from "./json-store";
import { aluminumCatalogSchema } from "@/domain/aluminum/models";
export const backupSchema = z
  .object({
    schemaVersion: z.literal(1),
    exportedAt: z.string().datetime(),
    entries: z.array(
      z.object({ pathname: z.string(), value: z.unknown() }).strict(),
    ),
  })
  .strict();
export function validateBackup(raw: unknown) {
  const backup = backupSchema.parse(raw);
  const paths = new Set<string>();
  for (const entry of backup.entries) {
    if (paths.has(entry.pathname))
      throw new DomainError("Backup con rutas duplicadas.");
    paths.add(entry.pathname);
    if (entry.pathname === "data/v1/catalog.json") {
      const state = catalogStateSchema.parse(entry.value);
      if (
        new Set(state.products.map((p) => p.code)).size !==
        state.products.length
      )
        throw new DomainError("Backup con códigos de vidrio duplicados.");
      const legacyCodes = state.values.filter((v) => v.code);
      if (
        new Set(legacyCodes.map((v) => `${v.category}/${v.code}`)).size !==
        legacyCodes.length
      )
        throw new DomainError("Backup con códigos base duplicados.");
      if (
        new Set([...state.products, ...state.values].map((v) => v.id)).size !==
        state.products.length + state.values.length
      )
        throw new DomainError("Backup con IDs duplicados.");
      for (const p of state.products)
        for (const [id, category] of [
          [p.familyId, "families"],
          [p.thicknessId, "thicknesses"],
          [p.colorFinishId, "colors-finishes"],
          [p.cathedralDesignId, "cathedral-designs"],
        ]) {
          if (
            id &&
            !state.values.some((v) => v.id === id && v.category === category)
          )
            throw new DomainError("Backup con referencias inválidas.");
        }
      entry.value = state;
    } else if (entry.pathname === "data/v1/aluminum-catalog.json") {
      const state = aluminumCatalogSchema.parse(entry.value);
      if (new Set(state.profiles.map((profile) => profile.code)).size !== state.profiles.length)
        throw new DomainError("Backup con códigos de perfil duplicados.");
      if (new Set([...state.families, ...state.colors, ...state.profiles].map((value) => value.id)).size !==
        state.families.length + state.colors.length + state.profiles.length)
        throw new DomainError("Backup de perfiles con IDs duplicados.");
      for (const profile of state.profiles) {
        if (!state.families.some((family) => family.id === profile.familyId))
          throw new DomainError("Backup con familias de perfil inválidas.");
        if (profile.colorPrices.some((price) => !state.colors.some((color) => color.id === price.colorId)))
          throw new DomainError("Backup con colores de perfil inválidos.");
      }
      entry.value = state;
    } else if (/^data\/v1\/quotations\/[A-Z]{3}-\d{5,}\.json$/.test(entry.pathname)) {
      const q = quotationSchema.parse(entry.value);
      if (!entry.pathname.endsWith(`-${q.number.slice(4)}.json`))
        throw new DomainError("El número no coincide con el archivo.");
      entry.value = q;
    } else throw new DomainError("Ruta no admitida en backup.");
  }
  return backup;
}
export async function exportBackup(store: JsonStore) {
  const entries = await Promise.all(
    (await store.paths("data/v1/")).map(async (pathname) => {
      const blob = await store.read(pathname);
      if (!blob)
        throw new DomainError(
          "El almacenamiento cambió durante la exportación. Reintenta.",
        );
      return { pathname, value: blob.value };
    }),
  );
  return validateBackup({
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    entries,
  });
}
export async function importBackup(
  store: JsonStore,
  raw: unknown,
  overwrite: boolean,
) {
  const backup = validateBackup(raw);
  const plan = await Promise.all(
    backup.entries.map(async (entry) => {
      const current = await store.read(entry.pathname);
      if (
        current &&
        JSON.stringify(current.value) === JSON.stringify(entry.value)
      )
        return null;
      if (current && entry.pathname.includes("/quotations/"))
        throw new DomainError(
          "Una cotización confirmada nunca puede sobrescribirse.",
        );
      if (current && !overwrite)
        throw new DomainError(
          "Hay datos existentes. Usa --overwrite para restaurar el catálogo.",
        );
      return { ...entry, etag: current?.etag };
    }),
  );
  for (const entry of plan)
    if (entry) await store.write(entry.pathname, entry.value, entry.etag);
  return plan.filter(Boolean).length;
}

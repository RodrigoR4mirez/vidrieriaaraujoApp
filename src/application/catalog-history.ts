import { randomUUID } from "node:crypto";
import { z } from "zod";
import { aluminumCatalogSchema } from "@/domain/aluminum/models";
import { catalogStateSchema } from "@/domain/catalogs/models";
import type { JsonStore } from "./json-store";

export const CATALOG_PATH = "data/v1/catalog.json" as const;
export const ALUMINUM_CATALOG_PATH = "data/v1/aluminum-catalog.json" as const;
export const CATALOG_HISTORY_PREFIX = "data/history/v1/catalogs/" as const;

const sourcePathSchema = z.union([
  z.literal(CATALOG_PATH),
  z.literal(ALUMINUM_CATALOG_PATH),
]);

export const catalogHistorySchema = z
  .object({
    schemaVersion: z.literal(1),
    capturedAt: z.string().datetime(),
    sourcePath: sourcePathSchema,
    value: z.unknown(),
  })
  .strict();

export function validateCatalogValue(
  sourcePath: string,
  value: unknown,
) {
  if (sourcePath === CATALOG_PATH) return catalogStateSchema.parse(value);
  if (sourcePath === ALUMINUM_CATALOG_PATH)
    return aluminumCatalogSchema.parse(value);
  throw new Error(`Ruta de catálogo no admitida: ${sourcePath}`);
}

export function parseCatalogHistory(raw: unknown) {
  const entry = catalogHistorySchema.parse(raw);
  return {
    ...entry,
    value: validateCatalogValue(entry.sourcePath, entry.value),
  };
}

function historyKind(sourcePath: string) {
  if (sourcePath === CATALOG_PATH) return "glass";
  if (sourcePath === ALUMINUM_CATALOG_PATH) return "aluminum";
  throw new Error(`Ruta de catálogo no admitida: ${sourcePath}`);
}

export function catalogHistoryPath(sourcePath: string, capturedAt: Date) {
  const timestamp = capturedAt.toISOString().replaceAll(":", "-");
  return `${CATALOG_HISTORY_PREFIX}${historyKind(sourcePath)}/${timestamp}-${randomUUID()}.json`;
}

export async function captureCatalogVersion(
  store: JsonStore,
  sourcePath: string,
  value: unknown,
  capturedAt = new Date(),
) {
  const validatedValue = validateCatalogValue(sourcePath, value);
  const entry = {
    schemaVersion: 1 as const,
    capturedAt: capturedAt.toISOString(),
    sourcePath: sourcePathSchema.parse(sourcePath),
    value: validatedValue,
  };
  const pathname = catalogHistoryPath(sourcePath, capturedAt);
  await store.write(pathname, entry);
  return { pathname, entry };
}

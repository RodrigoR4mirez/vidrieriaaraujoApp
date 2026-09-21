import { randomUUID } from "node:crypto";
import {
  catalogStateSchema,
  emptyCatalog,
  type CatalogState,
  type ProductInput,
  type BaseInput,
  type Product,
  type BaseValue,
} from "@/domain/catalogs/models";
import {
  AlreadyExistsError,
  ConflictError,
  DomainError,
} from "@/domain/errors";
import {
  formatQuotationNumber,
  numberSchema,
  quotationSchema,
  type Quotation,
} from "@/domain/quotation/models";
import type {
  GlassRepository,
  BaseCatalogRepository,
  QuotationRepository,
  AluminumCatalogRepository,
} from "@/application/repositories";
import {
  aluminumCatalogSchema,
  emptyAluminumCatalog,
  type AluminumCatalog,
  type AluminumColor,
  type AluminumColorInput,
  type AluminumFamily,
  type AluminumFamilyInput,
  type AluminumProfile,
  type AluminumProfileInput,
} from "@/domain/aluminum/models";
import type { JsonStore } from "./store";
export const CATALOG_PATH = "data/v1/catalog.json";
export const ALUMINUM_CATALOG_PATH = "data/v1/aluminum-catalog.json";
export const QUOTATION_PREFIX = "data/v1/quotations/";
const MAX_RETRIES = 20;
export class BlobCatalogDocument {
  constructor(private store: JsonStore) {}
  async read() {
    const current = await this.store.read(CATALOG_PATH);
    return {
      state: current ? catalogStateSchema.parse(current.value) : emptyCatalog(),
      etag: current?.etag,
    };
  }
  async mutate<T>(operation: (state: CatalogState) => T): Promise<T> {
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const { state, etag } = await this.read();
      const result = operation(state);
      try {
        await this.store.write(
          CATALOG_PATH,
          catalogStateSchema.parse(state),
          etag,
        );
        return result;
      } catch (error) {
        if (
          !(error instanceof ConflictError || error instanceof AlreadyExistsError) ||
          attempt === MAX_RETRIES - 1
        )
          throw error;
      }
    }
    throw new ConflictError();
  }
}
function ensureRevision(
  existing: { revision: number } | undefined,
  id?: string,
  revision?: number,
) {
  if (id && !existing) throw new DomainError("Registro inexistente.");
  if (existing && existing.revision !== revision) throw new ConflictError();
}
function metadata(existing?: Product | BaseValue | AluminumFamily | AluminumColor | AluminumProfile) {
  const now = new Date().toISOString();
  return {
    id: existing?.id || randomUUID(),
    schemaVersion: 1 as const,
    revision: (existing?.revision || 0) + 1,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };
}

export class BlobAluminumCatalogDocument {
  constructor(private store: JsonStore) {}
  async read() {
    const current = await this.store.read(ALUMINUM_CATALOG_PATH);
    return {
      state: current ? aluminumCatalogSchema.parse(current.value) : emptyAluminumCatalog(),
      etag: current?.etag,
    };
  }
  async mutate<T>(operation: (state: AluminumCatalog) => T): Promise<T> {
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const { state, etag } = await this.read();
      const result = operation(state);
      try {
        await this.store.write(ALUMINUM_CATALOG_PATH, aluminumCatalogSchema.parse(state), etag);
        return result;
      } catch (error) {
        if (!(error instanceof ConflictError || error instanceof AlreadyExistsError) || attempt === MAX_RETRIES - 1)
          throw error;
      }
    }
    throw new ConflictError();
  }
}

export class VercelBlobAluminumCatalogRepository implements AluminumCatalogRepository {
  constructor(private document: BlobAluminumCatalogDocument) {}
  async catalog() {
    return (await this.document.read()).state;
  }
  saveFamily(input: AluminumFamilyInput, id?: string, revision?: number) {
    return this.document.mutate((state) => {
      const existing = state.families.find((value) => value.id === id);
      ensureRevision(existing, id, revision);
      const family = { ...input, ...metadata(existing) };
      state.families = [...state.families.filter((value) => value.id !== id), family];
      return family;
    });
  }
  saveColor(input: AluminumColorInput, id?: string, revision?: number) {
    return this.document.mutate((state) => {
      const existing = state.colors.find((value) => value.id === id);
      ensureRevision(existing, id, revision);
      const color = { ...input, ...metadata(existing) };
      state.colors = [...state.colors.filter((value) => value.id !== id), color];
      return color;
    });
  }
  saveProfile(input: AluminumProfileInput, id?: string, revision?: number) {
    return this.document.mutate((state) => {
      const existing = state.profiles.find((value) => value.id === id);
      ensureRevision(existing, id, revision);
      if (state.profiles.some((value) => value.code === input.code && value.id !== id))
        throw new DomainError("Código de perfil duplicado.");
      if (!state.families.some((family) => family.id === input.familyId))
        throw new DomainError("La familia de perfil no existe.");
      const colorIds = input.colorPrices.map((entry) => entry.colorId);
      if (new Set(colorIds).size !== colorIds.length)
        throw new DomainError("No repitas colores en un perfil.");
      if (colorIds.some((colorId) => !state.colors.some((color) => color.id === colorId)))
        throw new DomainError("Uno de los colores no existe.");
      const profile = { ...existing, ...input, ...metadata(existing) };
      state.profiles = [...state.profiles.filter((value) => value.id !== id), profile];
      return profile;
    });
  }
  seed(catalog: AluminumCatalog) {
    const seed = aluminumCatalogSchema.parse(catalog);
    return this.document.mutate((state) => {
      if (state.families.length || state.colors.length || state.profiles.length) {
        if (state.profiles.length === seed.profiles.length &&
          state.profiles.every((profile) => seed.profiles.some((entry) => entry.code === profile.code)))
          return state;
        throw new DomainError("El catálogo de perfiles ya contiene datos. La carga inicial no sobrescribe registros.");
      }
      state.families = seed.families;
      state.colors = seed.colors;
      state.profiles = seed.profiles;
      return state;
    });
  }
}
export class VercelBlobGlassRepository implements GlassRepository {
  constructor(private document: BlobCatalogDocument) {}
  async catalog() {
    return (await this.document.read()).state;
  }
  save(input: ProductInput, id?: string, revision?: number) {
    return this.document.mutate((state) => {
      const existing = state.products.find((p) => p.id === id);
      ensureRevision(existing, id, revision);
      if (state.products.some((p) => p.code === input.code && p.id !== id))
        throw new DomainError("Código duplicado.");
      const refs = [
        [input.familyId, "families"],
        [input.thicknessId, "thicknesses"],
        [input.colorFinishId, "colors-finishes"],
        [input.cathedralDesignId, "cathedral-designs"],
      ] as const;
      for (const [ref, category] of refs) {
        if (
          ref &&
          !state.values.some((v) => v.id === ref && v.category === category)
        )
          throw new DomainError("La opción de catálogo no existe.");
      }
      if (Boolean(input.sheetWidthCm) !== Boolean(input.sheetHeightCm))
        throw new DomainError("Completa ambas medidas de plancha.");
      const product = { ...input, ...metadata(existing) };
      state.products = [...state.products.filter((p) => p.id !== id), product];
      return product;
    });
  }
}
export class VercelBlobBaseCatalogRepository implements BaseCatalogRepository {
  constructor(private document: BlobCatalogDocument) {}
  async list() {
    return (await this.document.read()).state.values;
  }
  save(input: BaseInput, id?: string, revision?: number) {
    return this.document.mutate((state) => {
      const existing = state.values.find((v) => v.id === id);
      ensureRevision(existing, id, revision);
      if (existing && existing.category !== input.category)
        throw new DomainError("No se puede cambiar el tipo de catálogo.");
      const value = { ...existing, ...input, ...metadata(existing) };
      state.values = [...state.values.filter((v) => v.id !== id), value];
      return value;
    });
  }
}
export class VercelBlobQuotationRepository implements QuotationRepository {
  constructor(private store: JsonStore) {}
  async list() {
    const paths = (await this.store.paths(QUOTATION_PREFIX)).filter((p) =>
      /\/[A-Z]{3}-\d{5,}\.json$/.test(p),
    );
    const values: Quotation[] = [];
    // Bound read concurrency for a growing history.
    for (let offset = 0; offset < paths.length; offset += 20) {
      const batch = await Promise.all(
        paths.slice(offset, offset + 20).map(async (path) => {
          const record = await this.store.read(path);
          if (!record) throw new Error("Histórico incompleto");
          return quotationSchema.parse(record.value);
        }),
      );
      values.push(...batch);
    }
    return values.sort(
      (a, b) => Number(b.number.slice(4)) - Number(a.number.slice(4)),
    );
  }
  async find(number: string) {
    numberSchema.parse(number);
    const suffix = `-${number.slice(4)}.json`;
    const pathname = (await this.store.paths(QUOTATION_PREFIX)).find((path) =>
      path.endsWith(suffix),
    );
    if (!pathname) return null;
    const record = await this.store.read(pathname);
    return record ? quotationSchema.parse(record.value) : null;
  }
  async nextNumber() {
    // Only the provisional folio is needed here, not every historical snapshot.
    let maximum = 0;
    for (const path of await this.store.paths(QUOTATION_PREFIX)) {
      const match = /^[A-Z]{3}-(\d{5,})\.json$/.exec(
        path.slice(QUOTATION_PREFIX.length),
      );
      if (match) maximum = Math.max(maximum, Number(match[1]));
    }
    return formatQuotationNumber(maximum + 1);
  }
  async confirm(snapshot: Omit<Quotation, "number">) {
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const all = await this.list();
      const existing = all.find((q) => q.id === snapshot.id);
      if (existing) return existing;
      const next = formatQuotationNumber(
        Math.max(0, ...all.map((q) => Number(q.number.slice(4)))) + 1,
      );
      const quotation = quotationSchema.parse({ ...snapshot, number: next });
      try {
        await this.store.write(`${QUOTATION_PREFIX}${next}.json`, quotation);
        return quotation;
      } catch (error) {
        if (!(error instanceof AlreadyExistsError)) throw error;
        const winner = await this.find(next);
        if (winner?.id === snapshot.id) return winner;
      }
    }
    throw new ConflictError(
      "Hay otras cotizaciones confirmándose. Vuelve a intentarlo.",
    );
  }
}

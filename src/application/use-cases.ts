import {
  baseInputSchema,
  productInputSchema,
  priceInputSchema,
  isQuotable,
  productDetails,
} from "@/domain/catalogs/models";
import { DomainError } from "@/domain/errors";
import {
  calculateItem,
  calculateProfileBar,
  calculateProfileMeters,
  calculateSheet,
  quotationSubtotal,
  quotationTotal,
} from "@/domain/quotation/calculation";
import {
  draftSchema,
  isProfileDraftItem,
  type DraftItem,
  type QuotationItem,
} from "@/domain/quotation/models";
import type { CatalogState } from "@/domain/catalogs/models";
import {
  emptyAluminumCatalog,
  isProfileQuotable,
  profilePrice,
  type AluminumCatalog,
} from "@/domain/aluminum/models";
import type {
  AluminumCatalogRepository,
  BaseCatalogRepository,
  GlassRepository,
  QuotationRepository,
} from "./repositories";
export function priceDraft(
  items: DraftItem[],
  catalog: CatalogState,
  aluminum: AluminumCatalog = emptyAluminumCatalog(),
): QuotationItem[] {
  return items.map((item) => {
    if (isProfileDraftItem(item)) {
      const profile = aluminum.profiles.find((entry) => entry.id === item.profileId);
      const color = aluminum.colors.find((entry) => entry.id === item.colorId);
      const family = profile && aluminum.families.find((entry) => entry.id === profile.familyId);
      if (!profile || !color || !family)
        throw new DomainError("Perfil, familia o color inexistente. Actualiza el catálogo.");
      if (!isProfileQuotable(profile, item.colorId, aluminum))
        throw new DomainError("Perfil oculto, color oculto o sin precio. Actualiza la cotización.");
      const common = {
        profileCode: profile.code,
        profileDescription: profile.description,
        family: family.name,
        color: color.name,
        imagePath: profile.imagePath,
        barLengthMeters: profile.barLengthMeters,
        pricePerBar: profilePrice(profile, item.colorId)!,
      };
      if (item.mode === "PROFILE_METERS")
        return {
          ...item,
          ...common,
          ...calculateProfileMeters({
            pricePerBar: common.pricePerBar,
            barLengthMeters: common.barLengthMeters,
            metersRequested: item.metersRequested,
            measurementUnit: item.measurementUnit,
            measurementValue: item.measurementValue,
            quantity: item.quantity,
          }),
        };
      return {
        ...item,
        ...common,
        ...calculateProfileBar({
          pricePerBar: common.pricePerBar,
          barLengthMeters: common.barLengthMeters,
          quantity: item.quantity,
        }),
      };
    }
    const product = catalog.products.find((p) => p.id === item.productId);
    if (!product)
      throw new DomainError("Producto inexistente. Actualiza el catálogo.");
    if (!isQuotable(product, catalog.values, item.mode ?? "SQUARE_FOOT"))
      throw new DomainError(
        "Producto oculto, con opciones ocultas o sin precio para esta modalidad. Actualiza la cotización.",
      );
    const description = {
      productCode: product.code,
      ...productDetails(product, catalog.values),
    };
    if (item.mode === "SHEET") return {
      ...item,
      ...description,
      sheetWidthCm: product.sheetWidthCm,
      sheetHeightCm: product.sheetHeightCm,
      ...calculateSheet({ pricePerSheet: product.pricePerSheet || "0", quantity: item.quantity }),
    };
    return {
      ...item,
      ...description,
      ...calculateItem({
        ...item,
        pricePerSquareFoot: product.pricePerSquareFoot,
      }),
    };
  });
}
export class CatalogService {
  constructor(
    private glass: GlassRepository,
    private bases: BaseCatalogRepository,
  ) {}
  load() {
    return this.glass.catalog();
  }
  async saveProduct(raw: unknown, id?: string, revision?: number) {
    const input = productInputSchema.parse(raw);
    const existing = id
      ? (await this.glass.catalog()).products.find((p) => p.id === id)
      : undefined;
    for (const field of ["pricePerSquareFoot", "pricePerSheet"] as const) {
      const price = input[field];
      // Existing prices stay exact until explicitly changed; no data migration.
      if (price !== undefined && price !== existing?.[field])
        priceInputSchema.parse(price);
    }
    return this.glass.save(input, id, revision);
  }
  saveBase(raw: unknown, id?: string, revision?: number) {
    return this.bases.save(baseInputSchema.parse(raw), id, revision);
  }
}
export class QuotationService {
  constructor(
    private glass: GlassRepository,
    private quotations: QuotationRepository,
    private aluminum?: AluminumCatalogRepository,
  ) {}
  async confirm(raw: unknown) {
    const draft = draftSchema.parse(raw);
    // Recover an already committed response after a timeout before checking mutable catalog data.
    const existing = (await this.quotations.list()).find(
      (q) => q.id === draft.requestId,
    );
    if (existing) return existing;
    if (new Set(draft.items.map((i) => i.id)).size !== draft.items.length)
      throw new DomainError("Los ítems no deben repetirse.");
    const [glassCatalog, aluminumCatalog] = await Promise.all([
      this.glass.catalog(),
      this.aluminum?.catalog() ?? Promise.resolve(emptyAluminumCatalog()),
    ]);
    const items = priceDraft(draft.items, glassCatalog, aluminumCatalog);
    const now = new Date().toISOString();
    return this.quotations.confirm({
      schemaVersion: 1,
      id: draft.requestId,
      status: "CONFIRMED",
      createdAt: now,
      confirmedAt: now,
      timezone: "America/Lima",
      customerName: draft.customerName,
      conditions: draft.conditions,
      subtotal: quotationSubtotal(items),
      total: quotationTotal(items),
      items,
    });
  }
  list() {
    return this.quotations.list();
  }
  find(number: string) {
    return this.quotations.find(number);
  }
  nextNumber() {
    return this.quotations.nextNumber();
  }
}

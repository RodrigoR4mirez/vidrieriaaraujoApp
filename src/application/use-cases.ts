import {
  baseInputSchema,
  productInputSchema,
  isQuotable,
  productDetails,
} from "@/domain/catalogs/models";
import { DomainError } from "@/domain/errors";
import { calculateItem, quotationTotal } from "@/domain/quotation/calculation";
import {
  draftSchema,
  type DraftItem,
  type QuotationItem,
} from "@/domain/quotation/models";
import type { CatalogState } from "@/domain/catalogs/models";
import type {
  BaseCatalogRepository,
  GlassRepository,
  QuotationRepository,
} from "./repositories";
export function priceDraft(
  items: DraftItem[],
  catalog: CatalogState,
): QuotationItem[] {
  return items.map((item) => {
    const product = catalog.products.find((p) => p.id === item.productId);
    if (!product)
      throw new DomainError("Producto inexistente. Actualiza el catálogo.");
    if (!isQuotable(product, catalog.values))
      throw new DomainError(
        "Producto oculto o con opciones ocultas. Actualiza la proforma.",
      );
    return {
      ...item,
      productCode: product.code,
      ...productDetails(product, catalog.values),
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
  saveProduct(raw: unknown, id?: string, revision?: number) {
    return this.glass.save(productInputSchema.parse(raw), id, revision);
  }
  saveBase(raw: unknown, id?: string, revision?: number) {
    return this.bases.save(baseInputSchema.parse(raw), id, revision);
  }
}
export class QuotationService {
  constructor(
    private glass: GlassRepository,
    private quotations: QuotationRepository,
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
    const items = priceDraft(draft.items, await this.glass.catalog());
    const now = new Date().toISOString();
    return this.quotations.confirm({
      schemaVersion: 1,
      id: draft.requestId,
      status: "CONFIRMED",
      createdAt: now,
      confirmedAt: now,
      timezone: "America/Lima",
      conditions: draft.conditions,
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

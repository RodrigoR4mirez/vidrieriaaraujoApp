import type {
  BaseInput,
  BaseValue,
  CatalogState,
  Product,
  ProductInput,
} from "@/domain/catalogs/models";
import type { Quotation } from "@/domain/quotation/models";
export interface GlassRepository {
  catalog(): Promise<CatalogState>;
  save(input: ProductInput, id?: string, revision?: number): Promise<Product>;
}
export interface BaseCatalogRepository {
  list(): Promise<BaseValue[]>;
  save(input: BaseInput, id?: string, revision?: number): Promise<BaseValue>;
}
export interface QuotationRepository {
  list(): Promise<Quotation[]>;
  find(number: string): Promise<Quotation | null>;
  confirm(snapshot: Omit<Quotation, "number">): Promise<Quotation>;
  nextNumber(): Promise<string>;
}

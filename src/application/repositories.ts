import type {
  BaseInput,
  BaseValue,
  CatalogState,
  Product,
  ProductInput,
} from "@/domain/catalogs/models";
import type { Quotation } from "@/domain/quotation/models";
import type {
  AluminumCatalog,
  AluminumColor,
  AluminumColorInput,
  AluminumFamily,
  AluminumFamilyInput,
  AluminumProfile,
  AluminumProfileInput,
} from "@/domain/aluminum/models";
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
export interface AluminumCatalogRepository {
  catalog(): Promise<AluminumCatalog>;
  saveFamily(input: AluminumFamilyInput, id?: string, revision?: number): Promise<AluminumFamily>;
  saveColor(input: AluminumColorInput, id?: string, revision?: number): Promise<AluminumColor>;
  saveProfile(input: AluminumProfileInput, id?: string, revision?: number): Promise<AluminumProfile>;
  seed(catalog: AluminumCatalog): Promise<AluminumCatalog>;
}

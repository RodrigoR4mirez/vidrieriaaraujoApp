import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { AlreadyExistsError, ConflictError } from "@/domain/errors";
import {
  BlobCatalogDocument,
  VercelBlobGlassRepository,
  VercelBlobBaseCatalogRepository,
  VercelBlobQuotationRepository,
} from "@/infrastructure/persistence/blob/repositories";
import type { JsonStore } from "@/infrastructure/persistence/blob/store";
import { QuotationService, CatalogService } from "@/application/use-cases";
import { quotationSchema } from "@/domain/quotation/models";
import { catalogStateSchema, isQuotable } from "@/domain/catalogs/models";
import { validateBackup, exportBackup, importBackup } from "@/application/backup";
import { quotationItemDetail } from "@/lib/quotation-item";
import { quotationText, whatsappUrl } from "@/lib/sharing";
class MemoryStore implements JsonStore {
  records = new Map<string, { value: unknown; etag: string }>();
  async read(path: string) {
    return structuredClone(this.records.get(path) || null);
  }
  async paths(prefix: string) {
    return [...this.records.keys()].filter((k) => k.startsWith(prefix));
  }
  async write(path: string, value: unknown, etag?: string) {
    const current = this.records.get(path);
    if (!etag && current) throw new AlreadyExistsError();
    if (etag && current?.etag !== etag) throw new ConflictError();
    this.records.set(path, {
      value: structuredClone(value),
      etag: randomUUID(),
    });
  }
}
async function fixture() {
  const store = new MemoryStore(),
    document = new BlobCatalogDocument(store);
  const glass = new VercelBlobGlassRepository(document),
    bases = new VercelBlobBaseCatalogRepository(document),
    quotations = new VercelBlobQuotationRepository(store);
  const catalog = new CatalogService(glass, bases),
    service = new QuotationService(glass, quotations);
  const family = await catalog.saveBase({
    category: "families",
    code: "COM",
    name: "Cristal común",
    status: "ACTIVE",
  });
  const thickness = await catalog.saveBase({
    category: "thicknesses",
    code: "E06",
    name: "6 mm",
    status: "ACTIVE",
  });
  const product = await catalog.saveProduct({
    code: "COM-06",
    familyId: family.id,
    thicknessId: thickness.id,
    pricePerSquareFoot: "3.50",
    status: "ACTIVE",
  });
  const draft = () => ({
    requestId: randomUUID(),
    conditions: "Entrega coordinada con el cliente.",
    items: [
      {
        id: randomUUID(),
        productId: product.id,
        widthCm: "100",
        heightCm: "80",
        quantity: 2,
      },
    ],
  });
  return {
    store,
    glass,
    bases,
    quotations,
    catalog,
    service,
    product,
    family,
    draft,
  };
}
describe("repositories y casos de uso", () => {
  it("guarda precios omitidos o vacíos como cero y filtra por modalidad", async () => {
    const f = await fixture();
    const zero = await f.catalog.saveProduct({ ...f.product, code: "PENDIENTE", pricePerSquareFoot: "", pricePerSheet: undefined });
    expect(zero).toMatchObject({ pricePerSquareFoot: "0.00", pricePerSheet: "0.00" });
    const sheet = await f.catalog.saveProduct({ ...zero, code: "PLANCHA", pricePerSheet: "111.11" });
    const values = (await f.catalog.load()).values;
    expect(isQuotable(zero, values, "SQUARE_FOOT")).toBe(false);
    expect(isQuotable(zero, values, "SHEET")).toBe(false);
    expect(isQuotable(f.product, values, "SQUARE_FOOT")).toBe(true);
    expect(isQuotable(f.product, values, "SHEET")).toBe(false);
    expect(isQuotable(sheet, values, "SQUARE_FOOT")).toBe(false);
    expect(isQuotable(sheet, values, "SHEET")).toBe(true);
    expect(isQuotable({ ...sheet, status: "HIDDEN" }, values, "SHEET")).toBe(false);
    expect(isQuotable(sheet, values.map((v) => ({ ...v, status: "HIDDEN" })), "SHEET")).toBe(false);
    await expect(f.catalog.saveProduct({ ...zero, code: "NEGATIVO", pricePerSheet: "-1.00" })).rejects.toThrow();
    await expect(f.service.confirm({ ...f.draft(), items: [{ id: randomUUID(), productId: zero.id, mode: "SHEET", quantity: 1 }] })).rejects.toThrow("sin precio");
    await expect(f.service.confirm({ ...f.draft(), items: [{ ...f.draft().items[0], productId: zero.id }] })).rejects.toThrow("sin precio");
  });
  it("confirma una proforma mixta y conserva precio/modalidad tras modificar catálogo", async () => {
    const f = await fixture();
    const product = await f.catalog.saveProduct({ ...f.product, pricePerSheet: "111.11", sheetWidthCm: "200", sheetHeightCm: "300" }, f.product.id, f.product.revision);
    const draft = f.draft();
    const q = await f.service.confirm({ ...draft, items: [...draft.items, { id: randomUUID(), productId: product.id, mode: "SHEET", quantity: 3 }] });
    expect(q.subtotal).toBe("395.57");
    expect(q.total).toBe("396.00");
    expect(q.items[0].itemAmount).toBe("62.24");
    expect(q.items[1]).toMatchObject({ mode: "SHEET", pricePerSheet: "111.11", quantity: 3, itemAmount: "333.33", sheetWidthCm: "200", sheetHeightCm: "300" });
    expect(q.items[1]).not.toHaveProperty("areaFt2");
    expect(quotationItemDetail(q.items[1])).toBe("Plancha entera · 200 × 300 cm");
    expect(quotationText(q)).toContain("Plancha entera");
    expect(decodeURIComponent(whatsappUrl(q))).toContain("SUBTOTAL EXACTO: S/ 395.57");
    expect(decodeURIComponent(whatsappUrl(q))).toContain("TOTAL A COBRAR: S/ 396.00");
    await f.catalog.saveProduct({ ...product, pricePerSheet: "0.00" }, product.id, product.revision);
    expect(await f.service.find(q.number)).toEqual(q);
    await expect(f.service.confirm({ requestId: randomUUID(), items: [{ id: randomUUID(), productId: product.id, mode: "SHEET", quantity: 1 }] })).rejects.toThrow("sin precio");
  });
  it("lee y respalda el histórico sin modalidad sin modificar su JSON", async () => {
    const f = await fixture();
    const q = await f.service.confirm(f.draft());
    expect(q.items[0]).not.toHaveProperty("mode");
    const original = JSON.stringify(f.store.records.get(`data/v1/quotations/${q.number}.json`)?.value);
    expect(await f.service.find(q.number)).toEqual(q);
    expect(await importBackup(f.store, await exportBackup(f.store), false)).toBe(0);
    expect(JSON.stringify(f.store.records.get(`data/v1/quotations/${q.number}.json`)?.value)).toBe(original);
  });
  it("edita bases sin códigos y preserva campos antiguos, IDs y precios existentes", async () => {
    const f = await fixture();
    const record = f.store.records.get("data/v1/catalog.json")!;
    const state = catalogStateSchema.parse(record.value);
    const family = state.values.find((v) => v.id === f.family.id)!;
    family.code = "LEGACY";
    family.observation = "Observación existente";
    state.products[0].pricePerSquareFoot = "3.505";
    record.value = state;
    const updated = await f.catalog.saveBase({
      name: "Familia actualizada", description: "", category: family.category, status: family.status,
    }, family.id, family.revision);
    expect(updated).toMatchObject({ id: family.id, code: "LEGACY", observation: "Observación existente" });
    await f.catalog.saveBase({ name: "Otra familia", category: "families", status: "ACTIVE" });
    await f.catalog.saveProduct({ ...state.products[0], status: "HIDDEN" }, f.product.id, f.product.revision);
    const loaded = await f.catalog.load();
    expect(loaded.products[0]).toMatchObject({ familyId: family.id, pricePerSquareFoot: "3.505" });
    expect(loaded.values.find((v) => v.name === "Otra familia")).not.toHaveProperty("code");
    expect(() => validateBackup({ schemaVersion: 1, exportedAt: new Date().toISOString(),
      entries: [{ pathname: "data/v1/catalog.json", value: loaded }],
    })).not.toThrow();
    await expect(f.catalog.saveProduct({ ...f.product, code: "INVALID", pricePerSquareFoot: "1.111" })).rejects.toThrow("dos decimales");
  });
  it("conserva ambas altas cuando dos dispositivos inicializan el catálogo", async () => {
    const store = new MemoryStore();
    const bases = new VercelBlobBaseCatalogRepository(new BlobCatalogDocument(store));
    await Promise.all(["COM", "LAM"].map((code) => bases.save({
      category: "families", name: code, status: "ACTIVE", description: "",
    })));
    expect((await bases.list()).map((value) => value.name).sort()).toEqual(["COM", "LAM"]);
  });
  it("confirma, serializa y comparte el mismo snapshot", async () => {
    const f = await fixture();
    const q = await f.service.confirm(f.draft());
    expect(q.number).toBe("PRO-00001");
    expect(q.subtotal).toBe("62.24");
    expect(q.total).toBe("62.50");
    expect(quotationSchema.parse(JSON.parse(JSON.stringify(q)))).toEqual(q);
    expect(quotationText(q)).toContain("SUBTOTAL EXACTO: S/ 62.24");
    expect(quotationText(q)).toContain("TOTAL A COBRAR: S/ 62.50");
    expect(decodeURIComponent(whatsappUrl(q))).toContain(q.number);
    await f.catalog.saveProduct(
      { ...f.product, pricePerSquareFoot: "100.00" },
      f.product.id,
      f.product.revision,
    );
    expect((await f.service.find(q.number))?.total).toBe("62.50");
  });
  it("asigna números únicos crecientes en confirmaciones simultáneas", async () => {
    const f = await fixture();
    const results = await Promise.all(
      Array.from({ length: 8 }, () => f.service.confirm(f.draft())),
    );
    expect(new Set(results.map((q) => q.number)).size).toBe(8);
    expect(await f.service.nextNumber()).toBe("PRO-00009");
  });
  it("un reintento concurrente de la misma confirmación no duplica", async () => {
    const f = await fixture(),
      draft = f.draft();
    const results = await Promise.all([
      f.service.confirm(draft),
      f.service.confirm(draft),
    ]);
    expect(results[0].number).toBe(results[1].number);
    expect(await f.service.list()).toHaveLength(1);
  });
  it("no sobrescribe proformas confirmadas", async () => {
    const f = await fixture(),
      q = await f.service.confirm(f.draft());
    await expect(
      f.store.write(`data/v1/quotations/${q.number}.json`, {
        ...q,
        total: "0",
      }),
    ).rejects.toBeInstanceOf(AlreadyExistsError);
  });
  it("rechaza SKU duplicado incluso bajo concurrencia", async () => {
    const f = await fixture();
    const results = await Promise.allSettled([
      f.catalog.saveProduct({ ...f.product, code: "NEW" }),
      f.catalog.saveProduct({ ...f.product, code: "new" }),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect((await f.glass.catalog()).products).toHaveLength(2);
  });
  it("detecta edición obsoleta sin perder el cambio anterior", async () => {
    const f = await fixture();
    await f.catalog.saveProduct(
      { ...f.product, pricePerSquareFoot: "4.00" },
      f.product.id,
      1,
    );
    await expect(
      f.catalog.saveProduct(
        { ...f.product, pricePerSquareFoot: "5.00" },
        f.product.id,
        1,
      ),
    ).rejects.toBeInstanceOf(ConflictError);
    expect((await f.catalog.load()).products[0].pricePerSquareFoot).toBe("4.00");
  });
  it("oculta, conserva y reactiva productos", async () => {
    const f = await fixture();
    const hidden = await f.catalog.saveProduct(
      { ...f.product, status: "HIDDEN" },
      f.product.id,
      1,
    );
    await expect(f.service.confirm(f.draft())).rejects.toThrow("oculto");
    await f.catalog.saveProduct(
      { ...hidden, status: "ACTIVE" },
      hidden.id,
      hidden.revision,
    );
    expect((await f.service.confirm(f.draft())).total).toBe("62.50");
  });
  it("excluye valores base ocultos de nuevas cotizaciones", async () => {
    const f = await fixture();
    await f.catalog.saveBase(
      { ...f.family, status: "HIDDEN" },
      f.family.id,
      f.family.revision,
    );
    await expect(f.service.confirm(f.draft())).rejects.toThrow("oculto");
  });
  it("rechaza referencias inválidas y totales del cliente", async () => {
    const f = await fixture();
    await expect(
      f.catalog.saveProduct({
        ...f.product,
        code: "INVALID",
        familyId: randomUUID(),
      }),
    ).rejects.toThrow("catálogo");
    await expect(
      f.service.confirm({ ...f.draft(), total: "0.01" }),
    ).rejects.toThrow();
  });
});

it("el folio provisional usa solo pathnames, sin descargar el histórico", async () => {
  const store: JsonStore = {
    async paths() { return ["data/v1/quotations/PRO-00002.json", "data/v1/quotations/PRO-100001.json", "data/v1/quotations/backup.json"]; },
    async read() { throw new Error("No debe descargar snapshots para el folio provisional"); },
    async write() { throw new Error("No debe reservar el folio provisional"); },
  };
  expect(await new VercelBlobQuotationRepository(store).nextNumber()).toBe("PRO-100002");
  store.paths = async () => [];
  expect(await new VercelBlobQuotationRepository(store).nextNumber()).toBe("PRO-00001");
});

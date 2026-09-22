import { randomUUID } from "node:crypto";
import { expect, it } from "vitest";
import {
  ALUMINUM_CATALOG_PATH,
  CATALOG_HISTORY_PREFIX,
  CATALOG_PATH,
  captureCatalogVersion,
  parseCatalogHistory,
} from "@/application/catalog-history";
import { emptyAluminumCatalog } from "@/domain/aluminum/models";
import { emptyCatalog } from "@/domain/catalogs/models";
import type { JsonStore } from "@/application/json-store";

class MemoryStore implements JsonStore {
  records = new Map<string, unknown>();

  async read(path: string) {
    const value = this.records.get(path);
    return value === undefined ? null : { value, etag: randomUUID() };
  }

  async write(path: string, value: unknown) {
    this.records.set(path, value);
  }

  async paths(prefix: string) {
    return [...this.records.keys()].filter((path) => path.startsWith(prefix));
  }
}

it("guarda y valida el historial de vidrios", async () => {
  const store = new MemoryStore();
  const captured = await captureCatalogVersion(store, CATALOG_PATH, emptyCatalog());
  expect(captured.pathname).toMatch(`${CATALOG_HISTORY_PREFIX}glass/`);
  expect(parseCatalogHistory((await store.read(captured.pathname))?.value)).toMatchObject({
    sourcePath: CATALOG_PATH,
    value: emptyCatalog(),
  });
});

it("guarda y valida el historial de aluminio", async () => {
  const store = new MemoryStore();
  const captured = await captureCatalogVersion(
    store,
    ALUMINUM_CATALOG_PATH,
    emptyAluminumCatalog(),
  );
  expect(captured.pathname).toMatch(`${CATALOG_HISTORY_PREFIX}aluminum/`);
  expect(parseCatalogHistory((await store.read(captured.pathname))?.value).sourcePath)
    .toBe(ALUMINUM_CATALOG_PATH);
});

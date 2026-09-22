import { randomUUID } from "node:crypto";
import { expect, it } from "vitest";
import { validateBackup, importBackup } from "@/application/backup";
import { emptyCatalog } from "@/domain/catalogs/models";
import aluminumSeed from "@/data/aluminum-seed.json";
const backup = {
  schemaVersion: 1,
  exportedAt: new Date().toISOString(),
  entries: [{ pathname: "data/v1/catalog.json", value: emptyCatalog() }],
};
it("valida backup y rechaza rutas fuera de datos", () => {
  expect(validateBackup(backup).entries).toHaveLength(1);
  expect(() =>
    validateBackup({
      ...backup,
      entries: [{ pathname: "../../secrets", value: {} }],
    }),
  ).toThrow();
});
it("valida el catálogo de aluminio dentro del backup", () => {
  expect(validateBackup({
    ...backup,
    entries: [{ pathname: "data/v1/aluminum-catalog.json", value: aluminumSeed }],
  }).entries).toHaveLength(1);
});
it("no modifica datos sin flag explícito y usa ETag al restaurar", async () => {
  const calls: unknown[] = [];
  const now = new Date().toISOString();
  const currentCatalog = {
    ...emptyCatalog(),
    values: [{
      id: randomUUID(),
      schemaVersion: 1 as const,
      revision: 1,
      createdAt: now,
      updatedAt: now,
      name: "Actual",
      description: "",
      status: "ACTIVE" as const,
      category: "families" as const,
    }],
  };
  const store = {
    read: async () => ({
      value: currentCatalog,
      etag: "original",
    }),
    paths: async () => [],
    write: async (...args: unknown[]) => {
      calls.push(args);
    },
  };
  await expect(importBackup(store, backup, false)).rejects.toThrow(
    "--overwrite",
  );
  expect(calls).toHaveLength(0);
  expect(await importBackup(store, backup, true)).toBe(1);
  expect(calls).toHaveLength(2);
  expect((calls[0] as unknown[])[0]).toMatch(
    /^data\/history\/v1\/catalogs\/glass\//,
  );
  expect(calls[1]).toEqual([
    "data/v1/catalog.json",
    emptyCatalog(),
    "original",
  ]);
});

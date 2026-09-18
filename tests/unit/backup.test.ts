import { expect, it } from "vitest";
import { validateBackup, importBackup } from "@/application/backup";
import { emptyCatalog } from "@/domain/catalogs/models";
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
it("no modifica datos sin flag explícito y usa ETag al restaurar", async () => {
  const calls: unknown[] = [];
  const store = {
    read: async () => ({
      value: { ...emptyCatalog(), extra: 1 },
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
  expect(calls[0]).toEqual([
    "data/v1/catalog.json",
    emptyCatalog(),
    "original",
  ]);
});

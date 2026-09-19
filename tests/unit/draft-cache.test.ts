import { expect, it } from "vitest";
import { createDraftCache, emptyDraft } from "@/lib/quotation-draft-cache";

function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() { return data.size; },
    key: (index) => [...data.keys()][index] ?? null,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => { data.set(key, value); },
    removeItem: (key) => { data.delete(key); },
    clear: () => data.clear(),
  };
}
it("recupera entradas incompletas y solicitud sin guardar precios; limpiar impide que reaparezcan", () => {
  const storage = memoryStorage();
  const store = createDraftCache("user-a", () => storage);
  store.update((draft) => ({ ...draft, customerName: "Ana Torres", conditions: "Entrega acordada",
    requestId: "00000000-0000-4000-8000-000000000001",
    form: { ...draft.form, mode: "SQUARE_FOOT", widthCm: "75", quantity: null },
  }));
  const restored = createDraftCache("user-a", () => storage);
  expect(restored.get().draft).toEqual(store.get().draft);
  expect(createDraftCache("user-b", () => storage).get().draft).toEqual(emptyDraft());
  restored.clear();
  expect(createDraftCache("user-a", () => storage).get().draft).toEqual(emptyDraft());
});
it("recupera borradores anteriores sin nombre como campo vacío", () => {
  const storage = memoryStorage();
  const legacy = emptyDraft();
  const withoutCustomer = Object.fromEntries(
    Object.entries(legacy).filter(([key]) => key !== "customerName"),
  );
  storage.setItem("draft", JSON.stringify(withoutCustomer));
  expect(createDraftCache("draft", () => storage).get().draft.customerName).toBe("");
});
it("un caché corrupto no impide crear otra proforma", () => {
  const storage = memoryStorage();
  storage.setItem("draft", '{"version":999}');
  const store = createDraftCache("draft", () => storage);
  expect(store.get().draft).toEqual(emptyDraft());
  expect(store.get().warning).not.toBe("");
  store.update((draft) => ({ ...draft, conditions: "Nuevo" }));
  expect(store.get().warning).toBe("");
  expect(createDraftCache("draft", () => storage).get().draft.conditions).toBe("Nuevo");
});
it("si el almacenamiento está bloqueado conserva memoria y avisa", () => {
  const store = createDraftCache("draft", () => { throw new Error("Storage blocked"); });
  store.update((draft) => ({ ...draft, conditions: "No perder" }));
  expect(store.get().draft.conditions).toBe("No perder");
  expect(store.get().warning).toContain("recargar");
  store.clear();
  expect(store.get().draft).toEqual(emptyDraft());
});

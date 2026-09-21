import { z } from "zod";
import { draftItemSchema } from "@/domain/quotation/models";

const formSchema = z.object({
  productType: z.enum(["GLASS", "PROFILE"]).default("GLASS"),
  mode: z.enum(["", "SQUARE_FOOT", "SHEET"]),
  familyId: z.string(), productId: z.string(),
  widthCm: z.string(), heightCm: z.string(), quantity: z.number().nullable(),
  profileMode: z.enum(["", "PROFILE_METERS", "PROFILE_BAR"]).default(""),
  profileFamilyId: z.string().default(""),
  profileId: z.string().default(""),
  colorId: z.string().default(""),
  metersRequested: z.string().default(""),
  profileMeasurementUnit: z.enum(["METERS", "CENTIMETERS"]).default("METERS"),
});
const cacheSchema = z.object({
  version: z.literal(1),
  items: z.array(draftItemSchema).max(200),
  customerName: z.string().max(160).default(""),
  conditions: z.string().max(2000),
  editId: z.string().uuid().nullable(),
  requestId: z.union([z.literal(""), z.string().uuid()]),
  form: formSchema,
});
export type QuotationForm = z.infer<typeof formSchema>;
export type CachedDraft = z.infer<typeof cacheSchema>;
export const emptyForm = (): QuotationForm => ({
  productType: "GLASS", mode: "", familyId: "", productId: "", widthCm: "", heightCm: "", quantity: 1,
  profileMode: "", profileFamilyId: "", profileId: "", colorId: "", metersRequested: "", profileMeasurementUnit: "METERS",
});
export const emptyDraft = (): CachedDraft => ({
  version: 1, items: [], customerName: "", conditions: "", editId: null, requestId: "", form: emptyForm(),
});
const prefix = "araujo:quotation-draft:v1:";
type Snapshot = { draft: CachedDraft; warning: string };
const stores = new Map<string, ReturnType<typeof createDraftCache>>();

// Ephemeral UI cache only. Never stores catalog prices, totals or credentials.
export function createDraftCache(key: string, storage: () => Storage) {
  let snapshot: Snapshot | undefined;
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((listener) => listener());
  const get = (): Snapshot => {
    if (!snapshot) {
      snapshot = { draft: emptyDraft(), warning: "" };
      try {
        const raw = storage().getItem(key);
        if (raw) snapshot.draft = cacheSchema.parse(JSON.parse(raw));
      } catch {
        snapshot.warning = "No se pudo recuperar el borrador temporal de esta pestaña.";
      }
    }
    return snapshot;
  };
  return {
    get,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    update(change: (draft: CachedDraft) => CachedDraft) {
      const draft = change(get().draft);
      let warning = "";
      try { storage().setItem(key, JSON.stringify(draft)); }
      catch { warning = "El borrador se conserva al navegar, pero este navegador no permite guardarlo al recargar. No cierres esta pestaña."; }
      snapshot = { draft, warning };
      emit();
    },
    clear() {
      let warning = "";
      try { storage().removeItem(key); }
      catch { warning = "No se pudo limpiar la copia temporal del navegador."; }
      snapshot = { draft: emptyDraft(), warning };
      emit();
    },
  };
}
export function draftCache(owner: string) {
  const key = prefix + owner;
  let store = stores.get(key);
  if (!store) { store = createDraftCache(key, () => window.sessionStorage); stores.set(key, store); }
  return store;
}
export function clearDraftCaches() {
  stores.forEach((store) => store.clear());
  try {
    for (const key of Object.keys(window.sessionStorage))
      if (key.startsWith(prefix)) window.sessionStorage.removeItem(key);
  } catch { /* Memory copies are cleared even when storage is unavailable. */ }
}

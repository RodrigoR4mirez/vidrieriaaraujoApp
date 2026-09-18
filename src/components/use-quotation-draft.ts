"use client";
import { useSyncExternalStore } from "react";
import { draftCache, emptyDraft } from "@/lib/quotation-draft-cache";
const serverSnapshot = { draft: emptyDraft(), warning: "" };
const getServerSnapshot = () => serverSnapshot;

export function useQuotationDraft(owner: string) {
  const store = draftCache(owner);
  const snapshot = useSyncExternalStore(store.subscribe, store.get, getServerSnapshot);
  return { ...snapshot, update: store.update, clear: store.clear, get: store.get };
}

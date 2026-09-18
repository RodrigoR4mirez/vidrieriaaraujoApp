import type { QuotationItem } from "@/domain/quotation/models";

// Shared presentation only: every amount is already calculated by the domain.
export function quotationItemDetail(item: QuotationItem) {
  if (item.mode !== "SHEET") return `Por pie² · ${item.widthCm} × ${item.heightCm} cm`;
  const size = item.sheetWidthCm && item.sheetHeightCm
    ? ` · ${item.sheetWidthCm} × ${item.sheetHeightCm} cm`
    : "";
  return `Plancha entera${size}`;
}

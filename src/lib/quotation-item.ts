import type { QuotationItem } from "@/domain/quotation/models";
import { money } from "@/lib/formatting";

// Shared presentation only: every amount is already calculated by the domain.
export function quotationItemDetail(item: QuotationItem) {
  if (item.mode !== "SHEET") return `Por pie² · ${item.widthCm} × ${item.heightCm} cm`;
  const size = item.sheetWidthCm && item.sheetHeightCm
    ? ` · ${item.sheetWidthCm} × ${item.sheetHeightCm} cm`
    : "";
  return `Plancha entera${size}`;
}

export function quotationTechnicalDetail(item: QuotationItem) {
  if (item.mode === "SHEET") return "";
  return `Ancho ${Number(item.widthInRaw).toFixed(2)}″ → ${item.widthInRounded}″ · Alto ${Number(item.heightInRaw).toFixed(2)}″ → ${item.heightInRounded}″ · Área ${Number(item.areaFt2)} ft² · ${money(item.pricePerSquareFoot)} pie²`;
}

export function internalVoucherMeasure(item: QuotationItem) {
  if (item.mode !== "SHEET") return `${item.widthCm} × ${item.heightCm} cm`;
  return item.sheetWidthCm && item.sheetHeightCm
    ? `${item.sheetWidthCm} × ${item.sheetHeightCm} cm`
    : "Medida no registrada";
}

export function internalVoucherMeta(item: QuotationItem) {
  if (item.mode !== "SHEET") return `Cant: ${item.quantity} pz · Por pie²`;
  return `Cant: ${item.quantity} pln · Por plancha`;
}

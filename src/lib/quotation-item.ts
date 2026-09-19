import type { QuotationItem } from "@/domain/quotation/models";
import { money } from "@/lib/formatting";

// Shared presentation only: every amount is already calculated by the domain.
export function quotationItemDetail(item: QuotationItem) {
  if (item.mode !== "SHEET")
    return `Ancho ${Number(item.widthInRaw).toFixed(2)}″ → ${item.widthInRounded}″ · Alto ${Number(item.heightInRaw).toFixed(2)}″ → ${item.heightInRounded}″ · Área ${Number(item.areaFt2)} ft² · ${money(item.pricePerSquareFoot)} pie²`;
  const size = item.sheetWidthCm && item.sheetHeightCm
    ? ` · ${item.sheetWidthCm} × ${item.sheetHeightCm} cm`
    : "";
  return `Plancha entera${size}`;
}

export function internalVoucherItemDetail(item: QuotationItem) {
  if (item.mode !== "SHEET")
    return `Medidas: ${item.widthCm} × ${item.heightCm} cm · Cantidad: ${item.quantity} ${item.quantity === 1 ? "pieza" : "piezas"} · Modalidad: Por pie²`;
  const size = item.sheetWidthCm && item.sheetHeightCm
    ? `Medidas: ${item.sheetWidthCm} × ${item.sheetHeightCm} cm · `
    : "";
  return `${size}Cantidad: ${item.quantity} ${item.quantity === 1 ? "plancha" : "planchas"} · Modalidad: Por planchas`;
}

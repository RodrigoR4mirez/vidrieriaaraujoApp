import { isProfileQuotationItem, type QuotationItem } from "@/domain/quotation/models";
import { money } from "@/lib/formatting";

// Shared presentation only: every amount is already calculated by the domain.
export function quotationItemDetail(item: QuotationItem) {
  if (isProfileQuotationItem(item)) {
    if (item.mode === "PROFILE_METERS")
      return `Por ${item.measurementUnit === "CENTIMETERS" ? "centímetros" : "metros"} · ${profileMeasure(item)} · ${item.color}`;
    return `Barra completa de ${item.barLengthMeters} m · ${item.color}`;
  }
  if (item.mode !== "SHEET") return `Por pie² · ${item.widthCm} × ${item.heightCm} cm`;
  const size = item.sheetWidthCm && item.sheetHeightCm
    ? ` · ${item.sheetWidthCm} × ${item.sheetHeightCm} cm`
    : "";
  return `Plancha entera${size}`;
}

export function quotationTechnicalDetail(item: QuotationItem) {
  if (isProfileQuotationItem(item)) {
    if (item.mode === "PROFILE_METERS")
      return item.measurementUnit === "CENTIMETERS"
        ? `(${money(item.pricePerBar)} ÷ ${item.barLengthMeters} m) × ${item.markupMultiplier} × (${profileMeasure(item)} ÷ 100) × ${item.quantity}`
        : `(${money(item.pricePerBar)} ÷ ${item.barLengthMeters} m) × ${item.markupMultiplier} × ${profileMeasure(item)} × ${item.quantity}`;
    return `Barra comercial de ${item.barLengthMeters} m · ${money(item.pricePerBar)} por barra`;
  }
  if (item.mode === "SHEET") return "";
  return `Ancho ${Number(item.widthInRaw).toFixed(2)}″ → ${item.widthInRounded}″ · Alto ${Number(item.heightInRaw).toFixed(2)}″ → ${item.heightInRounded}″ · Área ${Number(item.areaFt2)} ft² · ${money(item.pricePerSquareFoot)} pie²`;
}

export function internalVoucherMeasure(item: QuotationItem) {
  if (isProfileQuotationItem(item))
    return item.mode === "PROFILE_METERS" ? profileMeasure(item) : `BARRA ${item.barLengthMeters} m`;
  if (item.mode !== "SHEET") return `${item.widthCm} × ${item.heightCm} cm`;
  return item.sheetWidthCm && item.sheetHeightCm
    ? `${item.sheetWidthCm} × ${item.sheetHeightCm} cm`
    : "Medida no registrada";
}

export function internalVoucherMeta(item: QuotationItem) {
  if (isProfileQuotationItem(item))
    return `Cant: ${item.quantity} · ${item.color} · ${item.mode === "PROFILE_METERS" ? item.measurementUnit === "CENTIMETERS" ? "Por centímetros" : "Por metros" : "Barra completa"}`;
  if (item.mode !== "SHEET") return `Cant: ${item.quantity} pz · Por pie²`;
  return `Cant: ${item.quantity} pln · Por plancha`;
}

export function quotationItemName(item: QuotationItem) {
  return isProfileQuotationItem(item)
    ? `${item.profileCode} — ${item.profileDescription}`
    : item.productDescription;
}

export function quotationItemGroup(item: QuotationItem) {
  return isProfileQuotationItem(item) ? "Perfiles de aluminio" : "Vidrios";
}

function profileMeasure(item: Extract<QuotationItem, { mode: "PROFILE_METERS" }>) {
  const value = item.measurementValue || item.metersRequested;
  return `${value} ${item.measurementUnit === "CENTIMETERS" ? "cm" : "m"}`;
}

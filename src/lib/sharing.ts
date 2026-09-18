import type { Quotation } from "@/domain/quotation/models";
import { limaDate, money } from "./formatting";
export function quotationText(q: Quotation) {
  return [
    "DISTRIBUIDORA ARAUJO",
    "Vidriería & Aluminios",
    "",
    `PROFORMA N° ${q.number}`,
    `Fecha: ${limaDate(q.confirmedAt)}`,
    "",
    ...q.items.flatMap((i) => [
      i.productDescription,
      `Medidas: ${i.widthCm} × ${i.heightCm} cm · Cantidad: ${i.quantity}`,
      `Precio unitario: ${money(i.unitPrice)} · Importe: ${money(i.itemAmount)}`,
      "",
    ]),
    `TOTAL PROFORMA: ${money(q.total)}`,
    ...(q.conditions ? ["", "Condiciones:", q.conditions] : []),
    "",
    "¡Gracias por cotizar con nosotros!",
  ].join("\n");
}
export function whatsappUrl(q: Quotation) {
  return `https://wa.me/?text=${encodeURIComponent(quotationText(q))}`;
}

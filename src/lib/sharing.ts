import { quotationItemDetail } from "@/lib/quotation-item";
import type { Quotation } from "@/domain/quotation/models";
import { limaDate, money } from "./formatting";
import { quotationSubtotal } from "@/domain/quotation/calculation";
export function quotationText(q: Quotation) {
  return [
    "DISTRIBUIDORA ARAUJO",
    "Vidriería & Aluminios",
    "",
    `PROFORMA N° ${q.number}`,
    `Cliente: ${q.customerName || "No registrado"}`,
    `Fecha: ${limaDate(q.confirmedAt)}`,
    "",
    ...q.items.flatMap((i) => [
      i.productDescription,
      `${quotationItemDetail(i)} · Cantidad: ${i.quantity}`,
      `Precio unitario: ${money(i.unitPrice)} · Importe: ${money(i.itemAmount)}`,
      "",
    ]),
    `SUBTOTAL EXACTO: ${money(q.subtotal ?? quotationSubtotal(q.items))}`,
    `TOTAL A COBRAR: ${money(q.total)}`,
    ...(q.conditions ? ["", "Condiciones:", q.conditions] : []),
    "",
    "¡Gracias por cotizar con nosotros!",
  ].join("\n");
}
export function whatsappUrl(q: Quotation) {
  return `https://wa.me/?text=${encodeURIComponent(quotationText(q))}`;
}

import { internalVoucherMeasure, internalVoucherMeta } from "@/lib/quotation-item";
import { notFound } from "next/navigation";
import { requireSession } from "@/infrastructure/auth/session";
import { services } from "@/application/container";
import { numberSchema } from "@/domain/quotation/models";
import { limaDate } from "@/lib/formatting";
import { PrintButton } from "@/components/print-button";
import "../imprimir/print.css";

export default async function InternalVoucherPage({
  params,
}: {
  params: Promise<{ number: string }>;
}) {
  await requireSession();
  const { number } = await params;
  if (!numberSchema.safeParse(number).success) notFound();
  const quotation = await services().quotations.find(number);
  if (!quotation) notFound();

  return (
    <>
      <style>{"@page{margin:3mm}"}</style>
      <div className="print-toolbar no-print">
        <span>Voucher interno del taller</span>
        <PrintButton />
      </div>
      <article className="print-document ticket internal-voucher">
        <header>
          <h1>VOUCHER INTERNO - CORTE</h1>
          <div className="internal-header-meta">
            <p><strong>Cliente:</strong> {(quotation.customerName || "No registrado").toLocaleUpperCase("es-PE")}</p>
            <p>{limaDate(quotation.confirmedAt)}</p>
          </div>
        </header>
        {quotation.items.map((item, index) => (
          <section key={item.id} className="internal-cut-line">
            <div className="internal-glass-name">
              <span>[{index + 1}]</span>
              <strong>{item.productDescription.toLocaleUpperCase("es-PE")}</strong>
            </div>
            <strong className="internal-measure">{internalVoucherMeasure(item)}</strong>
            <small className="internal-meta">{internalVoucherMeta(item)}</small>
          </section>
        ))}
      </article>
    </>
  );
}

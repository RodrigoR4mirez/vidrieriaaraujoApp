import { internalVoucherItemDetail } from "@/lib/quotation-item";
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
      <style>{"@page{size:80mm 297mm;margin:3mm}"}</style>
      <div className="print-toolbar no-print">
        <span>Voucher interno del taller</span>
        <PrintButton />
      </div>
      <article className="print-document ticket internal-voucher">
        <header>
          <h1>VOUCHER INTERNO</h1>
          <p><strong>Cliente:</strong> {quotation.customerName || "No registrado"}</p>
          <p>{limaDate(quotation.confirmedAt)}</p>
        </header>
        {quotation.items.map((item) => (
          <section key={item.id} className="print-line">
            <strong>{item.productDescription}</strong>
            <p>{internalVoucherItemDetail(item)}</p>
          </section>
        ))}
      </article>
    </>
  );
}

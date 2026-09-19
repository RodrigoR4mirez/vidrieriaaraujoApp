import { quotationItemDetail } from "@/lib/quotation-item";
import { notFound } from "next/navigation";
import { requireSession } from "@/infrastructure/auth/session";
import { services } from "@/application/container";
import { numberSchema } from "@/domain/quotation/models";
import { limaDate, money } from "@/lib/formatting";
import { PrintButton } from "@/components/print-button";
import { quotationSubtotal } from "@/domain/quotation/calculation";
import "./print.css";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ number: string }>;
  searchParams: Promise<{ formato?: string }>;
}) {
  await requireSession();
  const { number } = await params;
  if (!numberSchema.safeParse(number).success) notFound();
  const q = await services().quotations.find(number);
  if (!q) notFound();
  const a4 = (await searchParams).formato === "a4";
  return (
    <>
      <style>
        {a4
          ? "@page{size:A4;margin:15mm}"
          : "@page{size:80mm 297mm;margin:3mm}"}
      </style>
      <div className="print-toolbar no-print">
        <span>{a4 ? "Documento A4" : "Ticket térmico 80 mm"}</span>
        <PrintButton />
      </div>
      <article className={`print-document ${a4 ? "a4" : "ticket"}`}>
        <header>
          <h1>DISTRIBUIDORA ARAUJO</h1>
          <p>Vidriería &amp; Aluminios</p>
          <h2>PROFORMA {q.number}</h2>
          <p>{limaDate(q.confirmedAt)}</p>
        </header>
        {q.items.map((i) => (
          <section key={i.id} className="print-line">
            <strong>{i.productDescription}</strong>
            <p>
              {i.quantity} × {quotationItemDetail(i)}
            </p>
            <div>
              <span>P. unitario: {money(i.unitPrice)}</span>
              <strong>{money(i.itemAmount)}</strong>
            </div>
          </section>
        ))}
        <div className="print-total">
          <div><span>Subtotal exacto</span><span>{money(q.subtotal ?? quotationSubtotal(q.items))}</span></div>
          <div><strong>TOTAL A COBRAR</strong><strong>{money(q.total)}</strong></div>
        </div>
        {q.conditions && (
          <section className="print-conditions">
            <strong>Condiciones comerciales</strong>
            <p>{q.conditions}</p>
          </section>
        )}
        <footer>¡Gracias por cotizar con nosotros!</footer>
      </article>
    </>
  );
}

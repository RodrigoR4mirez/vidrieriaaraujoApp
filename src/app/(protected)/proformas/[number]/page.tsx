import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Plus } from "lucide-react";
import { requireSession } from "@/infrastructure/auth/session";
import { services } from "@/application/container";
import { numberSchema } from "@/domain/quotation/models";
import { PageHeader } from "@/components/layout";
import { QuotationSummary } from "@/components/quotation-summary";
import { ShareActions } from "@/components/share-actions";
export default async function Page({
  params,
}: {
  params: Promise<{ number: string }>;
}) {
  await requireSession();
  const { number } = await params;
  if (!numberSchema.safeParse(number).success) notFound();
  const q = await services().quotations.find(number);
  if (!q) notFound();
  return (
    <>
      <PageHeader
        eyebrow="Proforma"
        title={`Nº ${q.number}`}
        date={q.confirmedAt}
      />
      <div className="confirmed-banner">
        <CheckCircle2 size={30} />
        <div>
          <h2>Proforma confirmada</h2>
          <p>La proforma {q.number} fue registrada correctamente.</p>
        </div>
        <span className="badge active">Solo lectura</span>
      </div>
      <section className="panel glass confirmed-summary">
        <div className="quotation-client">
          <span>Cliente</span>
          <strong>{q.customerName || "No registrado"}</strong>
        </div>
        <QuotationSummary items={q.items} subtotal={q.subtotal} total={q.total} />
        {q.conditions && (
          <div className="conditions">
            <h3>Condiciones comerciales</h3>
            <p>{q.conditions}</p>
          </div>
        )}
        <div className="form-actions">
          <Link className="button secondary" href="/cotizador">
            <Plus size={18} />
            Nueva proforma
          </Link>
          <ShareActions quotation={q} />
        </div>
      </section>
    </>
  );
}

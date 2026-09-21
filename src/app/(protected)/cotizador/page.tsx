import { requireSession } from "@/infrastructure/auth/session";
import { services } from "@/application/container";
import { PageHeader } from "@/components/layout";
import { QuotationBuilder } from "@/components/quotation-builder";
export default async function Page() {
  const currentSession = await requireSession();
  const app = services();
  const [catalog, aluminum, next] = await Promise.all([
    app.catalog.load(),
    app.aluminum.load(),
    app.quotations.nextNumber(),
  ]);
  return (
    <>
      <PageHeader
        eyebrow="Cotización · borrador"
        draft
        title={`Nº ${next}`}
        description="Número provisional; se asigna al confirmar."
        date={new Date().toISOString()}
      />
      <QuotationBuilder catalog={catalog} aluminum={aluminum} owner={currentSession.sub!} />
    </>
  );
}

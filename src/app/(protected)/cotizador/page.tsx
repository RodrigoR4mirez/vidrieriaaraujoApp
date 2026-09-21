import { requireSession } from "@/infrastructure/auth/session";
import { services } from "@/application/container";
import { PageHeader } from "@/components/layout";
import { QuotationBuilder } from "@/components/quotation-builder";
import { quotationSectionTabs } from "@/components/section-tabs-config";
import { limaDate } from "@/lib/formatting";
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
        tabs={quotationSectionTabs}
        title={`Nº ${next}`}
        meta={<><span className="draft-badge"><i aria-hidden="true" />Borrador</span><span>Número provisional · {limaDate(new Date().toISOString())}</span></>}
      />
      <QuotationBuilder catalog={catalog} aluminum={aluminum} owner={currentSession.sub!} />
    </>
  );
}

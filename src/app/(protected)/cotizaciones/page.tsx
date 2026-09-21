import { requireSession } from "@/infrastructure/auth/session";
import { services } from "@/application/container";
import { PageHeader } from "@/components/layout";
import { HistoryList } from "@/components/history-list";
import { quotationSectionTabs } from "@/components/section-tabs-config";
export default async function Page() {
  await requireSession();
  const quotations = await services().quotations.list();
  return (
    <>
      <PageHeader
        tabs={quotationSectionTabs}
        title="Historial"
        meta={`${quotations.length} cotizaciones confirmadas`}
      />
      <HistoryList
        quotations={quotations.map(({ number, confirmedAt, customerName, total }) => ({
          number,
          confirmedAt,
          customerName,
          total,
        }))}
      />
    </>
  );
}

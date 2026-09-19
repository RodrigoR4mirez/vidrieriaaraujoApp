import { requireSession } from "@/infrastructure/auth/session";
import { services } from "@/application/container";
import { PageHeader } from "@/components/layout";
import { HistoryList } from "@/components/history-list";
export default async function Page() {
  await requireSession();
  const quotations = await services().quotations.list();
  return (
    <>
      <PageHeader
        eyebrow="Histórico"
        title="Cotizaciones confirmadas"
        description="Consulta y comparte tus cotizaciones guardadas."
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

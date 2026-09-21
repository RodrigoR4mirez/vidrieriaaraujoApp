import { requireSession } from "@/infrastructure/auth/session";
import { services } from "@/application/container";
import { PageHeader } from "@/components/layout";
import { CatalogsWorkspace } from "@/components/catalogs-workspace";
import { catalogSectionTabs } from "@/components/section-tabs-config";
export default async function Page() {
  await requireSession();
  const [catalog, aluminum] = await Promise.all([
    services().catalog.load(),
    services().aluminum.load(),
  ]);
  return (
    <>
      <PageHeader
        tabs={catalogSectionTabs}
        title="Catálogos base"
        meta="Valores usados al crear vidrios y perfiles"
      />
      <CatalogsWorkspace values={catalog.values} aluminum={aluminum} />
    </>
  );
}

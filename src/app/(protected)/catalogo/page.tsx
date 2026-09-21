import { requireSession } from "@/infrastructure/auth/session";
import { services } from "@/application/container";
import { PageHeader } from "@/components/layout";
import { GlassCatalog } from "@/components/glass-catalog";
import { catalogSectionTabs } from "@/components/section-tabs-config";
export default async function Page() {
  await requireSession();
  const catalog = await services().catalog.load();
  return (
    <>
      <PageHeader
        tabs={catalogSectionTabs}
        title="Vidrios"
        meta={`${catalog.products.length} registros · ${catalog.products.filter((product) => product.status === "ACTIVE").length} activos`}
      />
      <GlassCatalog catalog={catalog} />
    </>
  );
}

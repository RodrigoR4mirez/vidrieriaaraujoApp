import { requireSession } from "@/infrastructure/auth/session";
import { services } from "@/application/container";
import { PageHeader } from "@/components/layout";
import { BaseCatalogManager } from "@/components/base-catalog-manager";
export default async function Page() {
  await requireSession();
  const catalog = await services().catalog.load();
  return (
    <>
      <PageHeader
        eyebrow="Administración"
        title="Catálogos base"
        description="Administra las opciones que aparecerán al cotizar vidrios."
        date={new Date().toISOString()}
      />
      <BaseCatalogManager values={catalog.values} />
    </>
  );
}

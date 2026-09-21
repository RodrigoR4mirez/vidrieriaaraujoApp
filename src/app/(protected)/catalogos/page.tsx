import { requireSession } from "@/infrastructure/auth/session";
import { services } from "@/application/container";
import { PageHeader } from "@/components/layout";
import { CatalogsWorkspace } from "@/components/catalogs-workspace";
export default async function Page() {
  await requireSession();
  const [catalog, aluminum] = await Promise.all([
    services().catalog.load(),
    services().aluminum.load(),
  ]);
  return (
    <>
      <PageHeader
        eyebrow="Administración"
        title="Catálogos base"
        description="Configura la información usada para cotizar vidrios y perfiles."
        date={new Date().toISOString()}
      />
      <CatalogsWorkspace values={catalog.values} aluminum={aluminum} />
    </>
  );
}

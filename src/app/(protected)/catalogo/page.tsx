import { requireSession } from "@/infrastructure/auth/session";
import { services } from "@/application/container";
import { PageHeader } from "@/components/layout";
import { GlassCatalog } from "@/components/glass-catalog";
export default async function Page() {
  await requireSession();
  const catalog = await services().catalog.load();
  return (
    <>
      <PageHeader
        eyebrow="Catálogo"
        title="Catálogo principal de vidrios"
        description="Administra los vidrios disponibles y mantén actualizados sus precios."
        date={new Date().toISOString()}
      />
      <GlassCatalog catalog={catalog} />
    </>
  );
}

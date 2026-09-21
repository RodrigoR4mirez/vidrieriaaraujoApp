import { requireSession } from "@/infrastructure/auth/session";
import { services } from "@/application/container";
import { PageHeader } from "@/components/layout";
import { AluminumProfileCatalog } from "@/components/aluminum-profile-catalog";

export default async function Page() {
  await requireSession();
  const catalog = await services().aluminum.load();
  return <>
    <PageHeader eyebrow="Catálogo" title="Perfiles de aluminio"
      description="Administra perfiles, familias, imágenes y precios por color."
      date={new Date().toISOString()} />
    <AluminumProfileCatalog catalog={catalog} />
  </>;
}

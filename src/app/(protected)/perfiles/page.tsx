import { requireSession } from "@/infrastructure/auth/session";
import { services } from "@/application/container";
import { PageHeader } from "@/components/layout";
import { AluminumProfileCatalog } from "@/components/aluminum-profile-catalog";
import { catalogSectionTabs } from "@/components/section-tabs-config";

export default async function Page() {
  await requireSession();
  const catalog = await services().aluminum.load();
  return <>
    <PageHeader tabs={catalogSectionTabs} title="Perfiles" meta={`${catalog.profiles.length} perfiles · ${catalog.families.filter((family) => family.status === "ACTIVE").length} familias`} />
    <AluminumProfileCatalog catalog={catalog} />
  </>;
}

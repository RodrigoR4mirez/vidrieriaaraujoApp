import "server-only";
import { unstable_cache, updateTag } from "next/cache";
import { blobToken } from "@/config/env";
import {
  BlobCatalogDocument,
  BlobAluminumCatalogDocument,
  VercelBlobAluminumCatalogRepository,
  VercelBlobGlassRepository,
  VercelBlobBaseCatalogRepository,
  VercelBlobQuotationRepository,
} from "@/infrastructure/persistence/blob/repositories";
import { VercelBlobStore } from "@/infrastructure/persistence/blob/store";
import { AluminumCatalogService } from "./aluminum-service";
import { CatalogService, QuotationService } from "./use-cases";

// Vercel Blob Private sigue siendo la única fuente de verdad (ver AGENTS.md).
// Lo que se agrega aquí es un caché de LECTURA en el Data Cache de Vercel
// (server-side, nunca el navegador). Todas las escrituras de este módulo
// se disparan únicamente desde Server Actions (src/app/actions.ts), así
// que usamos `updateTag`: expira el tag al instante ("read-your-own-writes"
// de Next.js 16), sin la ventana de "stale-while-revalidate" que tendría
// `revalidateTag`. Ningún dispositivo puede quedarse con datos obsoletos:
// la siguiente lectura, en cualquier pestaña, vuelve a consultar Blob.
//
// Las lecturas usadas para reconciliar una escritura (dentro de `mutate`
// y de `confirm`, incluida la comprobación de idempotencia y la
// numeración de folios) NO pasan por este caché: siguen golpeando Blob
// directamente para no arriesgar condiciones de carrera ni folios
// duplicados.
const CATALOG_TAG = "catalog";
const ALUMINUM_TAG = "aluminum-catalog";
const QUOTATIONS_TAG = "quotations";

function repositories() {
  const store = new VercelBlobStore(blobToken());
  const document = new BlobCatalogDocument(store);
  const aluminumRepository = new VercelBlobAluminumCatalogRepository(
    new BlobAluminumCatalogDocument(store),
  );
  const glass = new VercelBlobGlassRepository(document);
  const bases = new VercelBlobBaseCatalogRepository(document);
  const quotationRepository = new VercelBlobQuotationRepository(store);
  return { glass, bases, aluminumRepository, quotationRepository };
}

// Cada repositorio es un envoltorio liviano sobre el token de Blob:
// recrearlo dentro de la función cacheada no tiene costo y evita
// compartir estado mutable entre peticiones distintas.
const loadCatalogCached = unstable_cache(
  async () => repositories().glass.catalog(),
  ["catalog-load"],
  { tags: [CATALOG_TAG] },
);
const loadAluminumCached = unstable_cache(
  async () => repositories().aluminumRepository.catalog(),
  ["aluminum-catalog-load"],
  { tags: [ALUMINUM_TAG] },
);
const listQuotationsCached = unstable_cache(
  async () => repositories().quotationRepository.list(),
  ["quotations-list"],
  { tags: [QUOTATIONS_TAG] },
);
const findQuotationCached = unstable_cache(
  async (number: string) => repositories().quotationRepository.find(number),
  ["quotations-find"],
  { tags: [QUOTATIONS_TAG] },
);
const nextQuotationNumberCached = unstable_cache(
  async () => repositories().quotationRepository.nextNumber(),
  ["quotations-next-number"],
  { tags: [QUOTATIONS_TAG] },
);

export function services() {
  const { glass, bases, aluminumRepository, quotationRepository } =
    repositories();
  const catalogService = new CatalogService(glass, bases);
  const aluminumService = new AluminumCatalogService(aluminumRepository);
  const quotationService = new QuotationService(
    glass,
    quotationRepository,
    aluminumRepository,
  );

  return {
    catalog: {
      load: loadCatalogCached,
      async saveProduct(...args: Parameters<CatalogService["saveProduct"]>) {
        const saved = await catalogService.saveProduct(...args);
        updateTag(CATALOG_TAG);
        return saved;
      },
      async saveBase(...args: Parameters<CatalogService["saveBase"]>) {
        const saved = await catalogService.saveBase(...args);
        updateTag(CATALOG_TAG);
        return saved;
      },
    },
    aluminum: {
      load: loadAluminumCached,
      async saveFamily(
        ...args: Parameters<AluminumCatalogService["saveFamily"]>
      ) {
        const saved = await aluminumService.saveFamily(...args);
        updateTag(ALUMINUM_TAG);
        return saved;
      },
      async saveColor(
        ...args: Parameters<AluminumCatalogService["saveColor"]>
      ) {
        const saved = await aluminumService.saveColor(...args);
        updateTag(ALUMINUM_TAG);
        return saved;
      },
      async saveProfile(
        ...args: Parameters<AluminumCatalogService["saveProfile"]>
      ) {
        const saved = await aluminumService.saveProfile(...args);
        updateTag(ALUMINUM_TAG);
        return saved;
      },
      async seedFromReference() {
        const seeded = await aluminumService.seedFromReference();
        updateTag(ALUMINUM_TAG);
        return seeded;
      },
    },
    quotations: {
      list: listQuotationsCached,
      find: findQuotationCached,
      nextNumber: nextQuotationNumberCached,
      async confirm(...args: Parameters<QuotationService["confirm"]>) {
        const saved = await quotationService.confirm(...args);
        updateTag(QUOTATIONS_TAG);
        return saved;
      },
    },
  };
}

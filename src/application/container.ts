import "server-only";
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
export function services() {
  const store = new VercelBlobStore(blobToken());
  const document = new BlobCatalogDocument(store);
  const aluminumRepository = new VercelBlobAluminumCatalogRepository(
    new BlobAluminumCatalogDocument(store),
  );
  const glass = new VercelBlobGlassRepository(document);
  return {
    catalog: new CatalogService(
      glass,
      new VercelBlobBaseCatalogRepository(document),
    ),
    aluminum: new AluminumCatalogService(aluminumRepository),
    quotations: new QuotationService(
      glass,
      new VercelBlobQuotationRepository(store),
      aluminumRepository,
    ),
  };
}

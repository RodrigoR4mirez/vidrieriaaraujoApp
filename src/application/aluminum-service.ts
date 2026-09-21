import "server-only";

import aluminumSeed from "@/data/aluminum-seed.json";
import {
  aluminumCatalogSchema,
  aluminumColorInputSchema,
  aluminumFamilyInputSchema,
  aluminumProfileInputSchema,
} from "@/domain/aluminum/models";
import type { AluminumCatalogRepository } from "./repositories";

export class AluminumCatalogService {
  constructor(private repository: AluminumCatalogRepository) {}

  load() {
    return this.repository.catalog();
  }

  saveFamily(raw: unknown, id?: string, revision?: number) {
    return this.repository.saveFamily(
      aluminumFamilyInputSchema.parse(raw),
      id,
      revision,
    );
  }

  saveColor(raw: unknown, id?: string, revision?: number) {
    return this.repository.saveColor(
      aluminumColorInputSchema.parse(raw),
      id,
      revision,
    );
  }

  saveProfile(raw: unknown, id?: string, revision?: number) {
    return this.repository.saveProfile(
      aluminumProfileInputSchema.parse(raw),
      id,
      revision,
    );
  }

  seedFromReference() {
    return this.repository.seed(aluminumCatalogSchema.parse(aluminumSeed));
  }
}

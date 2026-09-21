"use client";

import { useState } from "react";
import { Layers3, PanelsTopLeft } from "lucide-react";
import type { BaseValue } from "@/domain/catalogs/models";
import type { AluminumCatalog } from "@/domain/aluminum/models";
import { BaseCatalogManager } from "./base-catalog-manager";
import { AluminumBaseCatalogManager } from "./aluminum-base-catalog-manager";

export function CatalogsWorkspace({ values, aluminum }: { values: BaseValue[]; aluminum: AluminumCatalog }) {
  const [area, setArea] = useState<"GLASS" | "PROFILE">("GLASS");
  return <>
    <div className="catalog-area-tabs segments no-print" aria-label="Área de catálogos">
      <button className={area === "GLASS" ? "selected" : ""} aria-pressed={area === "GLASS"}
        onClick={() => setArea("GLASS")}><Layers3 size={18} />Vidrios</button>
      <button className={area === "PROFILE" ? "selected" : ""} aria-pressed={area === "PROFILE"}
        onClick={() => setArea("PROFILE")}><PanelsTopLeft size={18} />Perfiles de aluminio</button>
    </div>
    {area === "GLASS" ? <BaseCatalogManager values={values} /> : <AluminumBaseCatalogManager catalog={aluminum} />}
  </>;
}

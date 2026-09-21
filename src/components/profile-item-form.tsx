"use client";

import Image from "next/image";
import { PackageOpen, PanelsTopLeft, Plus, Ruler, X } from "lucide-react";
import { useState } from "react";
import { emptyCatalog } from "@/domain/catalogs/models";
import {
  isProfileQuotable,
  type AluminumCatalog,
  profilePrice,
} from "@/domain/aluminum/models";
import {
  draftItemSchema,
  type DraftItem,
  type ProfileDraftItem,
  type QuotationItem,
} from "@/domain/quotation/models";
import { priceDraft } from "@/application/use-cases";
import type { QuotationForm } from "@/lib/quotation-draft-cache";
import { money } from "@/lib/formatting";
import { useHydrated } from "./use-hydrated";
import { Button, Notice, QuantityControl } from "./ui";
import {
  CatalogProductPicker,
  type PickerProduct,
} from "./catalog-product-picker";

export function ProfileItemForm({
  catalog,
  editing,
  form,
  onFormChange,
  onSave,
  onCancel,
}: {
  catalog: AluminumCatalog;
  editing?: ProfileDraftItem;
  form: QuotationForm;
  onFormChange: (form: QuotationForm) => void;
  onSave: (item: DraftItem) => void;
  onCancel: () => void;
}) {
  const hydrated = useHydrated();
  const [error, setError] = useState("");
  const [availabilityNotice, setAvailabilityNotice] = useState("");
  const patch = (change: Partial<QuotationForm>) => onFormChange({ ...form, ...change });
  const availableProfiles = catalog.profiles.filter((profile) =>
    profile.colorPrices.some((entry) => isProfileQuotable(profile, entry.colorId, catalog)));
  const availableFamilies = catalog.families.filter((family) =>
    availableProfiles.some((profile) => profile.familyId === family.id));
  const profile = availableProfiles.find((entry) => entry.id === form.profileId);
  const availableColors = profile?.colorPrices.flatMap((entry) => {
    const color = catalog.colors.find((candidate) =>
      candidate.id === entry.colorId && candidate.status === "ACTIVE" && Number(entry.pricePerBar) > 0,
    );
    return color ? [{ ...color, pricePerBar: entry.pricePerBar }] : [];
  }) ?? [];
  const pickerProducts: PickerProduct[] = availableProfiles.map((entry) => {
    const familyName = catalog.families.find((family) => family.id === entry.familyId)?.name || "";
    const colorCount = entry.colorPrices.filter((price) =>
      catalog.colors.some((color) => color.id === price.colorId && color.status === "ACTIVE") &&
      Number(price.pricePerBar) > 0,
    ).length;
    return {
      id: entry.id,
      code: entry.code,
      description: entry.description,
      familyId: entry.familyId,
      familyName,
      measure: `Barra ${entry.barLengthMeters} m`,
      keyDetail: `${colorCount} ${colorCount === 1 ? "color" : "colores"}`,
      imagePath: entry.imagePath,
    };
  });
  const selectedPickerProduct = pickerProducts.find((entry) => entry.id === form.profileId);
  const candidate = {
    id: editing?.id || profile?.id || "",
    itemType: "ALUMINUM_PROFILE" as const,
    profileId: profile?.id || "",
    colorId: form.colorId,
    mode: form.profileMode,
    quantity: form.quantity,
    ...(form.profileMode === "PROFILE_METERS" ? { metersRequested: form.metersRequested } : {}),
  };
  let estimate: QuotationItem | undefined;
  const parsedCandidate = draftItemSchema.safeParse(candidate);
  if (parsedCandidate.success) {
    try {
      estimate = priceDraft([parsedCandidate.data], emptyCatalog(), catalog)[0];
    } catch {
      /* The form remains editable while a dependent value is incomplete. */
    }
  }

  function changeMode(nextMode: "PROFILE_BAR" | "PROFILE_METERS") {
    const current = catalog.profiles.find((entry) => entry.id === form.profileId);
    const keepProfile = Boolean(current && availableProfiles.some((entry) => entry.id === current.id));
    const keepFamily = form.profileFamilyId && availableProfiles.some((entry) =>
      entry.familyId === form.profileFamilyId);
    const keepColor = keepProfile && current?.colorPrices.some((entry) =>
      entry.colorId === form.colorId && isProfileQuotable(current, entry.colorId, catalog));
    onFormChange({
      ...form,
      profileMode: nextMode,
      profileFamilyId: keepFamily ? form.profileFamilyId : "",
      profileId: keepProfile ? form.profileId : "",
      colorId: keepColor ? form.colorId : "",
      metersRequested: nextMode === "PROFILE_BAR" ? "" : form.metersRequested,
    });
    setAvailabilityNotice(current && !keepProfile
      ? `Este producto no se vende ${nextMode === "PROFILE_BAR" ? "por barra" : "por medida"} y se quitó de la selección.`
      : "");
    setError("");
  }

  return (
    <form className="form-stack" onSubmit={(event) => {
      event.preventDefault();
      const parsed = draftItemSchema.safeParse({
        ...candidate,
        id: editing?.id || crypto.randomUUID(),
      });
      if (!parsed.success) {
        setError("Selecciona un perfil, color, modalidad y valores válidos.");
        return;
      }
      onSave(parsed.data);
      setError("");
    }}>
      {editing && <Notice>Editar perfil, modalidad y cantidad</Notice>}
      <div className="field sale-mode-section">
        <span className="field-label">Modalidad de venta (perfil)</span>
        <div className="sale-mode-grid">
          <div className="sale-mode-choice">
            <button type="button" aria-pressed={form.profileMode === "PROFILE_BAR"}
              className={form.profileMode === "PROFILE_BAR" ? "selected" : ""}
              disabled={!availableProfiles.length} onClick={() => changeMode("PROFILE_BAR")}>
              <PanelsTopLeft size={18} /><span>Por barra</span>
            </button>
            {!availableProfiles.length && <small>Sin productos disponibles en esta modalidad</small>}
          </div>
          <div className="sale-mode-choice">
            <button type="button" aria-pressed={form.profileMode === "PROFILE_METERS"}
              className={form.profileMode === "PROFILE_METERS" ? "selected" : ""}
              disabled={!availableProfiles.length} onClick={() => changeMode("PROFILE_METERS")}>
              <Ruler size={18} /><span>Por medida</span>
            </button>
            {!availableProfiles.length && <small>Sin productos disponibles en esta modalidad</small>}
          </div>
        </div>
      </div>
      <CatalogProductPicker label="Buscar perfil" placeholder="Buscar perfil o familia…"
        products={pickerProducts}
        families={availableFamilies.map((family) => ({ id: family.id, name: family.name }))}
        value={form.profileId} familyId={form.profileFamilyId}
        disabled={!form.profileMode || !availableProfiles.length}
        recentKey="araujo:recent-aluminum-profiles"
        onChange={(profileId) => patch({ profileId, colorId: "" })}
        onFamilyChange={(profileFamilyId) => patch({
          profileFamilyId,
          profileId: profileFamilyId && profile?.familyId !== profileFamilyId ? "" : form.profileId,
          colorId: profileFamilyId && profile?.familyId !== profileFamilyId ? "" : form.colorId,
        })} />
      {availabilityNotice && <Notice>{availabilityNotice}</Notice>}
      {profile && selectedPickerProduct && <div className="selected-product-card profile-selected-card">
        <span className="profile-thumbnail">
          {profile.imagePath ? <Image src={profile.imagePath} alt={`Sección del perfil ${profile.code}`}
            fill sizes="72px" /> : <PackageOpen size={28} />}
        </span>
        <div><strong>{profile.code}</strong><span>{profile.description}</span>
          <small>{selectedPickerProduct.measure} · {selectedPickerProduct.familyName}</small></div>
        <button type="button" className="icon-button" aria-label="Quitar perfil seleccionado"
          onClick={() => patch({ profileId: "", colorId: "" })}><X size={16} /></button>
      </div>}
      <fieldset disabled={!form.profileMode || !profile} className="form-stack item-measures">
        <div className="field">
          <span className="field-label">Color del perfil</span>
          <div className="color-options">
            {availableColors.map((color) => <button type="button" key={color.id}
              className={form.colorId === color.id ? "color-option selected" : "color-option"}
              aria-pressed={form.colorId === color.id} onClick={() => patch({ colorId: color.id })}>
              <span className="color-swatch" style={{ backgroundColor: color.swatch }} />
              {color.name}
              <small>{money(color.pricePerBar)} / barra</small>
            </button>)}
          </div>
        </div>
        {form.profileMode === "PROFILE_METERS" && <div className="field">
          <label htmlFor="meters-requested">Metros solicitados</label>
          <input id="meters-requested" type="number" inputMode="decimal" min="0.01" step="any"
            required value={form.metersRequested} onChange={(event) => patch({ metersRequested: event.target.value })} />
        </div>}
        <QuantityControl value={form.quantity ?? NaN}
          onChange={(quantity) => patch({ quantity: Number.isFinite(quantity) ? quantity : null })}
          label={form.profileMode === "PROFILE_BAR" ? "Cantidad de barras" : "Cantidad de piezas / tramos"} />
      </fieldset>
      {form.profileMode === "PROFILE_METERS" && profile && form.colorId && <div className="calculation-breakdown">
        (precio barra {money(profilePrice(profile, form.colorId) || "0")} ÷ {profile.barLengthMeters}) × 1.10 × metros × cantidad
      </div>}
      <div className={`estimate ${!estimate ? "disabled-control" : ""}`}>
        <span>Importe estimado</span><strong>{estimate ? money(estimate.itemAmount) : "S/ —"}</strong>
      </div>
      {error && <Notice error>{error}</Notice>}
      {editing ? <div className="form-actions">
        <Button variant="secondary" type="button" onClick={onCancel}>Cancelar</Button>
        <Button disabled={!hydrated || !estimate}>Guardar cambios</Button>
      </div> : <Button disabled={!hydrated || !estimate} type="submit"><Plus size={18} />Agregar a la cotización</Button>}
    </form>
  );
}

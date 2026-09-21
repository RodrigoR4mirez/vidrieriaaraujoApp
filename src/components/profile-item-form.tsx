"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { PackageOpen, Plus, Search } from "lucide-react";
import { emptyCatalog } from "@/domain/catalogs/models";
import {
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
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const patch = (change: Partial<QuotationForm>) => onFormChange({ ...form, ...change });
  const activeFamilies = catalog.families.filter((family) => family.status === "ACTIVE");
  const availableProfiles = useMemo(() => catalog.profiles.filter((profile) =>
    profile.status === "ACTIVE" &&
    profile.familyId === form.profileFamilyId &&
    profile.colorPrices.some((entry) => catalog.colors.some((color) =>
      color.id === entry.colorId && color.status === "ACTIVE" && Number(entry.pricePerBar) > 0,
    )) &&
    `${profile.code} ${profile.description}`.toLocaleLowerCase("es-PE")
      .includes(query.toLocaleLowerCase("es-PE")),
  ), [catalog.colors, catalog.profiles, form.profileFamilyId, query]);
  const profile = catalog.profiles.find((entry) => entry.id === form.profileId);
  const availableColors = profile?.colorPrices.flatMap((entry) => {
    const color = catalog.colors.find((candidate) =>
      candidate.id === entry.colorId && candidate.status === "ACTIVE" && Number(entry.pricePerBar) > 0,
    );
    return color ? [{ ...color, pricePerBar: entry.pricePerBar }] : [];
  }) ?? [];
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

  return (
    <form className="form-stack" onSubmit={(event) => {
      event.preventDefault();
      const parsed = draftItemSchema.safeParse({
        ...candidate,
        id: editing?.id || crypto.randomUUID(),
      });
      if (!parsed.success) {
        setError("Selecciona familia, perfil, color, modalidad y valores válidos.");
        return;
      }
      onSave(parsed.data);
      setError("");
    }}>
      {editing && <Notice>Editar perfil, modalidad y cantidad</Notice>}
      <div className="field">
        <label htmlFor="profile-family">Familia de perfiles</label>
        <select id="profile-family" required disabled={!!editing} value={form.profileFamilyId}
          onChange={(event) => patch({ profileFamilyId: event.target.value, profileId: "", colorId: "" })}>
          <option value="">Selecciona la familia</option>
          {activeFamilies.map((family) => <option key={family.id} value={family.id}>{family.name}</option>)}
        </select>
      </div>
      <div className="field">
        <label htmlFor="profile-search">Buscar perfil</label>
        <div className="search-field profile-search">
          <Search size={17} />
          <input id="profile-search" placeholder="Código o descripción" value={query}
            disabled={!form.profileFamilyId || !!editing} onChange={(event) => setQuery(event.target.value)} />
        </div>
      </div>
      <div className="field">
        <label htmlFor="profile-select">Perfil de aluminio</label>
        <select id="profile-select" required disabled={!form.profileFamilyId || !!editing}
          value={form.profileId} onChange={(event) => patch({ profileId: event.target.value, colorId: "" })}>
          <option value="">Selecciona el perfil</option>
          {availableProfiles.map((entry) => <option key={entry.id} value={entry.id}>
            {entry.code} — {entry.description}
          </option>)}
        </select>
      </div>
      {profile && <div className="selected-profile-card">
        <div className="profile-thumbnail">
          {profile.imagePath ? <Image src={profile.imagePath} alt={`Sección del perfil ${profile.code}`}
            fill sizes="72px" /> : <PackageOpen size={28} />}
        </div>
        <div><strong>{profile.code} — {profile.description}</strong>
          <span>{catalog.families.find((family) => family.id === profile.familyId)?.name}</span></div>
      </div>}
      <fieldset disabled={!profile} className="form-stack item-measures">
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
        <div className="field">
          <span className="field-label">Modalidad de venta</span>
          <div className="segments profile-modes">
            <button type="button" className={form.profileMode === "PROFILE_METERS" ? "selected" : ""}
              aria-pressed={form.profileMode === "PROFILE_METERS"}
              onClick={() => patch({ profileMode: "PROFILE_METERS" })}>Por metros</button>
            <button type="button" className={form.profileMode === "PROFILE_BAR" ? "selected" : ""}
              aria-pressed={form.profileMode === "PROFILE_BAR"}
              onClick={() => patch({ profileMode: "PROFILE_BAR", metersRequested: "" })}>Barra completa</button>
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
      <div className="estimate"><span>Importe estimado</span><strong>{estimate ? money(estimate.itemAmount) : "S/ —"}</strong></div>
      {error && <Notice error>{error}</Notice>}
      {editing ? <div className="form-actions">
        <Button variant="secondary" type="button" onClick={onCancel}>Cancelar</Button>
        <Button disabled={!hydrated || !estimate}>Guardar cambios</Button>
      </div> : <Button disabled={!hydrated || !estimate} type="submit"><Plus size={18} />Agregar a la cotización</Button>}
    </form>
  );
}

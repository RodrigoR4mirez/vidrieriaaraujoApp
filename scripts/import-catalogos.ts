import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import ExcelJS from "exceljs";
import Decimal from "decimal.js";
import {
  aluminumCatalogSchema,
  type AluminumCatalog,
  type AluminumProfile,
} from "../src/domain/aluminum/models";
import {
  catalogStateSchema,
  type BaseValue,
  type CatalogState,
  type Category,
  type Product,
} from "../src/domain/catalogs/models";
import { validateBackup } from "../src/application/backup";

const root = process.cwd();
const sources = {
  aluminum: path.join(root, "catalogos-fisicos/catalogo de perfiles de aluminio.xlsx"),
  glass: path.join(root, "catalogos-fisicos/catalogo de vidrios.xlsx"),
};
const output = {
  backup: path.join(root, "data/catalogos-importacion.json"),
  aluminumSeed: path.join(root, "src/data/aluminum-seed.json"),
  report: path.join(root, "INFORME-VOLCADO.md"),
  profiles: path.join(root, "public/profiles"),
};
const write = process.argv.includes("--write");
const glassOnly = process.argv.includes("--glass-only");
const createdAt = new Date().toISOString();

type Cell = ExcelJS.CellValue | null | undefined;
type SourceProfile = {
  row: number;
  family: string;
  code: string;
  description: string;
  mate: string;
  black: string;
  imageId?: number;
};
type ImportResult = {
  aluminum: AluminumCatalog;
  glass: CatalogState;
  profileImages: Map<string, { imageId: number; extension: string; buffer: Uint8Array }>;
  normalizedCodes: Array<{ original: string; final: string; row: number }>;
  droppedDuplicates: Array<{ code: string; keptRow: number; droppedRow: number }>;
  zeroPriceProfiles: string[];
  zeroPriceGlasses: string[];
  glassesWithoutSheet: string[];
  profilesWithoutImage: string[];
};

function cellText(value: Cell): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number") return String(value).trim();
  if (typeof value === "object") {
    if ("richText" in value) return value.richText.map((part) => part.text).join("").trim();
    if ("text" in value) return String(value.text).trim();
    if ("result" in value) return String(value.result ?? "").trim();
  }
  return String(value).trim();
}

function title(value: string) {
  return value.trim().toLocaleLowerCase("es-PE").replace(/(^|\s)\S/g, (letter) => letter.toLocaleUpperCase("es-PE"));
}

function canonical(value: string) {
  return value.trim().replace(/llovisna/gi, "llovizna").replace(/\s+/g, " ");
}

function normalizeCode(value: string) {
  const normalized = value.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toUpperCase().replace(/[^A-Z0-9_-]+/g, "-").replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  if (!normalized || normalized.length > 40)
    throw new Error(`Código inválido tras normalizar: «${value}» → «${normalized}».`);
  return normalized;
}

function stableId(namespace: string, value: string) {
  const bytes = createHash("sha1").update(`${namespace}:${value}`).digest().subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function decimal(value: string, context: string) {
  try {
    const parsed = new Decimal(value.replace(",", "."));
    if (parsed.isNegative()) throw new Error("negativo");
    return parsed.toFixed(2);
  } catch {
    throw new Error(`${context}: número inválido «${value}».`);
  }
}

function decimalOrZero(value: string, context: string) {
  return value ? decimal(value, context) : "0.00";
}

function sheetCm(value: string, context: string) {
  try {
    const result = new Decimal(value.replace(",", ".")).mul(100);
    if (!result.gt(0)) throw new Error("no positivo");
    return result.toFixed(2).replace(/\.00$/, "");
  } catch {
    throw new Error(`${context}: medida de plancha inválida «${value}».`);
  }
}

function metadata(namespace: string, name: string) {
  return { id: stableId(namespace, name), schemaVersion: 1 as const, revision: 1, createdAt, updatedAt: createdAt };
}

function base(category: Category, name: string): BaseValue {
  const normalizedName = title(canonical(name));
  return { ...metadata(`glass-${category}`, normalizedName), category, name: normalizedName, description: "", status: "ACTIVE" };
}

function imageForRow(sheet: ExcelJS.Worksheet) {
  const images = new Map<number, number>();
  for (const image of sheet.getImages()) {
    const row = Math.floor(image.range.tl.row) + 1;
    if (!images.has(row)) images.set(row, Number(image.imageId));
  }
  return images;
}

function profileHeading(code: string, description: string, mate: string, black: string) {
  return Boolean(code && !mate && !black && (!description || code === description));
}

function profileScore(profile: SourceProfile) {
  return (profile.mate ? 10 : 0) + (profile.black ? 10 : 0) + (profile.imageId === undefined ? 0 : 1) + profile.description.length / 1000;
}

function profileVariantCode(profile: SourceProfile, group: SourceProfile[]) {
  if (group.length === 2 && group.every((entry) => Boolean(entry.mate) !== Boolean(entry.black))) {
    return `${normalizeCode(profile.code)}-${profile.mate ? "MATE" : "NEGRO"}`;
  }
  return normalizeCode(profile.code);
}

async function readAluminum() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(sources.aluminum);
  const sheet = workbook.worksheets[0];
  if (!sheet) throw new Error("El Excel de perfiles no tiene una hoja.");
  const imagesByRow = imageForRow(sheet);
  const parsed: SourceProfile[] = [];
  let family = "";
  for (let row = 3; row <= sheet.rowCount; row++) {
    const code = cellText(sheet.getCell(row, 1).value);
    const description = cellText(sheet.getCell(row, 3).value);
    const mate = cellText(sheet.getCell(row, 4).value);
    const black = cellText(sheet.getCell(row, 5).value);
    if (!code && !description && !mate && !black) continue;
    if (profileHeading(code, description, mate, black)) {
      family = canonical(code);
      continue;
    }
    if (!code || !description)
      throw new Error(`Perfiles fila ${row}: se requiere código y descripción.`);
    if (!family) throw new Error(`Perfiles fila ${row}: no tiene familia previa.`);
    parsed.push({ row, family, code, description: canonical(description), mate, black, imageId: imagesByRow.get(row) });
  }
  const byCode = Map.groupBy(parsed, (profile) => normalizeCode(profile.code));
  const selected: SourceProfile[] = [];
  const normalizedCodes: ImportResult["normalizedCodes"] = [];
  const droppedDuplicates: ImportResult["droppedDuplicates"] = [];
  for (const [code, group] of byCode) {
    if (group.length === 1) {
      selected.push(group[0]);
      continue;
    }
    const variants = group.map((profile) => ({ profile, code: profileVariantCode(profile, group) }));
    if (new Set(variants.map((entry) => entry.code)).size === variants.length) {
      selected.push(...group);
      for (const entry of variants)
        normalizedCodes.push({ original: entry.profile.code, final: entry.code, row: entry.profile.row });
      continue;
    }
    const kept = [...group].sort((left, right) => profileScore(right) - profileScore(left) || left.row - right.row)[0];
    selected.push(kept);
    for (const profile of group) if (profile !== kept)
      droppedDuplicates.push({ code, keptRow: kept.row, droppedRow: profile.row });
  }
  const familyNames = [...new Set(selected.map((profile) => title(profile.family)))];
  const families = familyNames.map((name) => ({ ...metadata("aluminum-family", name), name, description: "", status: "ACTIVE" as const }));
  const colors = [
    { ...metadata("aluminum-color", "Mate"), name: "Mate", swatch: "#A8A8A8", status: "ACTIVE" as const },
    { ...metadata("aluminum-color", "Negro"), name: "Negro", swatch: "#202124", status: "ACTIVE" as const },
  ];
  const familyId = new Map(families.map((entry) => [entry.name, entry.id]));
  const colorId = new Map(colors.map((entry) => [entry.name, entry.id]));
  const profileImages: ImportResult["profileImages"] = new Map();
  const zeroPriceProfiles: string[] = [];
  const profiles: AluminumProfile[] = selected.map((source) => {
    const code = profileVariantCode(source, byCode.get(normalizeCode(source.code)) || [source]);
    const prices = [
      source.mate ? { colorId: colorId.get("Mate")!, pricePerBar: decimal(source.mate, `Perfiles fila ${source.row}, mate`) } : undefined,
      source.black ? { colorId: colorId.get("Negro")!, pricePerBar: decimal(source.black, `Perfiles fila ${source.row}, negro`) } : undefined,
    ].filter((entry): entry is { colorId: string; pricePerBar: string } => Boolean(entry));
    if (!prices.length) {
      prices.push({ colorId: colorId.get("Mate")!, pricePerBar: "0.00" });
      zeroPriceProfiles.push(`${code} (fila ${source.row})`);
    }
    const image = source.imageId === undefined ? undefined : workbook.getImage(source.imageId);
    const extension = image?.extension === "jpeg" ? "jpg" : image?.extension;
    if (image?.buffer && extension) profileImages.set(code, { imageId: source.imageId!, extension, buffer: new Uint8Array(image.buffer) });
    return {
      ...metadata("aluminum-profile", code), code, originalCode: source.code, originalDescription: source.description,
      sourceRows: [source.row], description: source.description, familyId: familyId.get(title(source.family))!,
      barLengthMeters: "6.00", imagePath: image?.buffer && extension ? `/profiles/${code}.${extension}` : undefined,
      colorPrices: prices, status: "ACTIVE",
    };
  });
  return {
    catalog: aluminumCatalogSchema.parse({ schemaVersion: 1, families, colors, profiles }),
    profileImages, normalizedCodes, droppedDuplicates, zeroPriceProfiles,
  };
}

function thicknessFrom(text: string) {
  const match = /(\d+(?:[.,]\d+)?)\s*m{1,2}\b/i.exec(text);
  return match ? `${match[1].replace(",", ".")} mm` : "Sin especificar";
}

function glassAttributes(family: string, description: string) {
  const lower = canonical(description).toLocaleLowerCase("es-PE");
  const withoutThickness = lower.replace(/\d+(?:[.,]\d+)?\s*m{1,2}\b/i, "").replace(/^cat\.?\s*/i, "").trim();
  if (family === "CATEDRAL INCOLORO CH") return { color: "Incoloro", design: title(withoutThickness) };
  if (family === "CATEDRAL COLOR CH") {
    const [first, ...rest] = withoutThickness.split(/\s+/);
    return { color: title(first || "Sin especificar"), design: title(rest.join(" ") || "Sin especificar") };
  }
  if (family === "REFLEJANTE") return { color: title(withoutThickness.replace(/^ref\.?\s*/i, "")), design: "" };
  if (family === "INCOLOROS") return { color: "Incoloro", design: "" };
  if (family === "BRONCE") return { color: "Bronce", design: "" };
  if (family === "GRIS") return { color: "Gris", design: "" };
  return { color: "", design: "" };
}

function glassFamily(family: string) {
  return ["INCOLOROS", "BRONCE", "GRIS"].includes(family) ? "Primario" : family;
}

async function readGlass() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(sources.glass);
  const sheet = workbook.worksheets[0];
  if (!sheet) throw new Error("El Excel de vidrios no tiene una hoja.");
  const records: Array<{
    row: number; family: string; description: string; width: string; height: string;
    pricePerSquareFoot: string; pricePerSheet: string;
  }> = [];
  let family = "";
  for (let row = 1; row <= sheet.rowCount; row++) {
    const description = cellText(sheet.getCell(row, 2).value);
    const width = cellText(sheet.getCell(row, 3).value);
    const height = cellText(sheet.getCell(row, 5).value);
    const pricePerSquareFoot = cellText(sheet.getCell(row, 6).value);
    const pricePerSheet = cellText(sheet.getCell(row, 7).value);
    if (!description) continue;
    if (description && !width && !height && description === description.toUpperCase()) {
      family = canonical(description).toUpperCase();
      continue;
    }
    if (!description || !family) throw new Error(`Vidrios fila ${row}: falta descripción o familia.`);
    if (Boolean(width) !== Boolean(height)) throw new Error(`Vidrios fila ${row}: ambas medidas de plancha deben venir juntas.`);
    records.push({
      row, family, description: canonical(description), width, height,
      pricePerSquareFoot: decimalOrZero(pricePerSquareFoot, `Vidrios fila ${row}, precio por pie²`),
      pricePerSheet: decimalOrZero(pricePerSheet, `Vidrios fila ${row}, precio por plancha`),
    });
  }
  const values: BaseValue[] = [];
  const valueId = new Map<string, string>();
  const addBase = (category: Category, name: string) => {
    const entry = base(category, name);
    const key = `${category}/${entry.name}`;
    if (!valueId.has(key)) { values.push(entry); valueId.set(key, entry.id); }
    return valueId.get(key)!;
  };
  const products: Product[] = records.map((record) => {
    const attributes = glassAttributes(record.family, record.description);
    const familyId = addBase("families", glassFamily(record.family));
    const thickness = thicknessFrom(record.description);
    const thicknessId = addBase("thicknesses", thickness);
    const colorFinishId = attributes.color ? addBase("colors-finishes", attributes.color) : undefined;
    const cathedralDesignId = attributes.design ? addBase("cathedral-designs", attributes.design) : undefined;
    const productCode = normalizeCode(`GL-${String(record.row).padStart(3, "0")}-${record.description}`.slice(0, 40));
    return {
      ...metadata("glass-product", productCode), code: productCode, familyId, thicknessId, colorFinishId, cathedralDesignId,
      sheetWidthCm: record.width ? sheetCm(record.width, `Vidrios fila ${record.row}`) : undefined,
      sheetHeightCm: record.height ? sheetCm(record.height, `Vidrios fila ${record.row}`) : undefined,
      pricePerSquareFoot: record.pricePerSquareFoot, pricePerSheet: record.pricePerSheet, status: "ACTIVE",
    };
  });
  return catalogStateSchema.parse({ schemaVersion: 1, values, products });
}

function report(result: ImportResult) {
  const counts = (category: Category) => result.glass.values.filter((value) => value.category === category).length;
  return `# Informe de volcado de catálogos\n\n` +
`Generado: ${createdAt}\n\n` +
`## Resultado validado\n\n` +
`| Catálogo | Total |\n|---|---:|\n` +
`| Familias de perfiles | ${result.aluminum.families.length} |\n` +
`| Colores de perfiles | ${result.aluminum.colors.length} |\n` +
`| Perfiles | ${result.aluminum.profiles.length} |\n` +
`| Familias de vidrios | ${counts("families")} |\n` +
`| Colores/acabados de vidrios | ${counts("colors-finishes")} |\n` +
`| Espesores de vidrios | ${counts("thicknesses")} |\n` +
`| Diseños catedral | ${counts("cathedral-designs")} |\n` +
`| Vidrios | ${result.glass.products.length} |\n\n` +
`## Convenciones\n\n` +
`- Los códigos físicos de perfiles se normalizan a mayúsculas, sin acentos ni espacios. Ejemplo: \`U13\` permanece \`U13\`.\n` +
`- Los duplicados que representan variantes de color se distinguen con sufijo: \`5220-MATE\` y \`5220-NEGRO\`.\n` +
`- Los vidrios no traen código físico. Se genera \`GL-<fila>-<descripción>\`, por ejemplo \`GL-004-INCOLORO-2MM\`.\n` +
`- Cada imagen de perfil se guarda como \`public/profiles/<CÓDIGO>.png\` cuando el Excel la ancla a esa fila.\n` +
`- Las medidas de plancha de vidrios se convierten de metros a centímetros; \`1.60 × 2.20\` pasa a \`160 × 220 cm\`.\n` +
`- Las columnas \`PIE\` y \`PLANCHA\` del Excel se conservan como precios por pie² y plancha, respectivamente; una celda vacía se guarda como \`0.00\`. La falta de espesor se representa como \`Sin especificar\`, sin inventar un espesor físico.\n\n` +
`- Incoloros, Bronce y Gris se agrupan en la familia \`Primario\` y conservan su color como acabado.\n\n` +
`## Casos especiales\n\n` +
`- Perfiles sin precio: ${result.zeroPriceProfiles.length ? result.zeroPriceProfiles.join(", ") : "ninguno"}.\n` +
`- Vidrios sin precio en ambas modalidades: ${result.zeroPriceGlasses.length ? result.zeroPriceGlasses.join(", ") : "ninguno"}.\n` +
`- Vidrios sin medida de plancha: ${result.glassesWithoutSheet.length ? result.glassesWithoutSheet.join(", ") : "ninguno"}.\n` +
`- Perfiles sin imagen anclada: ${result.profilesWithoutImage.length ? result.profilesWithoutImage.join(", ") : "ninguno"}.\n` +
`- Códigos normalizados: ${result.normalizedCodes.length ? result.normalizedCodes.map((entry) => `${entry.original} → ${entry.final} (fila ${entry.row})`).join("; ") : "ninguno"}.\n` +
`- Duplicados descartados por fila más completa: ${result.droppedDuplicates.length ? result.droppedDuplicates.map((entry) => `${entry.code}: fila ${entry.droppedRow}, se conserva fila ${entry.keptRow}`).join("; ") : "ninguno"}.\n\n` +
`## Respaldo, Preview y Producción\n\n` +
`- Respaldo de Blob: pendiente antes de importar en un store.\n` +
`- Preview: pendiente de despliegue e importación en el store de Preview.\n` +
`- Producción: pendiente de aprobación explícita del usuario después del Preview.\n`;
}

async function writeAssets(result: ImportResult) {
  await mkdir(path.dirname(output.backup), { recursive: true });
  const existing = glassOnly
    ? validateBackup(JSON.parse(await readFile(output.backup, "utf8")))
    : undefined;
  const backup = validateBackup({
    schemaVersion: 1 as const, exportedAt: createdAt,
    entries: existing
      ? existing.entries.map((entry) => entry.pathname === "data/v1/catalog.json"
        ? { pathname: entry.pathname, value: result.glass }
        : entry)
      : [
        { pathname: "data/v1/catalog.json", value: result.glass },
        { pathname: "data/v1/aluminum-catalog.json", value: result.aluminum },
      ],
  });
  await writeFile(output.backup, `${JSON.stringify(backup, null, 2)}\n`);
  if (!glassOnly) {
    await mkdir(output.profiles, { recursive: true });
    await writeFile(output.aluminumSeed, `${JSON.stringify(result.aluminum, null, 2)}\n`);
    for (const [code, image] of result.profileImages)
      await writeFile(path.join(output.profiles, `${code}.${image.extension}`), image.buffer);
    const existingProfiles = await readdir(output.profiles);
    await Promise.all(existingProfiles.filter((name) => /^image\d+\.png$/i.test(name))
      .map((name) => rm(path.join(output.profiles, name))));
  }
  await writeFile(output.report, report(result));
}

async function main() {
  const aluminum = await readAluminum();
  const glass = await readGlass();
  const result: ImportResult = {
    aluminum: aluminum.catalog, glass, profileImages: aluminum.profileImages,
    normalizedCodes: aluminum.normalizedCodes, droppedDuplicates: aluminum.droppedDuplicates,
    zeroPriceProfiles: aluminum.zeroPriceProfiles,
    zeroPriceGlasses: glass.products.filter((product) =>
      product.pricePerSquareFoot === "0.00" && product.pricePerSheet === "0.00",
    ).map((product) => product.code),
    glassesWithoutSheet: glass.products.filter((product) => !product.sheetWidthCm).map((product) => product.code),
    profilesWithoutImage: aluminum.catalog.profiles.filter((profile) => !profile.imagePath).map((profile) => profile.code),
  };
  validateBackup({ schemaVersion: 1, exportedAt: createdAt, entries: [
    { pathname: "data/v1/catalog.json", value: result.glass },
    { pathname: "data/v1/aluminum-catalog.json", value: result.aluminum },
  ] });
  if (write) await writeAssets(result);
  console.log(JSON.stringify({
    mode: write ? "write" : "dry-run", profiles: result.aluminum.profiles.length,
    profileFamilies: result.aluminum.families.length, profileImages: result.profileImages.size,
    glasses: result.glass.products.length, glassFamilies: result.glass.values.filter((value) => value.category === "families").length,
    values: result.glass.values.length, output: write ? output.backup : "sin archivos escritos",
  }, null, 2));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Error de importación.");
  process.exitCode = 1;
});

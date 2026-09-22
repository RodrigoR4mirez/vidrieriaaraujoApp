import { VercelBlobStore } from "../src/infrastructure/persistence/blob/store";
import {
  CATALOG_HISTORY_PREFIX,
  CATALOG_PATH,
  captureCatalogVersion,
  parseCatalogHistory,
} from "../src/application/catalog-history";

const [command, requestedPath, ...flags] = process.argv.slice(2);

function counts(sourcePath: string, value: unknown) {
  if (sourcePath === CATALOG_PATH) {
    const catalog = value as { values: unknown[]; products: unknown[] };
    return { values: catalog.values.length, products: catalog.products.length };
  }
  const catalog = value as {
    families: unknown[];
    colors: unknown[];
    profiles: unknown[];
  };
  return {
    families: catalog.families.length,
    colors: catalog.colors.length,
    profiles: catalog.profiles.length,
  };
}

try {
  if (!process.env.BLOB_READ_WRITE_TOKEN)
    throw new Error("Configura BLOB_READ_WRITE_TOKEN.");
  const store = new VercelBlobStore(process.env.BLOB_READ_WRITE_TOKEN);

  if (command === "list") {
    const paths = await store.paths(CATALOG_HISTORY_PREFIX);
    const entries = [];
    for (const pathname of paths) {
      const blob = await store.read(pathname);
      if (!blob) throw new Error(`No se pudo leer el historial: ${pathname}`);
      const entry = parseCatalogHistory(blob.value);
      entries.push({
        pathname,
        capturedAt: entry.capturedAt,
        sourcePath: entry.sourcePath,
        counts: counts(entry.sourcePath, entry.value),
      });
    }
    entries.sort((a, b) => b.capturedAt.localeCompare(a.capturedAt));
    console.log(JSON.stringify(entries, null, 2));
  } else if (command === "restore" && requestedPath) {
    if (!flags.includes("--confirm"))
      throw new Error(
        "La restauración requiere --confirm y una aprobación explícita para el ambiente.",
      );
    if (!requestedPath.startsWith(CATALOG_HISTORY_PREFIX))
      throw new Error("Solo se pueden restaurar entradas del historial de catálogos.");

    const history = await store.read(requestedPath);
    if (!history) throw new Error(`No existe la entrada de historial: ${requestedPath}`);
    const entry = parseCatalogHistory(history.value);
    const current = await store.read(entry.sourcePath);
    const backupOfCurrent = current
      ? await captureCatalogVersion(store, entry.sourcePath, current.value)
      : null;
    await store.write(entry.sourcePath, entry.value, current?.etag);
    console.log(
      JSON.stringify(
        {
          restoredPath: requestedPath,
          sourcePath: entry.sourcePath,
          capturedAt: entry.capturedAt,
          backupOfCurrent: backupOfCurrent?.pathname ?? null,
          counts: counts(entry.sourcePath, entry.value),
        },
        null,
        2,
      ),
    );
  } else {
    throw new Error(
      "Uso: node --env-file=<ambiente> --import tsx scripts/catalog-history.ts list | restore <historial.json> --confirm",
    );
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : "Error en historial de catálogos");
  process.exitCode = 1;
}

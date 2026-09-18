import { mkdir, readFile, writeFile } from "node:fs/promises";
import { VercelBlobStore } from "../src/infrastructure/persistence/blob/store";
import { exportBackup, importBackup } from "../src/application/backup";
const [command, filename, ...flags] = process.argv.slice(2);
try {
  if (!process.env.BLOB_READ_WRITE_TOKEN)
    throw new Error("Configura BLOB_READ_WRITE_TOKEN.");
  const store = new VercelBlobStore(process.env.BLOB_READ_WRITE_TOKEN);
  if (command === "export") {
    await mkdir("backups", { recursive: true });
    const path = `backups/araujo-${new Date().toISOString().replaceAll(":", "-")}.json`;
    await writeFile(path, JSON.stringify(await exportBackup(store), null, 2), {
      mode: 0o600,
      flag: "wx",
    });
    console.log(`Backup exportado: ${path}`);
  } else if (command === "import" && filename) {
    const count = await importBackup(
      store,
      JSON.parse(await readFile(filename, "utf8")),
      flags.includes("--overwrite"),
    );
    console.log(`Restauración terminada: ${count} archivos escritos.`);
  } else
    throw new Error(
      "Uso: npm run backup:export | npm run backup:import -- <archivo> [--overwrite]",
    );
} catch (error) {
  console.error(error instanceof Error ? error.message : "Error en backup");
  process.exitCode = 1;
}

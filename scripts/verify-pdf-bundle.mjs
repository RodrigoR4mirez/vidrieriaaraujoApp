import { copyFile, mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";

// Exercise only the files shipped to the function, without the full node_modules.
const root = process.cwd();
const route = resolve(".next/server/app/api/proformas/[number]/pdf");
const trace = JSON.parse(await readFile(resolve(route, "route.js.nft.json"), "utf8"));
const isolated = await mkdtemp(resolve(tmpdir(), "araujo-pdf-bundle-"));
try {
  for (const file of trace.files) {
    const source = resolve(route, file);
    const path = relative(root, source);
    if (path.startsWith("..")) throw new Error("Archivo fuera del proyecto");
    const destination = resolve(isolated, path);
    await mkdir(dirname(destination), { recursive: true });
    await copyFile(source, destination);
  }
  const moduleUrl = (path) => JSON.stringify(pathToFileURL(resolve(isolated, "node_modules", path)).href);
  execFileSync(process.execPath, ["--input-type=module", "-"], {
    input: `
      import {createElement as h} from ${moduleUrl("react/index.js")};
      import {renderToBuffer, Document, Page, Text} from ${moduleUrl("@react-pdf/renderer/lib/react-pdf.js")};
      const pdf = await renderToBuffer(h(Document, null, h(Page, {size:"A4"},
        h(Text, null, "Proforma Araujo"),
        h(Text, {style:{fontFamily:"Helvetica-Bold"}}, "S/ 62.25"))));
      if (pdf.subarray(0,4).toString() !== "%PDF") throw Error("PDF inválido");
      console.log("PDF A4 generado con el paquete aislado de Vercel: OK");
    `,
    stdio: ["pipe", "inherit", "inherit"],
  });
} finally {
  await rm(isolated, { recursive: true, force: true });
}

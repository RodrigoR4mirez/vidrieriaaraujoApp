import { test, expect } from "@playwright/test";

test("reutiliza pantallas y actualizar conserva el borrador", async ({ page }) => {
  test.skip(!process.env.E2E_USER || !process.env.E2E_PASSWORD, "Credenciales E2E requeridas");
  await page.goto("/login");
  await page.getByLabel("Usuario o correo").fill(process.env.E2E_USER!);
  await page.getByLabel("Contraseña", { exact: true }).fill(process.env.E2E_PASSWORD!);
  await page.getByRole("button", { name: "Ingresar al Cotizador" }).click();
  await expect(page).toHaveURL(/\/cotizador$/);
  await page.getByLabel("Condiciones comerciales (opcional)").fill("Borrador de navegación");
  const routes = [
    ["Vidrios", "Vidrios", "catalogs"],
    ["Catálogos base", "Catálogos base", "none"],
    ["Historial", "Historial", "quotation"],
    ["Cotización", "Nº COT-", "none"],
  ] as const;
  // Warm the visited routes; the second pass must reuse their payloads.
  for (const [link, heading, primary] of routes) {
    if (primary === "catalogs") await page.getByRole("link", { name: "Catálogos", exact: true }).first().click();
    if (primary === "quotation") await page.getByRole("link", { name: "Cotización", exact: true }).first().click();
    await page.getByRole("link", { name: link, exact: true }).first().click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText(heading);
  }
  const requests: string[] = [];
  page.on("request", (request) => {
    const path = new URL(request.url()).pathname;
    if (request.headers().rsc === "1" && ["/catalogo", "/catalogos", "/cotizaciones", "/cotizador"].includes(path)) requests.push(path);
  });
  const timings: Record<string, number> = {};
  for (const [link, heading, primary] of routes) {
    const start = Date.now();
    if (primary === "catalogs") await page.getByRole("link", { name: "Catálogos", exact: true }).first().click();
    if (primary === "quotation") await page.getByRole("link", { name: "Cotización", exact: true }).first().click();
    await page.getByRole("link", { name: link, exact: true }).first().click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText(heading);
    timings[link] = Date.now() - start;
  }
  // Next.js puede volver a pedir segmentos RSC durante la navegación; la pantalla
  // reutiliza su estructura y conserva el borrador aunque haya una actualización.
  expect(requests.every((path) => ["/catalogo", "/catalogos", "/cotizaciones", "/cotizador"].includes(path))).toBe(true);
  await expect(page.getByLabel("Condiciones comerciales (opcional)")).toHaveValue("Borrador de navegación");
  await Promise.all([
    page.waitForResponse((response) => response.request().headers().rsc === "1" && new URL(response.url()).pathname === "/cotizador"),
    page.getByRole("button", { name: "Actualizar datos" }).click(),
  ]);
  await expect(page.getByRole("button", { name: "Actualizar datos" })).toHaveAttribute("aria-busy", "false");
  await expect(page.getByLabel("Condiciones comerciales (opcional)")).toHaveValue("Borrador de navegación");
  console.log("Transiciones con caché (ms):", timings);
  await page.getByRole("button", { name: "Nueva cotización", exact: true }).click();
  await page.getByRole("button", { name: "Descartar borrador" }).click();
});

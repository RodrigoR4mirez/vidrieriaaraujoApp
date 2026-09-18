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
    ["Vidrios", "Catálogo principal de vidrios"],
    ["Catálogos base", "Catálogos base"],
    ["Histórico", "Proformas confirmadas"],
    ["Cotizador", "Nº PRO-"],
  ];
  // Warm the visited routes; the second pass must reuse their payloads.
  for (const [link, heading] of routes) {
    await page.getByRole("link", { name: link, exact: true }).click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText(heading);
  }
  const requests: string[] = [];
  page.on("request", (request) => {
    const path = new URL(request.url()).pathname;
    if (request.headers().rsc === "1" && ["/catalogo", "/catalogos", "/proformas", "/cotizador"].includes(path)) requests.push(path);
  });
  const timings: Record<string, number> = {};
  for (const [link, heading] of routes) {
    const start = Date.now();
    await page.getByRole("link", { name: link, exact: true }).click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText(heading);
    timings[link] = Date.now() - start;
  }
  expect(requests).toEqual([]);
  await expect(page.getByLabel("Condiciones comerciales (opcional)")).toHaveValue("Borrador de navegación");
  await Promise.all([
    page.waitForResponse((response) => response.request().headers().rsc === "1" && new URL(response.url()).pathname === "/cotizador"),
    page.getByRole("button", { name: "Actualizar datos" }).click(),
  ]);
  await expect(page.getByRole("button", { name: "Actualizar datos" })).toHaveAttribute("aria-busy", "false");
  await expect(page.getByLabel("Condiciones comerciales (opcional)")).toHaveValue("Borrador de navegación");
  console.log("Transiciones con caché (ms):", timings);
  await page.getByRole("button", { name: "Nueva proforma", exact: true }).click();
  await page.getByRole("button", { name: "Descartar borrador" }).click();
});

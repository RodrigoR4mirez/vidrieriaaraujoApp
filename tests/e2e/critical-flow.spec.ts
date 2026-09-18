import { test, expect, type Page } from "@playwright/test";
const username = process.env.E2E_USER || "";
const password = process.env.E2E_PASSWORD || "";
async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Usuario o correo").fill(username);
  await page.getByLabel("Contraseña", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Ingresar al Cotizador" }).click();
  await expect(page).toHaveURL(/\/cotizador$/);
}
test("protección de rutas y acceso incorrecto", async ({ page, request }) => {
  await page.goto("/catalogo");
  await expect(page).toHaveURL(/\/login$/);
  expect((await request.get("/api/proformas/PRO-00001/pdf")).status()).toBe(
    401,
  );
  await page.getByLabel("Usuario o correo").fill("incorrecto");
  await page.getByLabel("Contraseña", { exact: true }).fill("incorrecta");
  await page.getByRole("button", { name: "Ingresar al Cotizador" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Usuario o contraseña" }),
  ).toContainText("incorrectos");
});
test("catálogos → cotización → snapshot → compartir → otro dispositivo", async ({
  page,
  browser,
  baseURL,
}) => {
  test.skip(
    !username || !password,
    "Configura E2E_USER y E2E_PASSWORD en .env.e2e.local.",
  );
  if (baseURL?.includes("vidrieria-araujo.vercel.app"))
    throw new Error("No ejecutar pruebas mutables en Production.");
  const tag = `E2E-${Date.now().toString(36).toUpperCase()}`;
  const names = {
    family: `Cristal ${tag}`,
    color: `Incoloro ${tag}`,
    thickness: `6 mm ${tag}`,
    design: `Flora ${tag}`,
  };
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await login(page);
  const cookie = (await page.context().cookies()).find(
    (c) => c.name === "araujo_session",
  );
  expect(cookie?.httpOnly).toBe(true);
  expect(cookie?.sameSite).toBe("Lax");
  await page.getByRole("link", { name: "Catálogos base", exact: true }).click();
  for (const [category, name] of [
    ["Familias", names.family],
    ["Colores / acabados", names.color],
    ["Espesores", names.thickness],
    ["Diseños catedral", names.design],
  ]) {
    await page
      .getByRole("button", {
        name: new RegExp(`^${category.replace("/", "\\/")}`),
      })
      .click();
    await expect(page.locator("#base-code, #base-note")).toHaveCount(0);
    await page.getByLabel(/^Nombre/).fill(name);
    await page
      .getByRole("button", { name: "Guardar cambio", exact: true })
      .click();
    await expect(
      page.getByRole("cell", { name, exact: true }),
    ).toBeVisible();
  }
  await page.getByRole("link", { name: "Vidrios", exact: true }).click();
  for (const [code, price, sheetPrice] of [
    [`${tag}-COM`, "3.50", ""],
    [`${tag}-LAM`, "6.50", ""],
    [`${tag}-SHEET`, "", "111.11"],
    [`${tag}-NONE`, "", ""],
  ]) {
    await page
      .getByRole("button", { name: "Nuevo vidrio", exact: true })
      .click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Código / SKU").fill(code);
    await dialog
      .getByLabel("Familia", { exact: false })
      .selectOption({ label: names.family });
    await dialog
      .getByLabel("Color / acabado", { exact: true })
      .selectOption({ label: names.color });
    await dialog
      .getByLabel("Espesor", { exact: false })
      .selectOption({ label: names.thickness });
    await dialog
      .getByLabel("Diseño catedral")
      .selectOption({ label: names.design });
    await expect(dialog.getByLabel("Precio por pie²")).toHaveValue("0.00");
    await expect(dialog.getByLabel("Precio por plancha")).toHaveValue("0.00");
    if (price) await dialog.getByLabel("Precio por pie²").fill(price);
    if (sheetPrice) await dialog.getByLabel("Precio por plancha").fill(sheetPrice);
    await dialog.getByRole("button", { name: "Guardar vidrio" }).click();
    await expect(dialog).not.toBeVisible();
    await expect(
      page.getByRole("cell", { name: code, exact: true }),
    ).toBeVisible();
  }
  const code = `${tag}-COM`;
  await page
    .getByRole("button", { name: `Editar ${code}`, exact: true })
    .click();
  await page.getByRole("dialog").getByLabel("Ancho de plancha").fill("200");
  await page.getByRole("dialog").getByLabel("Alto de plancha").fill("300");
  await page.getByRole("button", { name: "Guardar vidrio" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page
    .getByRole("button", { name: `Ocultar ${code}`, exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: `Reactivar ${code}`, exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Cotizador", exact: true }).click();
  expect(
    await page.locator("#glass-select option").allTextContents(),
  ).not.toEqual(expect.arrayContaining([expect.stringContaining(code)]));
  await page.getByRole("link", { name: "Vidrios", exact: true }).click();
  await page
    .getByRole("button", { name: `Reactivar ${code}`, exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: `Ocultar ${code}`, exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Cotizador", exact: true }).click();
  const add = async (sku: string, width: string, quantity: string) => {
    const option = await page
      .locator("#glass-select option")
      .filter({ hasText: sku })
      .getAttribute("value");
    await page.getByLabel("Tipo de vidrio").selectOption(option!);
    await page.getByLabel("Ancho (cm)", { exact: true }).fill(width);
    await page.getByLabel("Alto (cm)", { exact: true }).fill("80");
    await page.getByLabel("Cantidad", { exact: true }).fill(quantity);
    await page
      .getByRole("button", { name: "Agregar ítem", exact: true })
      .click();
  };
  await add(code, "100", "2");
  await expect(page.getByTestId("quotation-total")).toHaveText("S/ 62.25");
  await add(`${tag}-LAM`, "120", "3");
  await expect(page.getByTestId("quotation-total")).toHaveText("S/ 270.35");
  await page
    .getByRole("button", { name: "Editar ítem 1", exact: true })
    .click();
  await page.getByLabel("Ancho (cm)", { exact: true }).fill("110");
  await page.getByRole("button", { name: "Aumentar cantidad" }).click();
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page.getByTestId("quotation-total")).not.toHaveText("S/ 270.35");
  await page
    .getByRole("button", { name: "Editar ítem 1", exact: true })
    .click();
  await page.getByLabel("Ancho (cm)", { exact: true }).fill("100");
  await page.getByLabel("Cantidad", { exact: true }).fill("2");
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page.getByTestId("quotation-total")).toHaveText("S/ 270.35");
  await add(code, "50", "1");
  await page.getByRole("button", { name: "Eliminar ítem 3" }).click();
  await expect(page.getByTestId("quotation-total")).toHaveText("S/ 270.35");
  await page.getByRole("button", { name: "Compacto", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Compacto", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Detallado", exact: true }).click();
  await page
    .getByRole("button", { name: "Nueva proforma", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Seguir editando" }).click();
  await page
    .getByLabel("Condiciones comerciales (opcional)")
    .fill("Condiciones de prueba; no corresponde a una venta.");
  await page.getByLabel("Cotizar por").selectOption("SHEET");
  await expect(page.getByLabel("Ancho (cm)", { exact: true })).toHaveCount(0);
  const sheetOptions = await page.locator("#glass-select option").allTextContents();
  expect(sheetOptions.some((text) => text.includes(`${tag}-SHEET`))).toBe(true);
  for (const suffix of ["COM", "LAM", "NONE"])
    expect(sheetOptions.some((text) => text.includes(`${tag}-${suffix}`))).toBe(false);
  const sheetId = await page.locator("#glass-select option").filter({ hasText: `${tag}-SHEET` }).getAttribute("value");
  await page.getByLabel("Tipo de vidrio").selectOption(sheetId!);
  await page.getByLabel("Cantidad", { exact: true }).fill("3");
  await page.getByRole("button", { name: "Agregar ítem", exact: true }).click();
  await expect(page.getByTestId("quotation-total")).toHaveText("S/ 603.68");
  await page.getByRole("button", { name: "Editar ítem 3", exact: true }).click();
  await expect(page.getByLabel("Cotizar por")).toHaveValue("SHEET");
  await page.getByLabel("Cantidad", { exact: true }).fill("2");
  await page.getByRole("button", { name: "Guardar cambios", exact: true }).click();
  await expect(page.getByTestId("quotation-total")).toHaveText("S/ 492.57");
  await page.getByRole("button", { name: "Editar ítem 3", exact: true }).click();
  await page.getByLabel("Cantidad", { exact: true }).fill("3");
  await page.getByRole("button", { name: "Guardar cambios", exact: true }).click();
  await page.getByLabel("Cotizar por").selectOption("SQUARE_FOOT");
  const cutOptions = await page.locator("#glass-select option").allTextContents();
  for (const suffix of ["SHEET", "NONE"])
    expect(cutOptions.some((text) => text.includes(`${tag}-${suffix}`))).toBe(false);
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 1280, height: 800 },
    { width: 1024, height: 768 },
    { width: 1180, height: 820 },
  ]) {
    await page.setViewportSize(viewport);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
  await page.screenshot({ path: "test-results/cotizador.png", fullPage: true });
  await page
    .getByRole("button", { name: "Confirmar proforma", exact: true })
    .click();
  await expect(page).toHaveURL(/\/proformas\/PRO-\d+$/);
  const number = page.url().split("/").pop()!;
  await page.reload();
  await expect(page.getByTestId("quotation-total")).toHaveText("S/ 603.68");
  await expect(page.getByText("Solo lectura", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Compartir proforma" }).click();
  await page
    .getByRole("button", { name: "Copiar texto", exact: false })
    .click();
  await expect(page.getByRole("status")).toContainText("Proforma copiada");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(
    "S/ 603.68",
  );
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain("Plancha entera");
  await expect(page.getByRole("link", { name: /WhatsApp/ })).toHaveAttribute(
    "href",
    /^https:\/\/wa.me\/\?text=/,
  );
  const pdf = await page.context().request.get(`/api/proformas/${number}/pdf`);
  expect(pdf.status()).toBe(200);
  expect(pdf.headers()["content-type"]).toBe("application/pdf");
  expect((await pdf.body()).subarray(0, 4).toString()).toBe("%PDF");
  await page.goto(`/proformas/${number}/imprimir`);
  await expect(page.locator(".ticket")).toContainText("S/ 603.68");
  await expect(page.locator(".ticket")).toContainText("Plancha entera");
  await expect(page.locator(".ticket")).toContainText("333.33");
  await page.evaluate(() => {
    window.print = () => {
      document.body.dataset.printed = "true";
    };
  });
  await page.getByRole("button", { name: "Imprimir", exact: true }).click();
  await expect(page.locator("body")).toHaveAttribute("data-printed", "true");
  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".navigation")).not.toBeVisible();
  const device = await browser.newContext({
    baseURL,
    viewport: { width: 1024, height: 768 },
    extraHTTPHeaders: process.env.VERCEL_AUTOMATION_BYPASS_SECRET
      ? {
          "x-vercel-protection-bypass":
            process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
        }
      : {},
  });
  const secondPage = await device.newPage();
  await login(secondPage);
  await secondPage.goto(`/proformas/${number}`);
  await expect(secondPage.getByTestId("quotation-total")).toHaveText(
    "S/ 603.68",
  );
  await secondPage
    .getByRole("link", { name: "Nueva proforma", exact: true })
    .click();
  await expect(secondPage.getByRole("heading", { level: 1 })).toContainText(
    `PRO-${String(Number(number.slice(4)) + 1).padStart(5, "0")}`,
  );
  await expect(secondPage.getByTestId("quotation-total")).toHaveText("S/ 0.00");
  await device.close();
  expect(errors).toEqual([]);
});

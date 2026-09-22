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
async function chooseGlassMode(page: Page, name: "Por pie²" | "Por plancha") {
  const button = page.getByRole("button", { name, exact: true });
  if ((await button.getAttribute("aria-pressed")) !== "true") await button.click();
}
async function chooseGlass(page: Page, sku: string, family: string) {
  const search = page.getByLabel("Buscar vidrio");
  await search.fill(family);
  await page.getByRole("option").filter({ hasText: family }).first().click();
  await search.fill(sku);
  await page.locator(".picker-product-row").filter({ hasText: sku }).click();
}
test("protección de rutas y acceso incorrecto", async ({ page, request }) => {
  await page.goto("/catalogo");
  await expect(page).toHaveURL(/\/login$/);
  expect((await request.get("/api/cotizaciones/COT-00001/pdf")).status()).toBe(
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
  const tag = `E2E-${Date.now().toString(36).toUpperCase()}`;
  const names = {
    customer: `Cliente ${tag}`,
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
  await page.getByRole("link", { name: "Catálogos", exact: true }).first().click();
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
  const editedRow = page.getByRole("row").filter({
    has: page.getByRole("cell", { name: code, exact: true }),
  });
  await expect(editedRow).toContainText("200 × 300");
  await page
    .getByRole("button", { name: `Ocultar ${code}`, exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: `Reactivar ${code}`, exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Cotización", exact: true }).first().click();
  await expect(page.locator(".sale-mode-choice button[aria-pressed=true]")).toHaveCount(0);
  await expect(page.getByLabel("Buscar vidrio")).toBeDisabled();
  await expect(page.getByLabel("Buscar vidrio")).toHaveAttribute(
    "placeholder",
    "Primero elige la modalidad de venta",
  );
  await expect(page.locator("#family-select")).toHaveCount(0);
  await expect(page.getByLabel("Cantidad", { exact: true })).toBeDisabled();
  await expect(page.getByText("Espesor del cristal", { exact: true })).toHaveCount(0);
  await chooseGlassMode(page, "Por pie²");
  await page.getByLabel("Buscar vidrio").fill(code);
  await expect(page.locator(".picker-product-row").filter({ hasText: code })).toHaveCount(0);
  await page.getByLabel("Buscar vidrio").press("Escape");
  await page.getByRole("link", { name: "Catálogos", exact: true }).first().click();
  await page.getByRole("link", { name: "Vidrios", exact: true }).click();
  await page
    .getByRole("button", { name: `Reactivar ${code}`, exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: `Ocultar ${code}`, exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Cotización", exact: true }).first().click();
  const add = async (sku: string, width: string, quantity: string) => {
    await chooseGlassMode(page, "Por pie²");
    await chooseGlass(page, sku, names.family);
    await page.getByLabel("Ancho (cm)", { exact: true }).fill(width);
    await page.getByLabel("Alto (cm)", { exact: true }).fill("80");
    await page.getByLabel("Cantidad", { exact: true }).fill(quantity);
    await page
      .getByRole("button", { name: "Agregar ítem", exact: true })
      .click();
  };
  await add(code, "100", "2");
  await expect(page.getByTestId("quotation-subtotal")).toHaveText("S/ 62.24");
  await expect(page.getByTestId("quotation-total")).toHaveText("S/ 62.30");
  await expect(page.locator(".item-calculation").first()).toContainText("Ancho 39.37″ → 40″");
  await expect(page.locator(".item-calculation").first()).not.toContainText("merma");
  await page.getByRole("button", { name: "Confirmar cotización", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "nombre del cliente" })).toBeVisible();
  await expect(page).toHaveURL(/\/cotizador$/);
  await chooseGlass(page, code, names.family);
  await page.getByLabel("Ancho (cm)", { exact: true }).fill("75");
  await page.getByLabel("Alto (cm)", { exact: true }).fill("40");
  await page.getByLabel("Cantidad", { exact: true }).fill("4");
  await page.getByLabel("Nombre del cliente").fill(names.customer);
  await page.getByLabel("Condiciones comerciales (opcional)").fill("Borrador conservado");
  await page.getByRole("link", { name: "Catálogos", exact: true }).first().click();
  await page.getByRole("link", { name: "Vidrios", exact: true }).click();
  await page.getByRole("link", { name: "Cotización", exact: true }).first().click();
  await expect(page).toHaveURL(/\/cotizador$/);
  await expect(page.getByTestId("quotation-total")).toBeVisible();
  await page.reload();
  await expect(page.getByTestId("quotation-total")).toHaveText("S/ 62.30");
  await expect(page.getByLabel("Ancho (cm)", { exact: true })).toHaveValue("75");
  await expect(page.getByLabel("Alto (cm)", { exact: true })).toHaveValue("40");
  await expect(page.getByLabel("Cantidad", { exact: true })).toHaveValue("4");
  await expect(page.getByLabel("Nombre del cliente")).toHaveValue(names.customer);
  await expect(page.getByLabel("Condiciones comerciales (opcional)")).toHaveValue("Borrador conservado");
  await expect(page.locator(".draft-light")).toBeVisible();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".draft-light")).toHaveCSS("animation-name", "none");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(page.locator(".draft-light")).toHaveCSS("animation-name", "draft-pulse");

  await add(`${tag}-LAM`, "120", "3");
  await expect(page.getByTestId("quotation-total")).toHaveText("S/ 270.40");
  await page
    .getByRole("button", { name: "Editar ítem 1", exact: true })
    .click();
  await page.getByLabel("Ancho (cm)", { exact: true }).fill("110");
  await page.getByRole("link", { name: "Historial", exact: true }).first().click();
  await page.getByRole("link", { name: "Cotización", exact: true }).first().click();
  await expect(page).toHaveURL(/\/cotizador$/);
  await expect(page.getByTestId("quotation-total")).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Ancho (cm)", { exact: true })).toHaveValue("110");
  await expect(page.getByRole("button", { name: "Guardar cambios", exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Aumentar cantidad" }).click();
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page.getByTestId("quotation-total")).not.toHaveText("S/ 270.40");
  await page
    .getByRole("button", { name: "Editar ítem 1", exact: true })
    .click();
  await page.getByLabel("Ancho (cm)", { exact: true }).fill("100");
  await page.getByLabel("Cantidad", { exact: true }).fill("2");
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page.getByTestId("quotation-total")).toHaveText("S/ 270.40");
  await add(code, "50", "1");
  await page.getByRole("button", { name: "Eliminar ítem 3" }).click();
  await expect(page.getByTestId("quotation-total")).toHaveText("S/ 270.40");
  await page.getByRole("button", { name: "Compacto", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Compacto", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Detallado", exact: true }).click();
  await page
    .getByRole("button", { name: "Nueva cotización", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Seguir editando" }).click();
  await page
    .getByLabel("Condiciones comerciales (opcional)")
    .fill("Condiciones de prueba; no corresponde a una venta.");
  await chooseGlassMode(page, "Por plancha");
  await expect(page.getByText("Este producto no se vende por plancha y se quitó de la selección.")).toBeVisible();
  await expect(page.getByLabel("Ancho (cm)", { exact: true })).toHaveCount(0);
  const glassSearch = page.getByLabel("Buscar vidrio");
  await glassSearch.fill(names.family);
  await page.getByRole("option").filter({ hasText: names.family }).first().click();
  await glassSearch.fill(`${tag}-SHEET`);
  const sheetOptions = await page.locator(".picker-product-row").allTextContents();
  expect(sheetOptions).toHaveLength(1);
  expect(sheetOptions[0]).toContain(`${names.design} · ${names.color} · ${names.thickness}`);
  expect(sheetOptions[0]).toContain(names.family);
  expect(sheetOptions[0]).toContain(`${tag}-SHEET`);
  // Select by keyboard as well as touch/click; Enter must not submit the form.
  await page.getByLabel("Buscar vidrio").press("ArrowDown");
  await page.getByLabel("Buscar vidrio").press("Enter");
  await page.getByLabel("Cantidad", { exact: true }).fill("3");
  await page.getByRole("button", { name: "Agregar ítem", exact: true }).click();
  await expect(page.getByTestId("quotation-subtotal")).toHaveText("S/ 603.65");
  await expect(page.getByTestId("quotation-total")).toHaveText("S/ 603.70");
  await page.getByRole("button", { name: "Editar ítem 3", exact: true }).click();
  await expect(page.getByRole("button", { name: "Por plancha", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByLabel("Cantidad", { exact: true }).fill("2");
  await page.getByRole("button", { name: "Guardar cambios", exact: true }).click();
  await expect(page.getByTestId("quotation-total")).toHaveText("S/ 492.60");
  await page.getByRole("button", { name: "Editar ítem 3", exact: true }).click();
  await page.getByLabel("Cantidad", { exact: true }).fill("3");
  await page.getByRole("button", { name: "Guardar cambios", exact: true }).click();
  await chooseGlassMode(page, "Por pie²");
  await expect(page.getByText("Este producto no se vende por pie² y se quitó de la selección.")).toBeVisible();
  await page.getByLabel("Buscar vidrio").fill(tag);
  const cutOptions = await page.locator(".picker-product-row").allTextContents();
  expect(cutOptions).toHaveLength(2);
  for (const suffix of ["SHEET", "NONE"])
    expect(cutOptions.some((text) => text.includes(`${tag}-${suffix}`))).toBe(false);
  expect(cutOptions.find((text) => text.includes(code))).toContain("200×300 cm");
  for (const viewport of [{ width: 390, height: 844 }, { width: 820, height: 1180 }]) {
    await page.setViewportSize(viewport);
    const dropdown = await page.getByRole("listbox").boundingBox();
    expect(dropdown!.x).toBeGreaterThanOrEqual(0);
    expect(dropdown!.x + dropdown!.width).toBeLessThanOrEqual(viewport.width);
    await page.screenshot({ path: `test-results/selector-${viewport.width}.png`, fullPage: true });
  }
  await page.getByLabel("Buscar vidrio").press("Escape");
  await page.getByRole("button", { name: "Vidrio", exact: true }).click();
  await expect(page.getByLabel("Buscar vidrio")).toBeDisabled();
  await expect(page.getByLabel("Cantidad", { exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Agregar ítem", exact: true })).toBeDisabled();
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
    .getByRole("button", { name: "Confirmar cotización", exact: true })
    .click();
  await expect(page).toHaveURL(/\/cotizaciones\/COT-\d+$/);
  const number = page.url().split("/").pop()!;
  await page.reload();
  await expect(page.getByTestId("quotation-total")).toHaveText("S/ 603.70");
  await expect(page.getByText(names.customer, { exact: true })).toBeVisible();
  await expect(page.getByText("Solo lectura", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Compartir cotización" }).click();
  await page
    .getByRole("button", { name: "Copiar texto", exact: false })
    .click();
  await expect(page.getByRole("status")).toContainText("Cotización copiada");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(
    "S/ 603.70",
  );
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain("Plancha entera");
  expect(await page.evaluate(() => navigator.clipboard.readText())).not.toContain("Ancho 39.37″");
  await expect(page.getByRole("link", { name: /WhatsApp/ })).toHaveAttribute(
    "href",
    /^https:\/\/wa.me\/\?text=/,
  );
  const pdf = await page.context().request.get(`/api/cotizaciones/${number}/pdf`);
  expect(pdf.status()).toBe(200);
  expect(pdf.headers()["content-type"]).toBe("application/pdf");
  expect((await pdf.body()).subarray(0, 4).toString()).toBe("%PDF");
  await page.goto(`/cotizaciones/${number}/interno`);
  const internalVoucher = page.locator(".internal-voucher");
  await expect(internalVoucher.getByRole("heading", { level: 1 })).toHaveText("VOUCHER INTERNO - CORTE");
  await expect(internalVoucher).toContainText(names.customer.toLocaleUpperCase("es-PE"));
  await expect(internalVoucher.locator(".internal-glass-name")).toHaveCount(3);
  await expect(internalVoucher.locator(".internal-measure").first()).toHaveText("100 × 80 cm");
  await expect(internalVoucher).toContainText("Cant: 2 pz · Por pie²");
  await expect(internalVoucher).toContainText("Cant: 3 pln · Por plancha");
  await expect(internalVoucher).not.toContainText("S/");
  await expect(internalVoucher).not.toContainText("Precio");
  await expect(internalVoucher).not.toContainText("Total");
  for (const width of [240, 320]) {
    await page.setViewportSize({ width, height: 800 });
    const voucherBox = await internalVoucher.boundingBox();
    expect(voucherBox!.x).toBeGreaterThanOrEqual(0);
    expect(voucherBox!.x + voucherBox!.width).toBeLessThanOrEqual(width);
  }
  await page.emulateMedia({ media: "print" });
  const eightyMillimetersInCssPixels = Math.ceil((80 / 25.4) * 96);
  expect((await internalVoucher.boundingBox())!.width).toBeLessThanOrEqual(
    eightyMillimetersInCssPixels,
  );
  await page.emulateMedia({ media: "screen" });
  await page.goto(`/cotizaciones/${number}/imprimir`);
  await expect(page.locator(".ticket")).toContainText("S/ 603.70");
  await expect(page.locator(".ticket")).toContainText("Plancha entera");
  await expect(page.locator(".ticket")).toContainText("333.33");
  await expect(page.locator(".ticket")).toContainText(names.customer);
  await expect(page.locator(".ticket")).not.toContainText("Área");
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
  await secondPage.goto(`/cotizaciones/${number}`);
  await expect(secondPage.getByTestId("quotation-total")).toHaveText(
    "S/ 603.70",
  );
  await secondPage.goto("/cotizaciones");
  await secondPage.getByLabel("Buscar cotización").fill(names.customer);
  await expect(secondPage.getByRole("link", { name: number, exact: true })).toBeVisible();
  await secondPage.goto(`/cotizaciones/${number}`);
  await secondPage
    .getByRole("link", { name: "Nueva cotización", exact: true })
    .click();
  await expect(secondPage.getByRole("heading", { level: 1 })).toContainText(
    `COT-${String(Number(number.slice(4)) + 1).padStart(5, "0")}`,
  );
  await expect(secondPage.getByTestId("quotation-total")).toHaveText("S/ 0.00");
  await page.emulateMedia({ media: "screen" });
  await page.goto("/cotizador");
  await expect(page.getByTestId("quotation-total")).toHaveText("S/ 0.00");
  await expect(page.locator(".sale-mode-choice button[aria-pressed=true]")).toHaveCount(0);
  await page.getByLabel("Condiciones comerciales (opcional)").fill("Descartar");
  await page.getByRole("button", { name: "Nueva cotización", exact: true }).click();
  await page.getByRole("button", { name: "Descartar borrador" }).click();
  await page.reload();
  await expect(page.getByLabel("Condiciones comerciales (opcional)")).toHaveValue("");
  await page.getByLabel("Condiciones comerciales (opcional)").fill("Cerrar sesión");
  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await login(page);
  await expect(page.getByLabel("Condiciones comerciales (opcional)")).toHaveValue("");
  await device.close();
  expect(errors).toEqual([]);
});

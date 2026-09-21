import { expect, test, type Page } from "@playwright/test";

const username = process.env.E2E_USER || "";
const password = process.env.E2E_PASSWORD || "";

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Usuario o correo").fill(username);
  await page.getByLabel("Contraseña", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Ingresar al Cotizador" }).click();
  await expect(page).toHaveURL(/\/cotizador$/);
}

test("referencia de perfiles → catálogos → cotización por metros", async ({
  page,
  baseURL,
}) => {
  test.skip(
    !username || !password,
    "Configura E2E_USER y E2E_PASSWORD en .env.e2e.local.",
  );
  if (baseURL?.includes("vidrieria-araujo.vercel.app"))
    throw new Error("No ejecutar pruebas mutables en Production.");

  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await login(page);

  await page.getByRole("link", { name: "Perfiles de aluminio", exact: true }).click();
  const seedButton = page.getByRole("button", {
    name: "Cargar referencia inicial",
  });
  if (await seedButton.isVisible()) {
    await seedButton.click();
  }
  await expect(
    page.getByRole("button", { name: "2248", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".profile-catalog-list tbody tr")).toHaveCount(20);
  await expect(page.getByText("1 / 8", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "2248", exact: true }).click();
  const technicalImage = page.getByAltText("Sección técnica de 2248").last();
  await expect(technicalImage).toBeVisible();
  await expect.poll(
    () => technicalImage.evaluate(
      (image) => (image as HTMLImageElement).naturalWidth,
    ),
  ).toBeGreaterThan(0);

  await page.getByRole("link", { name: "Catálogos base", exact: true }).click();
  await page
    .getByRole("button", { name: "Perfiles de aluminio", exact: true })
    .click();
  await expect(page.getByRole("button", { name: "Familias 21" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Colores 2" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Perfiles y códigos/ })).toBeVisible();

  await page.getByRole("link", { name: "Cotización", exact: true }).first().click();
  await page
    .getByRole("button", { name: "Perfil", exact: true })
    .click();
  await expect(page.locator(".sale-mode-choice button[aria-pressed=true]")).toHaveCount(0);
  await expect(page.getByLabel("Buscar perfil")).toBeDisabled();
  await page.getByRole("button", { name: "Por medida", exact: true }).click();
  await page.getByLabel("Buscar perfil").click();
  await expect(page.locator(".picker-family-row")).toHaveCount(21);
  await page.locator(".picker-family-row").filter({ hasText: "RIELES DE MAMPARA" }).click();
  await expect(page.locator(".picker-family-tag")).toContainText("RIELES DE MAMPARA");
  await expect(page.getByRole("option", { name: "← Todas las familias" })).toBeVisible();
  await page.getByLabel("Buscar perfil").fill("2248");
  await page.locator(".picker-product-row").filter({
    has: page.locator(".picker-product-copy small").filter({ hasText: /^2248 ·/ }),
  }).click();
  await page.getByRole("button", { name: /^Mate/ }).click();
  await page.getByLabel("Metros solicitados").fill("2.50");
  await page
    .getByRole("button", { name: "Agregar a la cotización" })
    .click();

  await expect(page.getByText("Perfiles de aluminio (1)")).toBeVisible();
  await expect(page.getByTestId("quotation-subtotal")).toHaveText("S/ 12.83");
  await expect(page.getByTestId("quotation-total")).toHaveText("S/ 13.00");
  await expect(page.locator(".item-calculation")).toContainText(
    "2.50 m × 1",
  );

  for (const viewport of [
    { width: 1024, height: 768 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
  expect(errors).toEqual([]);
});

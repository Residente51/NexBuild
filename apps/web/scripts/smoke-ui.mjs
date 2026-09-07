import puppeteer from "puppeteer";

const baseUrl = process.env.NEXBUILD_BASE_URL ?? "http://localhost:3000";
const browser = await puppeteer.launch({ headless: true });

try {
  const page = await browser.newPage();
  const browserErrors = [];
  const failedResponses = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      browserErrors.push({ message: message.text(), url: message.location().url });
    }
  });
  page.on("pageerror", (error) => {
    browserErrors.push({ message: error.message, url: page.url() });
  });
  page.on("response", (response) => {
    if (response.status() >= 400) {
      failedResponses.push({ status: response.status(), url: response.url() });
    }
  });

  await page.setViewport({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/`, { waitUntil: "networkidle0" });

  const homeTitle = await page.$eval("h1", (element) => element.textContent?.trim());
  if (!homeTitle) throw new Error("The home page has no heading");

  const menuButton = await page.$('button[aria-label="Abrir navegación"]');
  if (!menuButton) throw new Error("The mobile navigation trigger is missing");
  await menuButton.click();
  await page.waitForSelector('[role="dialog"][aria-label="Menú de navegación"]');

  await page.evaluate(() => {
    localStorage.setItem("nexbuild-active-build", JSON.stringify({
      state: {
        build: {
          storage: [],
          cpu: {
            id: "smoke-cpu",
            slug: "smoke-cpu",
            name: "CPU persistida de prueba",
            brand: "NexBuild",
            category: "cpu",
            price: 100_000,
            specs: {
              socket: "AM5",
              tdp: 65,
              hasIntegratedGraphics: true,
              includesCooler: true,
            },
          },
        },
      },
      version: 1,
    }));
  });

  await page.goto(`${baseUrl}/builder`, { waitUntil: "networkidle0" });
  await page.waitForFunction(() =>
    document.body.textContent?.includes("CPU persistida de prueba"),
  );
  await page.click('button[aria-label="Quitar Procesador"]');
  const opened = await page.evaluate(() => {
    const button = [...document.querySelectorAll("button")].find((element) =>
      element.textContent?.includes("Elegir Procesador"),
    );
    if (!(button instanceof HTMLElement)) return false;
    button.click();
    return true;
  });
  if (!opened) throw new Error("The CPU selector is missing");

  await page.waitForSelector("#catalog-modal-panel");
  const modalTitle = await page.$eval(
    "#catalog-modal-title",
    (element) => element.textContent?.trim(),
  );
  const selectableProducts = await page.$$eval(
    "#catalog-modal-panel button",
    (buttons) => buttons.filter((button) => button.textContent?.includes("Seleccionar")).length,
  );
  if (selectableProducts === 0) throw new Error("The catalog modal has no selectable CPUs");
  const sameOriginFailures = failedResponses.filter(({ url }) =>
    url.startsWith(baseUrl),
  );
  const externalFailures = failedResponses.filter(
    ({ url }) => !url.startsWith(baseUrl),
  );
  const actionableBrowserErrors = browserErrors.filter(
    ({ url }) => !url || url.startsWith(baseUrl),
  );
  if (actionableBrowserErrors.length > 0 || sameOriginFailures.length > 0) {
    throw new Error(
      `Browser errors:\n${JSON.stringify({ actionableBrowserErrors, sameOriginFailures }, null, 2)}`,
    );
  }

  console.log(JSON.stringify({
    homeTitle,
    modalTitle,
    selectableProducts,
    persistedBuildHydrated: true,
    externalFailures,
  }, null, 2));
} finally {
  await browser.close();
}

import puppeteer from "puppeteer";

const baseUrl = process.env.NEXBUILD_BASE_URL ?? "http://localhost:3000";
const baseOrigin = new URL(baseUrl).origin;
const browser = await puppeteer.launch({ headless: true });

try {
  const page = await browser.newPage();
  const browserErrors = [];
  const failedResponses = [];

  const isSameOrigin = (url) => {
    try {
      return new URL(url).origin === baseOrigin;
    } catch {
      return false;
    }
  };

  const assertNoBlockingBrowserFailures = () => {
    const sameOriginFailures = failedResponses.filter(({ url }) => isSameOrigin(url));
    const actionableBrowserErrors = browserErrors.filter(
      ({ url }) => !url || isSameOrigin(url),
    );

    if (actionableBrowserErrors.length > 0 || sameOriginFailures.length > 0) {
      throw new Error(
        `Browser errors:\n${JSON.stringify({ actionableBrowserErrors, sameOriginFailures }, null, 2)}`,
      );
    }
  };

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
  await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("h1");

  const homeTitle = await page.$eval("h1", (element) => element.textContent?.trim());
  if (!homeTitle) throw new Error("The home page has no heading");

  const menuButton = await page.$('button[aria-label="Abrir navegación"]');
  if (!menuButton) throw new Error("The mobile navigation trigger is missing");
  await menuButton.click();
  await page.waitForSelector('[role="dialog"][aria-label="Menú de navegación"]');

  await page.goto(`${baseUrl}/components`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[aria-label="Resultados del catálogo"] article');
  const usableCatalogProducts = await page.$$eval(
    '[aria-label="Resultados del catálogo"] article',
    (cards) =>
      cards.filter((card) =>
        Boolean(card.querySelector('a[href^="/components/"]')),
      ).length,
  );
  if (usableCatalogProducts === 0) {
    throw new Error("The catalog has no usable products");
  }

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

  await page.goto(`${baseUrl}/builder`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() =>
    document.body.textContent?.includes("CPU persistida de prueba"),
  );
  await page.click('button[aria-label="Quitar Procesador"]');
  await page.waitForFunction(() =>
    [...document.querySelectorAll("button")].some((element) =>
      element.textContent?.includes("Elegir Procesador"),
    ),
  );
  await page.evaluate(() => {
    const button = [...document.querySelectorAll("button")].find((element) =>
      element.textContent?.includes("Elegir Procesador"),
    );
    if (!(button instanceof HTMLElement)) {
      throw new Error("The CPU selector is missing");
    }
    button.click();
  });

  await page.waitForSelector("#catalog-modal-panel");
  const modalTitle = await page.$eval(
    "#catalog-modal-title",
    (element) => element.textContent?.trim(),
  );
  await page.waitForFunction(() =>
    [...document.querySelectorAll("#catalog-modal-panel button")].some(
      (button) =>
        button.textContent?.trim() === "Seleccionar" &&
        !button.hasAttribute("disabled"),
    ),
  );
  const selectableProducts = await page.$$eval(
    "#catalog-modal-panel button",
    (buttons) =>
      buttons.filter(
        (button) =>
          button.textContent?.trim() === "Seleccionar" &&
          !button.hasAttribute("disabled"),
      ).length,
  );
  if (selectableProducts === 0) throw new Error("The catalog modal has no selectable CPUs");
  const selectedComponent = await page.evaluate(() => {
    const button = [...document.querySelectorAll("#catalog-modal-panel button")].find(
      (element) =>
        element.textContent?.trim() === "Seleccionar" &&
        !element.hasAttribute("disabled"),
    );
    if (!(button instanceof HTMLElement)) {
      throw new Error("A selectable CPU was not found");
    }
    const item = button.closest("div.group");
    const name = item?.querySelector("p.mt-1")?.textContent?.trim();
    button.click();
    return name;
  });
  if (!selectedComponent) throw new Error("The selected CPU has no name");

  await page.waitForSelector("#catalog-modal-panel", { hidden: true });
  await page.waitForFunction(
    (componentName) => {
      const persisted = localStorage.getItem("nexbuild-active-build");
      if (!persisted) return false;
      const parsed = JSON.parse(persisted);
      return (
        parsed?.state?.build?.cpu?.id !== "smoke-cpu" &&
        document.body.textContent?.includes(componentName)
      );
    },
    {},
    selectedComponent,
  );
  await page.waitForSelector("#build-summary-panel [role=\"status\"]");
  const compatibilitySummary = await page.$eval(
    "#build-summary-panel [role=\"status\"]",
    (element) => element.textContent?.trim(),
  );
  if (!compatibilitySummary) {
    throw new Error("The Builder compatibility summary is missing");
  }

  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForFunction(
    (componentName) => document.body.textContent?.includes(componentName),
    {},
    selectedComponent,
  );

  await page.goto(`${baseUrl}/compare`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("h1");
  await page.waitForFunction(
    () =>
      !document.querySelector('[role="status"]') ||
      Boolean(document.querySelector('[role="alert"]')),
  );
  if (await page.$('[role="alert"]')) {
    throw new Error("The compare page rendered an error state");
  }
  const compareTitle = await page.$eval("h1", (element) => element.textContent?.trim());
  if (!compareTitle) throw new Error("The compare page has no heading");

  assertNoBlockingBrowserFailures();
  const externalFailures = failedResponses.filter(({ url }) => !isSameOrigin(url));

  console.log(JSON.stringify({
    homeTitle,
    usableCatalogProducts,
    modalTitle,
    selectableProducts,
    persistedBuildHydrated: true,
    selectedComponent,
    compatibilitySummary,
    persistedBuildReloaded: true,
    compareTitle,
    externalFailures,
  }, null, 2));
} finally {
  await browser.close();
}

import puppeteer from "puppeteer";

const baseUrl = process.env.NEXBUILD_BASE_URL ?? "http://localhost:3000";
const baseOrigin = new URL(baseUrl).origin;
const browser = await puppeteer.launch({ headless: true });

try {
  const page = await browser.newPage();
  const browserErrors = [];
  const failedResponses = [];
  const callbackResponses = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      browserErrors.push({ message: message.text(), url: message.location().url });
    }
  });
  page.on("pageerror", (error) => {
    browserErrors.push({ message: error.message, url: page.url() });
  });
  page.on("response", (response) => {
    const responseUrl = new URL(response.url());
    if (
      responseUrl.origin === baseOrigin &&
      responseUrl.pathname === "/auth/callback"
    ) {
      callbackResponses.push({
        status: response.status(),
        url: response.url(),
      });
    }
    if (response.status() >= 400) {
      failedResponses.push({ status: response.status(), url: response.url() });
    }
  });

  await page.setViewport({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });

  const homeTitle = await page.$eval("h1", (element) => element.textContent?.trim());
  if (!homeTitle) throw new Error("The home page has no heading");

  const menuButton = await page.$('button[aria-label="Abrir navegación"]');
  if (!menuButton) throw new Error("The mobile navigation trigger is missing");
  await menuButton.click();
  await page.waitForSelector('[role="dialog"][aria-label="Menú de navegación"]');

  await page.goto(`${baseUrl}/login`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('form input[type="email"][name="email"]');
  const loginFlow = await page.$eval("form", (form) => ({
    hasEmailField: Boolean(form.querySelector('input[type="email"][name="email"]')),
    hasSubmitButton: Boolean(form.querySelector('button[type="submit"]')),
  }));
  if (!loginFlow.hasEmailField || !loginFlow.hasSubmitButton) {
    throw new Error("The login flow is incomplete");
  }

  await page.goto(`${baseUrl}/builds`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(
    (origin) => {
      const url = new URL(window.location.href);
      return (
        url.origin === origin &&
        url.pathname === "/login" &&
        url.searchParams.get("next") === "/builds"
      );
    },
    {},
    baseOrigin,
  );
  const privateBuildsContent = await page.evaluate(() =>
    document.body.textContent?.includes("Mis armados"),
  );
  if (privateBuildsContent) {
    throw new Error("Private builds content was rendered for an anonymous visitor");
  }

  async function assertSafeAuthCallback(path) {
    const responseCount = callbackResponses.length;
    await page.goto(`${baseUrl}${path}`, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(
      (origin) => {
        const url = new URL(window.location.href);
        return (
          url.origin === origin &&
          url.pathname === "/login" &&
          url.searchParams.get("error") === "auth_callback"
        );
      },
      {},
      baseOrigin,
    );
    const callbackFailures = callbackResponses
      .slice(responseCount)
      .filter(({ status }) => status >= 500);
    if (callbackFailures.length > 0) {
      throw new Error(`The auth callback returned a server error: ${JSON.stringify(callbackFailures)}`);
    }
    const errorMessage = await page.$eval('[role="alert"]', (element) =>
      element.textContent?.trim(),
    );
    if (!errorMessage) {
      throw new Error("The auth callback did not render a safe login error");
    }
  }

  await assertSafeAuthCallback("/auth/callback");
  await assertSafeAuthCallback("/auth/callback?next=https%3A%2F%2Fevil.example");

  await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("h1");

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
  await page.waitForFunction(
    () =>
      [...document.querySelectorAll("#catalog-modal-panel button")].some(
        (button) => button.textContent?.includes("Seleccionar"),
      ),
    { timeout: 15_000 },
  );
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
    loginFlow,
    anonymousBuildsRedirected: true,
    safeAuthCallbacks: 2,
    externalFailures,
  }, null, 2));
} finally {
  await browser.close();
}

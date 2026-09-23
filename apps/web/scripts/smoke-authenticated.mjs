import puppeteer from "puppeteer";

const magicLink = process.env.NEXBUILD_E2E_MAGIC_LINK;

if (!magicLink) {
  console.error(
    "NEXBUILD_E2E_MAGIC_LINK is required to run the authenticated smoke test.",
  );
  process.exitCode = 1;
} else {
  const testBuildName = `NexBuild E2E ${Date.now()}`;
  const browser = await puppeteer.launch({ headless: true });
  const createdBuilds = [];
  const browserErrors = [];
  const failedResponses = [];
  let page;
  let appOrigin = null;
  let authenticated = false;
  let cleanupCompleted = false;
  let cleanupError = null;
  let failureStep = "magic-link";

  const redact = (value) => String(value)
    .replaceAll(magicLink, "[redacted]")
    .replace(/\bBearer\s+[^\s]+/gi, "Bearer [redacted]")
    .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, "[redacted-jwt]")
    .replace(
      /([?&](?:access_token|refresh_token|token|token_hash|code|apikey|api_key|key)=)[^&#\s]+/gi,
      "$1[redacted]",
    );

  const isSameOrigin = (url) => {
    if (!appOrigin) return false;
    try {
      return new URL(url).origin === appOrigin;
    } catch {
      return false;
    }
  };

  const buildCardsByName = async (name) => {
    const cards = await page.$$("article");
    const matchingCards = [];
    for (const card of cards) {
      const cardName = await card.$eval("h2", (heading) => heading.textContent?.trim())
        .catch(() => null);
      if (cardName === name) matchingCards.push(card);
    }
    return matchingCards;
  };

  const countBuildsByName = async (name) => (await buildCardsByName(name)).length;

  const clickBuildAction = async (card, actionLabel, name) => {
    await card.evaluate(
      (element, expectedLabel) => {
        const button = [...element.querySelectorAll("button")].find(
          (candidate) => candidate.getAttribute("aria-label") === expectedLabel,
        );
        if (!(button instanceof HTMLElement)) {
          throw new Error(`Missing build action: ${expectedLabel}`);
        }
        button.click();
      },
      `${actionLabel} ${name}`,
    );
  };

  const deleteOneTestBuild = async (expectedRemaining) => {
    const cards = await buildCardsByName(testBuildName);
    if (cards.length <= expectedRemaining) return;

    await clickBuildAction(cards[cards.length - 1], "Eliminar", testBuildName);
    await page.waitForSelector('dialog[role="alertdialog"][open]');
    await page.evaluate(() => {
      const dialog = document.querySelector('dialog[role="alertdialog"][open]');
      const confirmButton = [...(dialog?.querySelectorAll("button") ?? [])].find(
        (button) => button.textContent?.toLowerCase().includes("eliminar"),
      );
      if (!(confirmButton instanceof HTMLElement)) {
        throw new Error("The build delete confirmation is missing");
      }
      confirmButton.click();
    });
    await page.waitForFunction(
      (name, remaining) =>
        [...document.querySelectorAll("article")].filter(
          (card) => card.querySelector("h2")?.textContent?.trim() === name,
        ).length === remaining,
      {},
      testBuildName,
      expectedRemaining,
    );
  };

  const cleanupTestBuilds = async () => {
    if (!authenticated || !appOrigin) return;

    await page.goto(`${appOrigin}/builds`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("h1");
    while (await countBuildsByName(testBuildName)) {
      await deleteOneTestBuild((await countBuildsByName(testBuildName)) - 1);
    }
  };

  const assertNoBlockingBrowserFailures = () => {
    const sameOriginFailures = failedResponses.filter(({ url }) => isSameOrigin(url));
    const actionableBrowserErrors = browserErrors.filter(
      ({ url }) => !url || isSameOrigin(url),
    );
    if (sameOriginFailures.length > 0 || actionableBrowserErrors.length > 0) {
      throw new Error("The authenticated smoke encountered same-origin browser failures.");
    }
  };

  try {
    page = await browser.newPage();
    page.setDefaultTimeout(15_000);
    await page.setViewport({ width: 1280, height: 900 });
    page.on("console", (message) => {
      if (message.type() === "error") {
        browserErrors.push({ message: redact(message.text()), url: message.location().url });
      }
    });
    page.on("pageerror", (error) => {
      browserErrors.push({ message: redact(error.message), url: page.url() });
    });
    page.on("response", (response) => {
      if (response.status() >= 400) {
        failedResponses.push({ status: response.status(), url: response.url() });
      }
    });

    failureStep = "magic-link";
    await page.goto(magicLink, { waitUntil: "domcontentloaded" });
    failureStep = "session-check";
    await page.waitForFunction(() =>
      [...document.querySelectorAll("button")].some(
        (button) => button.textContent?.trim() === "Cerrar sesión",
      ),
    );
    appOrigin = new URL(page.url()).origin;
    authenticated = true;

    failureStep = "builder";
    await page.evaluate(() => localStorage.removeItem("nexbuild-active-build"));
    await page.goto(`${appOrigin}/builder`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("#pc-builder");
    await page.waitForFunction(() =>
      [...document.querySelectorAll("button")].some((button) =>
        button.textContent?.includes("Elegir Procesador"),
      ),
    );
    failureStep = "cpu-selection";
    await page.evaluate(() => {
      const selector = [...document.querySelectorAll("button")].find((button) =>
        button.textContent?.includes("Elegir Procesador"),
      );
      if (!(selector instanceof HTMLElement)) {
        throw new Error("The CPU selector is missing");
      }
      selector.click();
    });
    await page.waitForSelector("#catalog-modal-panel");
    await page.waitForFunction(
      () =>
        [...document.querySelectorAll("#catalog-modal-panel button")].some(
          (button) => button.textContent?.includes("Seleccionar"),
        ),
      { timeout: 15_000 },
    );
    const selectedComponentName = await page.evaluate(() => {
      const button = [...document.querySelectorAll("#catalog-modal-panel button")].find(
        (candidate) => candidate.textContent?.includes("Seleccionar"),
      );
      if (!(button instanceof HTMLElement)) {
        throw new Error("The catalog modal has no selectable CPUs");
      }
      const card = button.closest("div.group");
      const name = card?.querySelector("p.mt-1")?.textContent?.trim();
      button.click();
      return name;
    });
    if (!selectedComponentName) {
      throw new Error("The selected CPU has no visible name");
    }
    await page.waitForSelector("#catalog-modal-panel", { hidden: true });
    await page.waitForFunction(
      (componentName) => document.body.textContent?.includes(componentName),
      {},
      selectedComponentName,
    );

    failureStep = "cloud-save";
    await page.waitForFunction(() =>
      [...document.querySelectorAll("#build-summary-panel button")].some((button) =>
        button.textContent?.includes("Guardar avance en la nube"),
      ),
    );
    await page.evaluate(() => {
      const saveButton = [...document.querySelectorAll("#build-summary-panel button")].find(
        (button) => button.textContent?.includes("Guardar avance en la nube"),
      );
      if (!(saveButton instanceof HTMLElement)) {
        throw new Error("The cloud save action is missing");
      }
      saveButton.click();
    });
    await page.waitForFunction(() =>
      [...document.querySelectorAll("#build-summary-panel a")].some(
        (link) => new URL(link.href).pathname.startsWith("/build/"),
      ),
    );
    const originalId = await page.$$eval("#build-summary-panel a", (links) =>
      links
        .map((link) => new URL(link.href).pathname)
        .find((pathname) => pathname.startsWith("/build/"))
        ?.split("/")
        .at(-1) ?? null,
    );
    if (!originalId) throw new Error("The cloud save did not return a build ID");
    createdBuilds.push({ id: originalId, name: null });

    failureStep = "builds-list";
    await page.goto(`${appOrigin}/builds`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("article h2");
    const newestBuild = (await page.$$("article"))[0];
    if (!newestBuild) throw new Error("The saved build is not listed");
    const newestBuildHasSelectedComponent = await newestBuild.evaluate(
      (element, componentName) => element.textContent?.includes(componentName),
      selectedComponentName,
    );
    if (!newestBuildHasSelectedComponent) {
      throw new Error("The newest build does not match the build created by this test");
    }
    failureStep = "rename";
    await newestBuild.evaluate((element) => {
      const renameButton = [...element.querySelectorAll("button")].find((button) =>
        button.getAttribute("aria-label")?.startsWith("Renombrar "),
      );
      if (!(renameButton instanceof HTMLElement)) {
        throw new Error("The build rename action is missing");
      }
      renameButton.click();
    });
    const renameInput = await newestBuild.waitForSelector('input[name="name"]');
    await renameInput.click({ clickCount: 3 });
    await renameInput.type(testBuildName);
    await renameInput.press("Enter");
    await page.waitForFunction(
      (name) =>
        [...document.querySelectorAll("article")].some(
          (card) => card.querySelector("h2")?.textContent?.trim() === name,
        ),
      {},
      testBuildName,
    );
    createdBuilds[0].name = testBuildName;

    failureStep = "duplicate";
    const originalCard = (await buildCardsByName(testBuildName))[0];
    if (!originalCard) throw new Error("The renamed build is not listed");
    await clickBuildAction(originalCard, "Duplicar", testBuildName);
    await page.waitForFunction(
      (name) =>
        [...document.querySelectorAll("article")].filter(
          (card) => card.querySelector("h2")?.textContent?.trim() === name,
        ).length >= 2,
      {},
      testBuildName,
    );

    failureStep = "load";
    const cardsAfterDuplicate = await buildCardsByName(testBuildName);
    await cardsAfterDuplicate[0].evaluate((element, name) => {
      const loadButton = [...element.querySelectorAll("button")].find(
        (button) => button.getAttribute("aria-label") === `Abrir ${name} en el configurador`,
      );
      if (!(loadButton instanceof HTMLElement)) {
        throw new Error("The build load action is missing");
      }
      loadButton.click();
    }, testBuildName);
    await page.waitForFunction(
      (componentName) =>
        window.location.pathname === "/builder" &&
        document.body.textContent?.includes(componentName),
      {},
      selectedComponentName,
    );

    failureStep = "delete";
    await page.goto(`${appOrigin}/builds`, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(
      (name) =>
        [...document.querySelectorAll("article")].filter(
          (card) => card.querySelector("h2")?.textContent?.trim() === name,
        ).length >= 2,
      {},
      testBuildName,
    );
    await deleteOneTestBuild(1);
    await deleteOneTestBuild(0);
    createdBuilds.length = 0;

    failureStep = "logout";
    await page.evaluate(() => {
      const logoutButton = [...document.querySelectorAll("button")].find(
        (button) => button.textContent?.trim() === "Cerrar sesión",
      );
      if (!(logoutButton instanceof HTMLElement)) {
        throw new Error("The logout action is missing");
      }
      logoutButton.click();
    });
    await page.waitForFunction(() => window.location.pathname === "/login");
    authenticated = false;

    await page.goto(`${appOrigin}/builds`, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() =>
      window.location.pathname === "/login" &&
      new URLSearchParams(window.location.search).get("next") === "/builds",
    );
    assertNoBlockingBrowserFailures();

    const externalFailures = failedResponses
      .filter(({ url }) => !isSameOrigin(url))
      .map(({ status, url }) => ({ status, url: redact(url) }));
    console.log(JSON.stringify({
      authenticated: true,
      selectedComponentName,
      cloudSave: true,
      renamed: testBuildName,
      duplicated: true,
      loadedInBuilder: true,
      cleanup: "completed",
      logoutRedirected: true,
      externalFailures,
    }, null, 2));
  } catch (error) {
    const errorMessage = redact(
      error instanceof Error ? error.message : "Unknown authenticated smoke error",
    );
    try {
      await cleanupTestBuilds();
      cleanupCompleted = true;
    } catch (error) {
      cleanupError = redact(error instanceof Error ? error.message : "Unknown cleanup error");
    }
    console.error(JSON.stringify({
      authenticatedSmoke: "failed",
      failureStep,
      errorMessage,
      testBuildName,
      createdBuilds,
      cleanupCompleted,
      cleanupError,
    }, null, 2));
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

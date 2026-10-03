import { track, type BeforeSendEvent } from "@vercel/analytics";
import type { ComponentCategory } from "@/lib/categories";

type ProductEventProperties = {
  home_cta_clicked: {
    destination: "builder" | "catalog";
    placement: "hero" | "final";
  };
  builder_used: Record<string, never>;
  guided_builder_started: Record<string, never>;
  guided_builder_completed: Record<string, never>;
  component_added: {
    category: ComponentCategory;
    source: "builder" | "catalog" | "detail";
  };
  comparison_added: {
    category: ComponentCategory;
    source: "catalog" | "detail" | "home";
  };
  build_saved: Record<string, never>;
  build_shared: {
    method: "configuration_copy" | "link_copy";
  };
};

const PRIVATE_PATHS = ["/auth", "/builds", "/login"] as const;

export function sanitizeAnalyticsEvent(
  event: BeforeSendEvent,
): BeforeSendEvent | null {
  try {
    const url = new URL(event.url, "https://nexbuild.games");
    const isPrivatePath =
      PRIVATE_PATHS.some(
        (path) => url.pathname === path || url.pathname.startsWith(`${path}/`),
      ) || url.pathname.startsWith("/build/");

    if (isPrivatePath) return null;

    url.search = "";
    url.hash = "";

    if (/^\/components\/[^/]+\/?$/.test(url.pathname)) {
      url.pathname = "/components/[component]";
    }

    return { ...event, url: url.toString() };
  } catch {
    return null;
  }
}

export function shouldSendProductAnalytics(
  nodeEnv: string | undefined,
  hostname: string | undefined,
): boolean {
  return nodeEnv === "production" && hostname === "nexbuild.games";
}

function isProductAnalyticsEnabled(): boolean {
  return (
    typeof window !== "undefined" &&
    shouldSendProductAnalytics(process.env.NODE_ENV, window.location.hostname)
  );
}

export function trackProductEvent<Name extends keyof ProductEventProperties>(
  name: Name,
  properties: ProductEventProperties[Name],
): void {
  if (!isProductAnalyticsEnabled()) return;

  try {
    track(name, properties);
  } catch {
    // Analytics must never interrupt the product action being measured.
  }
}

export function trackProductEventOnce<
  Name extends keyof ProductEventProperties,
>(
  name: Name,
  properties: ProductEventProperties[Name],
): void {
  if (!isProductAnalyticsEnabled()) return;

  const storageKey = `nexbuild-analytics:${name}`;
  try {
    if (window.sessionStorage.getItem(storageKey)) return;
    track(name, properties);
    window.sessionStorage.setItem(storageKey, "1");
  } catch {
    // Storage or analytics failures must not affect the product flow.
  }
}

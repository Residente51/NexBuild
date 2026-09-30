import { describe, expect, it } from "vitest";
import {
  sanitizeAnalyticsEvent,
  shouldSendProductAnalytics,
} from "./analytics";

describe("analytics privacy boundary", () => {
  it("removes query strings and normalizes component detail URLs", () => {
    expect(
      sanitizeAnalyticsEvent({
        type: "pageview",
        url: "https://nexbuild.games/components/ryzen-7?ref=home#offers",
      }),
    ).toEqual({
      type: "pageview",
      url: "https://nexbuild.games/components/[component]",
    });
  });

  it.each([
    "https://nexbuild.games/auth/callback?code=secret",
    "https://nexbuild.games/login?next=/builds",
    "https://nexbuild.games/builds",
    "https://nexbuild.games/build/private-build-id",
  ])("drops private or identifier-bearing routes: %s", (url) => {
    expect(sanitizeAnalyticsEvent({ type: "pageview", url })).toBeNull();
  });

  it("enables product events only on the production domain", () => {
    expect(shouldSendProductAnalytics("production", "nexbuild.games")).toBe(
      true,
    );
    expect(shouldSendProductAnalytics("development", "nexbuild.games")).toBe(
      false,
    );
    expect(shouldSendProductAnalytics("production", "localhost")).toBe(false);
    expect(
      shouldSendProductAnalytics("production", "preview.vercel.app"),
    ).toBe(false);
  });
});

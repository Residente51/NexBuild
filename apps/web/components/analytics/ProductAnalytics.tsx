"use client";

import { useSyncExternalStore } from "react";
import { Analytics } from "@vercel/analytics/next";
import {
  sanitizeAnalyticsEvent,
  shouldSendProductAnalytics,
} from "@/lib/analytics";

export function ProductAnalytics() {
  const enabled = useSyncExternalStore(
    () => () => undefined,
    () =>
      shouldSendProductAnalytics(
        process.env.NODE_ENV,
        window.location.hostname,
      ),
    () => false,
  );

  if (!enabled) return null;

  return (
    <Analytics
      mode="production"
      debug={false}
      beforeSend={sanitizeAnalyticsEvent}
    />
  );
}

"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSafeRedirectPath } from "@/lib/auth/redirect";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function isPlausibleEmail(value: string) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function getRequestOrigin() {
  const requestHeaders = await headers();
  const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const candidate = configuredOrigin || requestHeaders.get("origin");

  if (!candidate) {
    throw new Error("Unable to determine the application origin");
  }

  const url = new URL(candidate);
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("Invalid application origin");
  }

  return url.origin;
}

export async function requestMagicLink(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const destination = getSafeRedirectPath(
    String(formData.get("next") ?? "/"),
  );

  if (!isPlausibleEmail(email)) {
    redirect("/login?error=invalid_email");
  }

  const callbackUrl = new URL("/auth/callback", await getRequestOrigin());
  if (destination !== "/") {
    callbackUrl.searchParams.set("next", destination);
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: callbackUrl.toString(),
      shouldCreateUser: true,
    },
  });

  if (error) {
    redirect("/login?error=send_failed");
  }

  redirect("/login?sent=1");
}

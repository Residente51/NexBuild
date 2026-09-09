import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseBrowserEnvironment } from "@/lib/supabase/config";

type PendingCookie = {
  name: string;
  value: string;
  options: CookieOptions;
};

type ProxyAuthClient = {
  auth: {
    getClaims: () => Promise<unknown>;
  };
};

type ProxyClientFactory = (cookies: {
  getAll: () => { name: string; value: string }[];
  setAll: (
    cookies: PendingCookie[],
    headers: Record<string, string>,
  ) => void;
}) => ProxyAuthClient;

function createProxySupabaseClient(
  cookieMethods: Parameters<ProxyClientFactory>[0],
) {
  const { url, anonKey } = getSupabaseBrowserEnvironment();
  return createServerClient(url, anonKey, { cookies: cookieMethods });
}

/**
 * Generates a request-scoped CSP nonce. Next.js reads the CSP from the
 * forwarded request headers and applies the nonce to its framework scripts.
 */
export async function buildProxyResponse(
  request: NextRequest,
  createClient: ProxyClientFactory = createProxySupabaseClient,
) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const developmentDirectives =
    process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : "";
  const upgradeInsecureRequests =
    process.env.NODE_ENV === "development" ? "" : " upgrade-insecure-requests;";

  const contentSecurityPolicy = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${developmentDirectives};
    style-src 'self' 'nonce-${nonce}';
    style-src-attr 'unsafe-inline';
    img-src 'self' data: https: blob:;
    font-src 'self';
    connect-src 'self' https://*.supabase.co;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';${upgradeInsecureRequests}
  `
    .replace(/\s{2,}/g, " ")
    .trim();

  const pendingCookies: PendingCookie[] = [];
  const authHeaders = new Headers();
  const supabase = createClient({
    getAll: () => request.cookies.getAll(),
    setAll(cookiesToSet, headersToSet) {
      pendingCookies.push(...cookiesToSet);
      cookiesToSet.forEach(({ name, value }) => {
        request.cookies.set(name, value);
      });
      Object.entries(headersToSet).forEach(([name, value]) => {
        authHeaders.set(name, value);
      });
    },
  });

  await supabase.auth.getClaims();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", contentSecurityPolicy);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  authHeaders.forEach((value, name) => response.headers.set(name, value));
  pendingCookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });
  response.headers.set("Content-Security-Policy", contentSecurityPolicy);

  return response;
}

export async function proxy(request: NextRequest) {
  return buildProxyResponse(request);
}

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};

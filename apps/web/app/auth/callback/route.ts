import { type NextRequest, NextResponse } from "next/server";
import { getSafeRedirectPath } from "@/lib/auth/redirect";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type AuthCodeClient = {
  auth: {
    exchangeCodeForSession: (
      code: string,
    ) => Promise<{ error: unknown | null }>;
  };
};
type AuthClientFactory = () => Promise<AuthCodeClient>;

function disablePublicCaching(response: NextResponse) {
  response.headers.set(
    "Cache-Control",
    "private, no-cache, no-store, must-revalidate, max-age=0",
  );
  response.headers.set("Expires", "0");
  response.headers.set("Pragma", "no-cache");
  return response;
}

export async function handleAuthCallback(
  request: NextRequest,
  createClient: AuthClientFactory = createServerSupabaseClient,
) {
  const code = request.nextUrl.searchParams.get("code");
  const destination = getSafeRedirectPath(
    request.nextUrl.searchParams.get("next"),
  );

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return disablePublicCaching(
        NextResponse.redirect(new URL(destination, request.url)),
      );
    }
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("error", "auth_callback");
  return disablePublicCaching(NextResponse.redirect(loginUrl));
}

export async function GET(request: NextRequest) {
  return handleAuthCallback(request);
}

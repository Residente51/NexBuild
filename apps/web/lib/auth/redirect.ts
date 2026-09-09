const INTERNAL_ORIGIN = "https://nexbuild.internal";

/** Returns a normalized internal path, or the home page for unsafe targets. */
export function getSafeRedirectPath(target: string | null | undefined) {
  if (!target?.startsWith("/") || target.startsWith("//") || target.includes("\\")) {
    return "/";
  }

  try {
    const url = new URL(target, INTERNAL_ORIGIN);

    if (url.origin !== INTERNAL_ORIGIN) {
      return "/";
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/";
  }
}

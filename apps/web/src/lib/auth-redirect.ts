export function buildLoginRedirect(pathWithSearch: string | null | undefined) {
  const redirectTo = pathWithSearch?.trim();
  if (!redirectTo) {
    return "/login";
  }

  return `/login?${new URLSearchParams({ to: redirectTo })}`;
}

export function getSafeRedirectTo(
  redirectTo: string | null | undefined,
): string {
  if (!redirectTo) {
    return "/";
  }

  if (!redirectTo.startsWith("/") || redirectTo.startsWith("//")) {
    return "/";
  }

  return redirectTo;
}

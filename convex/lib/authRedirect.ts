/** Keep OAuth completion on the origin that holds the browser's verifier. */
export function authRedirect(
  redirectTo: string,
  siteUrl: string,
  extraOrigins = "",
) {
  const base = new URL(siteUrl);
  const allowed = new Set([
    base.origin,
    ...extraOrigins
      .split(",")
      .filter(Boolean)
      .map((value) => new URL(value.trim()).origin),
  ]);
  const target = new URL(redirectTo, base);
  if (
    !allowed.has(target.origin) ||
    target.username ||
    target.password ||
    target.pathname !== "/auth/callback" ||
    target.search ||
    target.hash
  ) {
    throw new Error("Invalid authentication return URL");
  }
  return target.href;
}

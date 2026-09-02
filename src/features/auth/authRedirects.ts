export type AuthReturnMode = "reset";

/**
 * Authentication returns to the browser origin that initiated the flow. The
 * server still validates that origin against its exact production allowlist.
 */
export const buildAuthReturnUrl = (origin: string, mode?: AuthReturnMode): string => {
  const url = new URL("/", origin);
  if (mode) url.searchParams.set("auth_mode", mode);
  return url.toString();
};

export const getAuthReturnUrl = (mode?: AuthReturnMode): string =>
  buildAuthReturnUrl(window.location.origin, mode);

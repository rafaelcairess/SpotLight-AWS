const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

const parseHttpOrigin = (value: string): string | null => {
  try {
    const url = new URL(value.trim());
    const isLocalHttp = url.protocol === "http:" && LOOPBACK_HOSTS.has(url.hostname);
    if (url.protocol !== "https:" && !isLocalHttp) return null;
    if (url.username || url.password || url.search || url.hash || url.pathname !== "/") return null;
    if (url.protocol === "https:" && url.port) return null;
    return url.origin;
  } catch {
    return null;
  }
};

export const resolvePrimarySiteOrigin = (siteUrl?: string | null, publicSiteUrl?: string | null) =>
  parseHttpOrigin(siteUrl || "") || parseHttpOrigin(publicSiteUrl || "") || "";

export const parseAllowedSiteOrigins = (
  configuredOrigins: string | null | undefined,
  primaryOrigin: string,
): string[] => {
  const origins = [primaryOrigin, ...(configuredOrigins || "").split(",")]
    .map(parseHttpOrigin)
    .filter((origin): origin is string => Boolean(origin));

  return [...new Set(origins)];
};

export const resolveAllowedOrigin = (
  requestOrigin: string | null,
  allowedOrigins: readonly string[],
): string | null => {
  if (!requestOrigin) return allowedOrigins[0] || null;
  const normalizedOrigin = parseHttpOrigin(requestOrigin);
  const isCanonicalOrigin = normalizedOrigin === requestOrigin.trim();
  return normalizedOrigin && isCanonicalOrigin && allowedOrigins.includes(normalizedOrigin)
    ? normalizedOrigin
    : null;
};

export const buildCorsHeaders = (
  requestOrigin: string | null,
  configuredOrigins: string | null | undefined,
  primaryOrigin: string,
): Record<string, string> => {
  const allowedOrigins = parseAllowedSiteOrigins(configuredOrigins, primaryOrigin);
  const allowedOrigin = resolveAllowedOrigin(requestOrigin, allowedOrigins);
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };

  if (allowedOrigin) headers["Access-Control-Allow-Origin"] = allowedOrigin;
  return headers;
};

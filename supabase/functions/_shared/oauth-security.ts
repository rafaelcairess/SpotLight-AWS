import { parseAllowedSiteOrigins } from "./origin-security.ts";

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

export const oauthSecurityHeaders = {
  "Cache-Control": "no-store",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
};

export const oauthNonceCookies = {
  steam: "__Host-spotlight_steam_nonce",
  xbox: "__Host-spotlight_xbox_nonce",
  psn: "__Host-spotlight_psn_nonce",
} as const;

const parseHttpUrl = (value: string): URL | null => {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url.username || url.password ? null : url;
  } catch {
    return null;
  }
};

export const buildPublicFunctionUrl = (supabaseUrl: string, functionName: string): URL => {
  const publicUrl = parseHttpUrl(supabaseUrl);
  if (
    !publicUrl ||
    publicUrl.protocol !== "https:" ||
    publicUrl.username ||
    publicUrl.password ||
    publicUrl.port ||
    publicUrl.search ||
    publicUrl.hash ||
    publicUrl.pathname !== "/" ||
    !/^[a-z0-9-]+$/.test(functionName)
  ) {
    throw new Error("invalid_supabase_url");
  }

  return new URL(`/functions/v1/${functionName}`, publicUrl.origin);
};

export const parseSteamClaimedId = (claimedId: string): string | null => {
  const match = claimedId.match(/^https?:\/\/steamcommunity\.com\/openid\/id\/(\d{17})$/);
  return match?.[1] || null;
};

export const buildSteamCallbackUrl = (
  supabaseUrl: string,
  redirect: string,
  nonce: string,
): URL => {
  const callbackUrl = buildPublicFunctionUrl(supabaseUrl, "steam-auth-callback");
  callbackUrl.searchParams.set("redirect", redirect);
  callbackUrl.searchParams.set("nonce", nonce);
  return callbackUrl;
};

export const isExpectedSteamReturnTo = (
  assertedReturnTo: string,
  supabaseUrl: string,
  redirect: string,
  nonce: string,
): boolean => {
  const assertedUrl = parseHttpUrl(assertedReturnTo);
  if (!assertedUrl) return false;

  return assertedUrl.toString() === buildSteamCallbackUrl(supabaseUrl, redirect, nonce).toString();
};

/**
 * OAuth may return only to one of the configured site origins. Localhost is
 * disabled in deployed functions unless ALLOW_LOCAL_REDIRECTS=true is passed.
 */
export const buildSafeRedirect = (
  value: string | null,
  fallback: string,
  configuredOrigins = "",
  localRedirectsEnabled = false,
): string => {
  const fallbackUrl = parseHttpUrl(fallback);
  if (!fallbackUrl) throw new Error("invalid_site_url");

  const target = value ? parseHttpUrl(value) : null;
  if (!target) return fallbackUrl.toString();
  const allowedOrigins = parseAllowedSiteOrigins(configuredOrigins, fallbackUrl.origin);
  if (allowedOrigins.includes(target.origin)) return target.toString();

  if (localRedirectsEnabled && target.protocol === "http:" && LOOPBACK_HOSTS.has(target.hostname)) {
    return target.toString();
  }

  return fallbackUrl.toString();
};

export const setNonceCookie = (name: string, nonce: string) =>
  `${name}=${nonce}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`;

export const clearNonceCookie = (name: string) =>
  `${name}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;

export const getCookie = (cookieHeader: string | null, name: string): string | null => {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0) continue;
    const key = part.slice(0, separator).trim();
    if (key === name) return part.slice(separator + 1).trim() || null;
  }
  return null;
};

export const decodeOAuthState = (
  state: string,
): { nonce: string; redirect: string | null } | null => {
  if (state.length > 4096) return null;
  const separator = state.indexOf(":");
  if (separator < 1) return null;

  const nonce = state.slice(0, separator);
  const encodedRedirect = state.slice(separator + 1);
  try {
    return {
      nonce,
      redirect: encodedRedirect ? decodeURIComponent(encodedRedirect) : null,
    };
  } catch {
    return null;
  }
};

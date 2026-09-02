import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import {
  buildSafeRedirect,
  buildSteamCallbackUrl,
  oauthNonceCookies,
  oauthSecurityHeaders,
  setNonceCookie,
} from "../_shared/oauth-security.ts";
import { resolvePrimarySiteOrigin } from "../_shared/origin-security.ts";

serve((req) => {
  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...oauthSecurityHeaders },
    });
  }

  const url = new URL(req.url);
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const fallbackSite = resolvePrimarySiteOrigin(
    Deno.env.get("SITE_URL"),
    Deno.env.get("PUBLIC_SITE_URL"),
  );

  if (!supabaseUrl || !fallbackSite) {
    return new Response(JSON.stringify({ error: "server_not_configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...oauthSecurityHeaders },
    });
  }

  const requestedRedirect = url.searchParams.get("redirect");
  const safeRedirect = buildSafeRedirect(
    requestedRedirect,
    fallbackSite,
    Deno.env.get("ALLOWED_SITE_ORIGINS") || "",
    Deno.env.get("ALLOW_LOCAL_REDIRECTS") === "true",
  );

  // Gera nonce aleatório para proteção CSRF
  const nonce = crypto.randomUUID();

  let callbackUrl: URL;
  try {
    callbackUrl = buildSteamCallbackUrl(supabaseUrl, safeRedirect, nonce);
  } catch {
    return new Response(JSON.stringify({ error: "server_not_configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...oauthSecurityHeaders },
    });
  }

  const params = new URLSearchParams({
    "openid.ns": "http://specs.openid.net/auth/2.0",
    "openid.mode": "checkid_setup",
    "openid.return_to": callbackUrl.toString(),
    "openid.realm": `${callbackUrl.origin}/`,
    "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
    "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
  });

  const steamLoginUrl = `https://steamcommunity.com/openid/login?${params.toString()}`;

  return new Response(null, {
    status: 302,
    headers: {
      Location: steamLoginUrl,
      "Set-Cookie": setNonceCookie(oauthNonceCookies.steam, nonce),
      ...oauthSecurityHeaders,
    },
  });
});

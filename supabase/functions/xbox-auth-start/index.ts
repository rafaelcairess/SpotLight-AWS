import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import {
  buildPublicFunctionUrl,
  buildSafeRedirect,
  oauthNonceCookies,
  oauthSecurityHeaders,
  setNonceCookie,
} from "../_shared/oauth-security.ts";
import { resolvePrimarySiteOrigin } from "../_shared/origin-security.ts";

/**
 * xbox-auth-start
 *
 * Inicia o fluxo OAuth 2.0 da Microsoft Identity Platform para login Xbox.
 * O usuário é redirecionado para a tela de login da Microsoft com os escopos
 * necessários para acessar a Xbox Live API.
 *
 * Variáveis de ambiente necessárias:
 *   XBOX_CLIENT_ID   — Application (client) ID do app registrado no Azure
 *   SITE_URL         — URL base do frontend (ex: https://spotlight.app)
 */

serve((req) => {
  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...oauthSecurityHeaders },
    });
  }

  const XBOX_CLIENT_ID = Deno.env.get("XBOX_CLIENT_ID") || "";
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
  if (!XBOX_CLIENT_ID) {
    return new Response(JSON.stringify({ error: "xbox_not_configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...oauthSecurityHeaders },
    });
  }
  if (!SUPABASE_URL) {
    return new Response(JSON.stringify({ error: "server_not_configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...oauthSecurityHeaders },
    });
  }

  const url = new URL(req.url);
  const fallbackSite = resolvePrimarySiteOrigin(
    Deno.env.get("SITE_URL"),
    Deno.env.get("PUBLIC_SITE_URL"),
  );
  if (!fallbackSite) {
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

  // Nonce CSRF
  const nonce = crypto.randomUUID();

  let callbackUrl: string;
  try {
    callbackUrl = buildPublicFunctionUrl(SUPABASE_URL, "xbox-auth-callback").toString();
  } catch {
    return new Response(JSON.stringify({ error: "server_not_configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...oauthSecurityHeaders },
    });
  }

  const params = new URLSearchParams({
    client_id: XBOX_CLIENT_ID,
    response_type: "code",
    redirect_uri: callbackUrl,
    scope: "XboxLive.signin XboxLive.offline_access",
    response_mode: "query",
    state: `${nonce}:${encodeURIComponent(safeRedirect)}`,
  });

  const microsoftLoginUrl = `https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize?${params}`;
  return new Response(null, {
    status: 302,
    headers: {
      Location: microsoftLoginUrl,
      "Set-Cookie": setNonceCookie(oauthNonceCookies.xbox, nonce),
      ...oauthSecurityHeaders,
    },
  });
});

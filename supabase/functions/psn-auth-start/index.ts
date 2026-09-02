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
 * psn-auth-start
 *
 * Inicia o fluxo OAuth 2.0 da Sony/PlayStation Network.
 * O usuário é redirecionado para a tela de login da PSN.
 *
 * Pré-requisito: registrar um app na Sony Developer Network e obter
 * um Client ID com permissão para a Trophy API (psn:trophy).
 *
 * Variáveis de ambiente necessárias:
 *   PSN_CLIENT_ID  — Client ID do app registrado na Sony
 *   SITE_URL       — URL base do frontend
 */

serve((req) => {
  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...oauthSecurityHeaders },
    });
  }

  const PSN_CLIENT_ID = Deno.env.get("PSN_CLIENT_ID") || "";
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
  if (!PSN_CLIENT_ID) {
    return new Response(JSON.stringify({ error: "psn_not_configured" }), {
      status: 503,
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
    callbackUrl = buildPublicFunctionUrl(SUPABASE_URL, "psn-auth-callback").toString();
  } catch {
    return new Response(JSON.stringify({ error: "server_not_configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...oauthSecurityHeaders },
    });
  }

  const params = new URLSearchParams({
    client_id: PSN_CLIENT_ID,
    redirect_uri: callbackUrl,
    response_type: "code",
    scope: "psn:mobile.v2.core psn:trophy",
    state: `${nonce}:${encodeURIComponent(safeRedirect)}`,
  });

  const psnLoginUrl = `https://ca.account.sony.com/api/authz/v3/oauth/authorize?${params}`;
  return new Response(null, {
    status: 302,
    headers: {
      Location: psnLoginUrl,
      "Set-Cookie": setNonceCookie(oauthNonceCookies.psn, nonce),
      ...oauthSecurityHeaders,
    },
  });
});

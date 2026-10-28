import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { buildFriendRequestDeletionFilter } from "../../supabase/functions/_shared/account-deletion";
import {
  isSteamId64,
  minutesToHours,
  parseSteamInput,
} from "../../supabase/functions/_shared/steam-sync";
import {
  buildPublicFunctionUrl,
  buildSafeRedirect,
  buildSteamCallbackUrl,
  isExpectedSteamReturnTo,
  parseSteamClaimedId,
} from "../../supabase/functions/_shared/oauth-security";
import {
  buildCorsHeaders,
  parseAllowedSiteOrigins,
  resolveAllowedOrigin,
  resolvePrimarySiteOrigin,
} from "../../supabase/functions/_shared/origin-security";
import { buildAuthReturnUrl } from "../features/auth/authRedirects";

const workspaceFile = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("account deletion contract", () => {
  it("deletes friendship rows in both directions using the real column names", () => {
    expect(buildFriendRequestDeletionFilter("user-id")).toBe(
      "requester_id.eq.user-id,addressee_id.eq.user-id",
    );
  });

  it("does not reintroduce the old requestee_id typo", () => {
    const source = workspaceFile("supabase/functions/delete-account/index.ts");
    expect(source).toContain("buildFriendRequestDeletionFilter");
    expect(source).not.toContain("requestee_id");
  });
});

describe("Steam synchronization helpers", () => {
  it("recognizes SteamID64 and common community profile URLs", () => {
    expect(isSteamId64("76561198000000000")).toBe(true);
    expect(parseSteamInput("https://steamcommunity.com/profiles/76561198000000000/")).toEqual({
      type: "steamid",
      value: "76561198000000000",
    });
    expect(parseSteamInput("https://steamcommunity.com/id/rafae/")).toEqual({
      type: "vanity",
      value: "rafae",
    });
  });

  it("rejects lookalike domains and treats them only as a vanity input", () => {
    expect(parseSteamInput("https://evilsteamcommunity.com/id/rafae")).toEqual({
      type: "vanity",
      value: "https://evilsteamcommunity.com/id/rafae",
    });
  });

  it("converts Steam minutes to stable decimal hours", () => {
    expect(minutesToHours(90)).toBe(1.5);
    expect(minutesToHours(1)).toBe(0.02);
    expect(minutesToHours(-10)).toBe(0);
  });

  it("never accepts a Steam identity from the sync request body", () => {
    const source = workspaceFile("supabase/functions/sync-steam-playtime/index.ts");
    expect(source).not.toContain("payload.steam_id");
    expect(source).toContain("profile?.steam_id");
    expect(source).toContain("steam_identity_requires_reconnect");
  });

  it("never includes a secret-bearing Steam URL in an upstream exception", () => {
    const files = [
      "supabase/functions/sync-steam-playtime/index.ts",
      "supabase/functions/fetch-steam-details/index.ts",
      "supabase/functions/steam-auth-callback/index.ts",
      "scripts/steam-sync-popular.mjs",
      "scripts/steam-sync-applist.ts",
    ];
    for (const file of files) {
      expect(workspaceFile(file)).not.toContain("for ${url}");
    }
  });
});

describe("RLS privacy contract", () => {
  const migration = workspaceFile("supabase/migrations/20260723000000_enforce_profile_privacy.sql");

  it("enforces profile, library and review visibility in SQL", () => {
    expect(migration).toContain('CREATE POLICY "Friends can view friend profiles"');
    expect(migration).toContain('CREATE POLICY "Visible libraries can be read"');
    expect(migration).toContain('CREATE POLICY "Visible reviews can be read"');
    expect(migration).toContain("public.is_friend(auth.uid(), profile.user_id)");
  });

  it("replaces the old globally-public reviews policy", () => {
    expect(migration).toContain('DROP POLICY IF EXISTS "Reviews visíveis por todos"');
  });

  it("keeps the restrictive private-game guard", () => {
    const privateGuard = workspaceFile(
      "supabase/migrations/20260722000000_profile_presence_privacy_progress.sql",
    );
    expect(privateGuard).toContain('CREATE POLICY "Private games are owner only"');
    expect(privateGuard).toContain("user_id = auth.uid() OR is_private = false");
  });

  it("hardens platform identities, social graph, rate limits and avatars", () => {
    const hardening = workspaceFile("supabase/migrations/20260728000000_security_hardening.sql");
    expect(hardening).toContain("REVOKE UPDATE (steam_id)");
    expect(hardening).toContain("profiles_steam_id_unique");
    expect(hardening).toContain('DROP POLICY IF EXISTS "Accepted friendships are visible"');
    expect(hardening).toContain("consume_function_rate_limit");
    expect(hardening).toContain("Avatar uploads require safe owner path");
  });

  it("closes anonymous follows and protects server-owned game and review fields", () => {
    const hardening = workspaceFile("supabase/migrations/20260728010000_pentest_hardening.sql");
    const legacyPolicyCleanup = workspaceFile(
      "supabase/migrations/20260728011000_close_legacy_follows_policy.sql",
    );
    expect(hardening).toContain('DROP POLICY IF EXISTS "Follows visíveis por todos"');
    expect(hardening).toContain("follower_id = auth.uid() OR following_id = auth.uid()");
    expect(legacyPolicyCleanup).toContain("FROM pg_policies");
    expect(legacyPolicyCleanup).toContain("auth.uid() IS NOT NULL");
    expect(hardening).toContain("REVOKE INSERT, UPDATE ON TABLE public.user_games");
    expect(hardening).not.toMatch(/GRANT UPDATE \([^)]*hours_played,/s);
    expect(hardening).toContain("RATE_LIMIT:60");
    expect(hardening).toContain("DAILY_LIMIT:20");
    expect(hardening).toContain("AVATAR_URL_NOT_ALLOWED");
  });

  it("bounds profile and custom-list writes at the database boundary", () => {
    const hardening = workspaceFile(
      "supabase/migrations/20260804000000_security_followup_hardening.sql",
    );
    expect(hardening).toContain("PROFILE_USERNAME_INVALID");
    expect(hardening).toContain("REVOKE INSERT, UPDATE ON TABLE public.user_lists");
    expect(hardening).toContain("LIST_LIMIT_REACHED");
    expect(hardening).toContain("LIST_GAME_LIMIT_REACHED");
    expect(hardening).toContain("consume_function_rate_limit");
  });
});

describe("OAuth boundary contract", () => {
  const officialSite = "https://spotlight.rafaelcpires.abrdns.com";
  const externalSite = "https://external.example";
  const supabaseUrl = "https://project-ref.supabase.co";

  it("builds browser auth returns from the runtime origin and lands recovery on the root", () => {
    expect(buildAuthReturnUrl(officialSite)).toBe(`${officialSite}/`);
    expect(buildAuthReturnUrl(externalSite)).toBe(`${externalSite}/`);
    expect(buildAuthReturnUrl(officialSite, "reset")).toBe(`${officialSite}/?auth_mode=reset`);
  });

  it("lets Supabase consume callback tokens before routing recovery inside the SPA", () => {
    const context = workspaceFile("src/contexts/AuthContext.tsx");
    const authPage = workspaceFile("src/features/auth/pages/Auth.tsx");
    const returnHandler = workspaceFile("src/features/auth/components/AuthReturnHandler.tsx");

    expect(context).toContain("emailRedirectTo: getAuthReturnUrl()");
    expect(context).toContain('redirectTo: getAuthReturnUrl("reset")');
    expect(authPage).not.toContain("exchangeCodeForSession");
    expect(returnHandler).toContain('mode !== "reset" || loading');
    expect(returnHandler).toContain('session ? "/auth?mode=reset" : "/auth?mode=login"');
  });

  it("allows localhost redirects only behind an explicit server flag", () => {
    const fallback = officialSite;

    expect(buildSafeRedirect("http://localhost:8080/auth", fallback)).toBe(`${fallback}/`);
    expect(buildSafeRedirect("http://localhost:8080/auth", fallback, "", true)).toBe(
      "http://localhost:8080/auth",
    );
  });

  it("allows only the official site without accepting lookalike origins", () => {
    const configured = officialSite;

    expect(buildSafeRedirect(`${officialSite}/auth?mode=login`, officialSite, configured)).toBe(
      `${officialSite}/auth?mode=login`,
    );
    expect(
      buildSafeRedirect(
        "https://spotlight.rafaelcpires.abrdns.com.evil.example",
        officialSite,
        configured,
      ),
    ).toBe(`${officialSite}/`);
    expect(buildSafeRedirect(`${officialSite}:444/auth`, officialSite, configured)).toBe(
      `${officialSite}/`,
    );
    expect(
      buildSafeRedirect("https://user@spotlight.rafaelcpires.abrdns.com", officialSite, configured),
    ).toBe(`${officialSite}/`);
    expect(buildSafeRedirect(`${externalSite}/auth`, officialSite, configured)).toBe(
      `${officialSite}/`,
    );
  });

  it("uses the public HTTPS Supabase URL for OAuth callbacks", () => {
    expect(buildPublicFunctionUrl(supabaseUrl, "steam-auth-callback").toString()).toBe(
      `${supabaseUrl}/functions/v1/steam-auth-callback`,
    );
    expect(() =>
      buildPublicFunctionUrl("http://project-ref.supabase.co", "steam-auth-callback"),
    ).toThrowError("invalid_supabase_url");
    expect(() =>
      buildPublicFunctionUrl(`${supabaseUrl}/unexpected`, "steam-auth-callback"),
    ).toThrowError("invalid_supabase_url");
  });

  it("accepts only exact Steam claimed IDs and exact return_to values", () => {
    const steamId = "76561198000000000";
    expect(parseSteamClaimedId(`http://steamcommunity.com/openid/id/${steamId}`)).toBe(steamId);
    expect(parseSteamClaimedId(`https://steamcommunity.com/openid/id/${steamId}`)).toBe(steamId);
    expect(
      parseSteamClaimedId(`https://steamcommunity.com.evil.example/openid/id/${steamId}`),
    ).toBeNull();
    expect(parseSteamClaimedId(`https://steamcommunity.com/openid/id/${steamId}/`)).toBeNull();

    const callback = buildSteamCallbackUrl(supabaseUrl, `${officialSite}/`, "nonce-123");
    expect(
      isExpectedSteamReturnTo(callback.toString(), supabaseUrl, `${officialSite}/`, "nonce-123"),
    ).toBe(true);
    callback.searchParams.set("redirect", `${externalSite}/`);
    expect(
      isExpectedSteamReturnTo(callback.toString(), supabaseUrl, `${officialSite}/`, "nonce-123"),
    ).toBe(false);
  });

  it("requires GET and validates the complete Steam OpenID assertion", () => {
    const start = workspaceFile("supabase/functions/steam-auth-start/index.ts");
    const callback = workspaceFile("supabase/functions/steam-auth-callback/index.ts");
    expect(start).toContain('req.method !== "GET"');
    expect(callback).toContain('req.method !== "GET"');
    expect(callback).toContain('opEndpoint !== "https://steamcommunity.com/openid/login"');
    expect(callback).toContain("isExpectedSteamReturnTo");
    expect(callback).toContain("parseSteamClaimedId");
    expect(callback).toContain("identity !== claimedId");
  });

  it("does not embed a legacy hosting origin as an OAuth server fallback", () => {
    const files = [
      "supabase/functions/_shared/origin-security.ts",
      "supabase/functions/steam-auth-start/index.ts",
      "supabase/functions/steam-auth-callback/index.ts",
      "supabase/functions/xbox-auth-start/index.ts",
      "supabase/functions/xbox-auth-callback/index.ts",
      "supabase/functions/psn-auth-start/index.ts",
      "supabase/functions/psn-auth-callback/index.ts",
    ];
    for (const file of files) {
      expect(workspaceFile(file)).not.toContain("LEGACY_SITE_ORIGIN");
    }
  });

  it("uses the supported Auth admin REST lookup in the PSN callback", () => {
    const callback = workspaceFile("supabase/functions/psn-auth-callback/index.ts");
    expect(callback).toContain("/auth/v1/admin/users?email=");
    expect(callback).not.toContain("getUserByEmail");
  });
});

describe("configured-origin CORS contract", () => {
  const primary = "https://spotlight.rafaelcpires.abrdns.com";
  const secondary = "https://preview.example";
  const configured = `${primary},${secondary},not-a-url`;

  it("normalizes and deduplicates configured origins", () => {
    expect(parseAllowedSiteOrigins(`${configured},${secondary}/path`, primary)).toEqual([
      primary,
      secondary,
    ]);
  });

  it("fails closed without a configured primary origin", () => {
    expect(resolvePrimarySiteOrigin(undefined, undefined)).toBe("");
    expect(resolvePrimarySiteOrigin(`${primary}/path`, secondary)).toBe(secondary);
    expect(parseAllowedSiteOrigins(`${secondary}/path,${secondary}:444`, primary)).toEqual([
      primary,
    ]);
  });

  it("reflects only an exact allowed origin and varies the cache by Origin", () => {
    const allowed = parseAllowedSiteOrigins(configured, primary);
    expect(resolveAllowedOrigin(secondary, allowed)).toBe(secondary);
    expect(resolveAllowedOrigin(`${secondary}.evil.example`, allowed)).toBeNull();
    expect(resolveAllowedOrigin(`${secondary}/path`, allowed)).toBeNull();

    const trustedHeaders = buildCorsHeaders(secondary, configured, primary);
    expect(trustedHeaders["Access-Control-Allow-Origin"]).toBe(secondary);
    expect(trustedHeaders["Access-Control-Allow-Methods"]).toBe("POST, OPTIONS");
    expect(trustedHeaders.Vary).toBe("Origin");

    const untrustedHeaders = buildCorsHeaders(`${secondary}.evil.example`, configured, primary);
    expect(untrustedHeaders).not.toHaveProperty("Access-Control-Allow-Origin");
  });
});

describe("AWS static hosting contract", () => {
  it("uses build-time site metadata without a hosting worker", () => {
    const html = workspaceFile("index.html");
    const vite = workspaceFile("vite.config.ts");
    expect(html).toContain("%SPOTLIGHT_SITE_ORIGIN%");
    expect(html).not.toContain("runtime-env.js");
    expect(vite).toContain('outDir: "dist"');
    expect(vite).toContain('env.VITE_SITE_URL || "http://localhost:8080"');
  });

  it("rewrites SPA routes while preserving asset requests", () => {
    const source = workspaceFile("infra/cloudfront/spa-rewrite.js");
    const handler = new Function(`${source}; return handler;`)() as (event: {
      request: { uri: string };
    }) => { uri: string };

    expect(handler({ request: { uri: "/game/123" } }).uri).toBe("/index.html");
    expect(handler({ request: { uri: "/u/usuario" } }).uri).toBe("/index.html");
    expect(handler({ request: { uri: "/" } }).uri).toBe("/index.html");
    expect(handler({ request: { uri: "/assets/missing.js" } }).uri).toBe("/assets/missing.js");
  });
});

describe("SpotLight brand contract", () => {
  it("uses the otter identity across document and shared component assets", () => {
    const html = workspaceFile("index.html");
    const brandMark = workspaceFile("src/components/BrandMark.tsx");

    expect(html).not.toContain("saturn.svg");
    expect(html).toContain("/favicon.ico?v=3");
    expect(html).toContain("/apple-touch-icon.png?v=3");
    expect(brandMark).toContain("/spotlight-icon-512.png");
    expect(brandMark).not.toContain("compact");
  });
});

describe("ASP.NET migration boundary", () => {
  it("keeps frontend API calls behind one authenticated client", () => {
    const client = workspaceFile("src/api/client.ts");
    expect(client).toContain("API_URL");
    expect(client).toContain('headers.set("Authorization", `Bearer ${token}`)');
    expect(client).toContain('apiRequest<CurrentUserResponse>("/api/me"');
  });
});

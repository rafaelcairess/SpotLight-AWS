import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { buildFriendRequestDeletionFilter } from "../../supabase/functions/_shared/account-deletion";
import {
  isSteamId64,
  minutesToHours,
  parseSteamInput,
} from "../../supabase/functions/_shared/steam-sync";
import { buildSafeRedirect } from "../../supabase/functions/_shared/oauth-security";
import {
  buildCorsHeaders,
  parseAllowedSiteOrigins,
  resolveAllowedOrigin,
} from "../../supabase/functions/_shared/origin-security";

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
  it("allows localhost redirects only behind an explicit server flag", () => {
    const fallback = "https://spot-light-xi.vercel.app";

    expect(buildSafeRedirect("http://localhost:8080/auth", fallback)).toBe(`${fallback}/`);
    expect(buildSafeRedirect("http://localhost:8080/auth", fallback, "", true)).toBe(
      "http://localhost:8080/auth",
    );
  });

  it("allows Vercel and CloudFront without accepting lookalike origins", () => {
    const fallback = "https://spot-light-xi.vercel.app";
    const cloudFront = "https://d1234567890.cloudfront.net";
    const configured = `${fallback},${cloudFront}`;

    expect(buildSafeRedirect(`${cloudFront}/auth?mode=login`, fallback, configured)).toBe(
      `${cloudFront}/auth?mode=login`,
    );
    expect(
      buildSafeRedirect("https://spot-light-xi.vercel.app.evil.example", fallback, configured),
    ).toBe(`${fallback}/`);
  });

  it("requires GET and validates the complete Steam OpenID assertion", () => {
    const start = workspaceFile("supabase/functions/steam-auth-start/index.ts");
    const callback = workspaceFile("supabase/functions/steam-auth-callback/index.ts");
    expect(start).toContain('req.method !== "GET"');
    expect(callback).toContain('req.method !== "GET"');
    expect(callback).toContain('opEndpoint !== "https://steamcommunity.com/openid/login"');
    expect(callback).toContain("assertedReturnTo.searchParams.get");
    expect(callback).toContain("identity !== claimedId");
  });

  it("uses the supported Auth admin REST lookup in the PSN callback", () => {
    const callback = workspaceFile("supabase/functions/psn-auth-callback/index.ts");
    expect(callback).toContain("/auth/v1/admin/users?email=");
    expect(callback).not.toContain("getUserByEmail");
  });
});

describe("multi-origin CORS contract", () => {
  const primary = "https://spot-light-xi.vercel.app";
  const cloudFront = "https://d1234567890.cloudfront.net";
  const configured = `${primary},${cloudFront},not-a-url`;

  it("normalizes and deduplicates configured origins", () => {
    expect(parseAllowedSiteOrigins(`${configured},${cloudFront}/path`, primary)).toEqual([
      primary,
      cloudFront,
    ]);
  });

  it("reflects only an exact allowed origin and varies the cache by Origin", () => {
    const allowed = parseAllowedSiteOrigins(configured, primary);
    expect(resolveAllowedOrigin(cloudFront, allowed)).toBe(cloudFront);
    expect(resolveAllowedOrigin(`${cloudFront}.evil.example`, allowed)).toBeNull();
    expect(resolveAllowedOrigin(`${cloudFront}/path`, allowed)).toBeNull();

    const trustedHeaders = buildCorsHeaders(cloudFront, configured, primary);
    expect(trustedHeaders["Access-Control-Allow-Origin"]).toBe(cloudFront);
    expect(trustedHeaders["Access-Control-Allow-Methods"]).toBe("POST, OPTIONS");
    expect(trustedHeaders.Vary).toBe("Origin");

    const untrustedHeaders = buildCorsHeaders(`${cloudFront}.evil.example`, configured, primary);
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

describe("ASP.NET migration boundary", () => {
  it("keeps frontend API calls behind one authenticated client", () => {
    const client = workspaceFile("src/api/client.ts");
    expect(client).toContain("API_URL");
    expect(client).toContain('headers.set("Authorization", `Bearer ${token}`)');
    expect(client).toContain('apiRequest<CurrentUserResponse>("/api/me"');
  });

  it("exposes a cloud health probe", () => {
    const program = workspaceFile("backend/SpotLight.Api/Program.cs");
    expect(program).toContain("builder.Services.AddHealthChecks()");
    expect(program).toContain('app.MapHealthChecks("/health")');
  });
});

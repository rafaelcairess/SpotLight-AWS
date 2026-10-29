import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchDiscountedGamesFromApi,
  fetchGameByIdFromApi,
  fetchGamesByIdsFromApi,
  mapGameApiResponse,
} from "@/features/games/data/gamesApi";

const apiGame = {
  appId: 730,
  title: "Counter-Strike &amp; 2",
  image: "https://example.com/cs2.jpg",
  shortDescription: "Competitive",
  genre: "Action",
  tags: ["FPS"],
  activePlayers: 900000,
  communityRating: 87,
  price: null,
  priceOriginal: null,
  discountPercent: null,
  releaseDate: null,
  developer: "Valve",
  publisher: "Valve",
  platforms: ["windows"],
  backgroundImage: null,
  trailerUrl: null,
  trailerThumbnail: null,
  screenshotUrls: [],
  mediaSyncedAt: null,
};

afterEach(() => vi.unstubAllGlobals());

describe("gamesApi", () => {
  it("maps the C# contract to the frontend game model", () => {
    const game = mapGameApiResponse(apiGame);

    expect(game.app_id).toBe(730);
    expect(game.title).toBe("Counter-Strike & 2");
    expect(game.activePlayers).toBe(900000);
    expect(game.developer).toBe("Valve");
  });

  it("returns null when the API does not have the game", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 404 })));

    await expect(fetchGameByIdFromApi(10)).resolves.toBeNull();
  });

  it("rejects responses that cannot be used", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 503 })));

    await expect(fetchGameByIdFromApi(730)).rejects.toThrow("HTTP 503");
  });

  it("maps a discounted page from the C# contract", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ games: [apiGame], total: 42, page: 2, limit: 1 })),
    );

    await expect(fetchDiscountedGamesFromApi(2, 1, "pt")).resolves.toMatchObject({
      games: [{ app_id: 730, title: "Counter-Strike & 2" }],
      count: 42,
    });
  });

  it("sends repeated appId parameters when loading a batch", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json([]));
    vi.stubGlobal("fetch", fetchMock);

    await fetchGamesByIdsFromApi([570, 730], "es");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("appId=570&appId=730&locale=es"),
      expect.any(Object),
    );
  });
});

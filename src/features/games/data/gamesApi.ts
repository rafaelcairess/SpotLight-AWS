import { API_URL, GAME_READ_SOURCE } from "@/config/runtimeEnv";
import { decodeHtmlEntities } from "@/lib/text";
import type { GameData } from "@/types/game";

type GameApiResponse = {
  appId: number;
  title: string;
  image: string | null;
  shortDescription: string | null;
  genre: string | null;
  tags: string[] | null;
  activePlayers: number | null;
  communityRating: number | null;
  price: string | null;
  priceOriginal: string | null;
  discountPercent: number | null;
  releaseDate: string | null;
  developer: string | null;
  publisher: string | null;
  platforms: string[] | null;
  backgroundImage: string | null;
  trailerUrl: string | null;
  trailerThumbnail: string | null;
  screenshotUrls: string[];
  mediaSyncedAt: string | null;
};

type GamePageApiResponse = {
  games: GameApiResponse[];
  total: number;
  page: number;
  limit: number;
};

export const shouldReadGamesFromApi = GAME_READ_SOURCE === "api" && API_URL.length > 0;

const optionalText = (value: string | null) => (value ? decodeHtmlEntities(value) : undefined);

export const mapGameApiResponse = (game: GameApiResponse): GameData => ({
  app_id: game.appId,
  title: decodeHtmlEntities(game.title),
  image: game.image || "",
  short_description: optionalText(game.shortDescription),
  genre: optionalText(game.genre),
  tags: game.tags || undefined,
  activePlayers: game.activePlayers ?? undefined,
  communityRating: game.communityRating ?? undefined,
  price: game.price || undefined,
  priceOriginal: game.priceOriginal || undefined,
  discountPercent: game.discountPercent ?? undefined,
  releaseDate: game.releaseDate || undefined,
  developer: optionalText(game.developer),
  publisher: optionalText(game.publisher),
  platforms: game.platforms || undefined,
  backgroundImage: game.backgroundImage || undefined,
  trailerUrl: game.trailerUrl || undefined,
  trailerThumbnail: game.trailerThumbnail || undefined,
  screenshots: game.screenshotUrls.length > 0 ? game.screenshotUrls : undefined,
  mediaSyncedAt: game.mediaSyncedAt || undefined,
});

export async function fetchGameByIdFromApi(
  appId: number,
  locale = "pt",
  signal?: AbortSignal,
): Promise<GameData | null> {
  const response = await fetch(
    `${API_URL}/api/games/${appId}?locale=${encodeURIComponent(locale)}`,
    {
      headers: { Accept: "application/json" },
      signal,
    },
  );

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`SpotLight API respondeu com HTTP ${response.status}.`);
  }

  return mapGameApiResponse((await response.json()) as GameApiResponse);
}

const fetchGameList = async (path: string, signal?: AbortSignal): Promise<GameData[]> => {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { Accept: "application/json" },
    signal,
  });

  if (!response.ok) {
    throw new Error(`SpotLight API respondeu com HTTP ${response.status}.`);
  }

  return ((await response.json()) as GameApiResponse[]).map(mapGameApiResponse);
};

const localeQuery = (locale: string) => `locale=${encodeURIComponent(locale)}`;

export const fetchPopularGamesFromApi = (limit: number, locale: string, signal?: AbortSignal) =>
  fetchGameList(`/api/games/popular?limit=${limit}&${localeQuery(locale)}`, signal);

export const fetchRecentGamesFromApi = (limit: number, locale: string, signal?: AbortSignal) =>
  fetchGameList(`/api/games/recent?limit=${limit}&${localeQuery(locale)}`, signal);

export async function fetchDiscountedGamesFromApi(
  page: number,
  limit: number,
  locale: string,
  signal?: AbortSignal,
) {
  const response = await fetch(
    `${API_URL}/api/games/discounted?page=${page}&limit=${limit}&${localeQuery(locale)}`,
    { headers: { Accept: "application/json" }, signal },
  );

  if (!response.ok) {
    throw new Error(`SpotLight API respondeu com HTTP ${response.status}.`);
  }

  const result = (await response.json()) as GamePageApiResponse;
  return { games: result.games.map(mapGameApiResponse), count: result.total };
}

export function fetchGamesByIdsFromApi(appIds: number[], locale: string, signal?: AbortSignal) {
  const query = new URLSearchParams();
  appIds.forEach((appId) => query.append("appId", String(appId)));
  query.set("locale", locale);
  return fetchGameList(`/api/games/batch?${query.toString()}`, signal);
}

export const searchGamesFromApi = (
  query: string,
  limit: number,
  locale: string,
  signal?: AbortSignal,
) =>
  fetchGameList(
    `/api/games/search?q=${encodeURIComponent(query)}&limit=${limit}&${localeQuery(locale)}`,
    signal,
  );

export async function fetchDailyFeaturedFromApi(
  locale: string,
  signal?: AbortSignal,
): Promise<GameData | null> {
  const response = await fetch(`${API_URL}/api/games/featured?${localeQuery(locale)}`, {
    headers: { Accept: "application/json" },
    signal,
  });

  if (response.status === 204) return null;
  if (!response.ok) {
    throw new Error(`SpotLight API respondeu com HTTP ${response.status}.`);
  }

  return mapGameApiResponse((await response.json()) as GameApiResponse);
}

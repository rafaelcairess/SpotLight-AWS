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
  signal?: AbortSignal,
): Promise<GameData | null> {
  const response = await fetch(`${API_URL}/api/games/${appId}`, {
    headers: { Accept: "application/json" },
    signal,
  });

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`SpotLight API respondeu com HTTP ${response.status}.`);
  }

  return mapGameApiResponse((await response.json()) as GameApiResponse);
}

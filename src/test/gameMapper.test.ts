import { describe, expect, it } from "vitest";
import { mapGameRow, mapGameRows, type GameRow } from "@/features/games/data/gameMapper";

describe("game data mapper", () => {
  it("converts the database contract into the shared UI model", () => {
    const row = {
      app_id: 42,
      title: "Example",
      image: "poster.jpg",
      background_image: "header.jpg",
      active_players: 0,
      community_rating: 0,
      discount_percent: 0,
      screenshot_urls: ["shot.jpg"],
      trailer_url: "trailer.mp4",
      trailer_thumbnail: "trailer.jpg",
      media_synced_at: "2026-08-04T00:00:00Z",
    } as GameRow;

    expect(mapGameRow(row)).toMatchObject({
      app_id: 42,
      title: "Example",
      image: "poster.jpg",
      backgroundImage: "header.jpg",
      activePlayers: 0,
      communityRating: 0,
      discountPercent: 0,
      screenshots: ["shot.jpg"],
      trailerUrl: "trailer.mp4",
      trailerThumbnail: "trailer.jpg",
      mediaSyncedAt: "2026-08-04T00:00:00Z",
    });
  });

  it("maps result collections through the same boundary", () => {
    const row = { app_id: 7, title: "Seven", image: null } as GameRow;
    expect(mapGameRows([row])).toEqual([expect.objectContaining({ app_id: 7, image: "" })]);
  });

  it("decodes Steam HTML entities as plain display text", () => {
    const row = {
      app_id: 8,
      title: "Tom &amp; Jerry",
      image: null,
      short_description: "Meet &quot;Pals&quot; and collect &#9733; rewards.",
      developer: "Studio &lt;North&gt;",
    } as GameRow;

    expect(mapGameRow(row)).toMatchObject({
      title: "Tom & Jerry",
      short_description: 'Meet "Pals" and collect ★ rewards.',
      developer: "Studio <North>",
    });
  });
});

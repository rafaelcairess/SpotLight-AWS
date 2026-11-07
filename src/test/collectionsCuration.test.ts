import { describe, expect, it } from "vitest";
import { CATEGORIES } from "@/types/game";
import {
  CATEGORY_FEATURED_GAME_IDS,
  CATEGORY_GAME_IDS,
} from "@/features/collections/data/categoryGameIds";

describe("collection curation", () => {
  it("keeps every public collection intentional and free from duplicate entries", () => {
    for (const category of CATEGORIES) {
      const gameIds = CATEGORY_GAME_IDS[category.id];
      expect(gameIds, category.id).toBeDefined();
      expect(gameIds.length, category.id).toBeGreaterThanOrEqual(8);
      expect(new Set(gameIds).size, category.id).toBe(gameIds.length);
      expect(
        gameIds.every((appId) => Number.isInteger(appId) && appId > 0),
        category.id,
      ).toBe(true);
    }
  });

  it("uses distinct, representative games for the featured co-op collections", () => {
    const featuredIds = Object.values(CATEGORY_FEATURED_GAME_IDS);
    expect(new Set(featuredIds).size).toBe(featuredIds.length);

    for (const [categoryId, appId] of Object.entries(CATEGORY_FEATURED_GAME_IDS)) {
      expect(CATEGORY_GAME_IDS[categoryId]).toContain(appId);
    }

    expect(CATEGORY_FEATURED_GAME_IDS["coop-2-online"]).toBe(1335790);
  });

  it("does not mix obvious non-VR or non-fighting titles into specialist collections", () => {
    expect(CATEGORY_GAME_IDS.vr).not.toEqual(expect.arrayContaining([620, 730, 550]));
    expect(CATEGORY_GAME_IDS.fighting).not.toEqual(expect.arrayContaining([550, 252490, 1245620]));
    expect(CATEGORY_GAME_IDS["coop-2-couch"]).not.toContain(553850);
  });
});

import { describe, expect, it } from "vitest";
import type { Profile } from "@/hooks/useProfile";
import { getProfilePlatformSummaries } from "@/features/profile/profilePlatforms";

const profile = {
  steam_id: "76561198000000000",
  xbox_id: null,
  xbox_gamertag: null,
  psn_id: null,
  psn_online_id: null,
} as Profile;

describe("profile platform summaries", () => {
  it("combines connected accounts with platforms used in registered games", () => {
    const platforms = getProfilePlatformSummaries(profile, [
      { platinum_platforms: ["xbox", "xbox"] },
      { platinum_platforms: ["xbox"] },
    ]);

    expect(platforms.map((platform) => platform.id)).toEqual(["steam", "xbox"]);
    expect(platforms.find((platform) => platform.id === "steam")).toMatchObject({
      connected: true,
      gameCount: 0,
    });
    expect(platforms.find((platform) => platform.id === "xbox")).toMatchObject({
      connected: false,
      gameCount: 2,
    });
  });

  it("does not infer game platforms when the library is private", () => {
    const platforms = getProfilePlatformSummaries(
      profile,
      [{ platinum_platforms: ["playstation"] }],
      false,
    );

    expect(platforms.map((platform) => platform.id)).toEqual(["steam"]);
  });
});

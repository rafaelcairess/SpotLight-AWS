import type { Profile } from "@/hooks/useProfile";
import type { GamingPlatform } from "@/features/profile/components/PlatformIcon";

export interface PlatformUsageEntry {
  platinum_platforms?: string[] | null;
}

export interface ProfilePlatformSummary {
  id: GamingPlatform;
  label: string;
  connected: boolean;
  identity: string | null;
  gameCount: number;
}

const platformIds: GamingPlatform[] = ["steam", "xbox", "playstation"];

const platformLabels: Record<GamingPlatform, string> = {
  steam: "Steam",
  xbox: "Xbox",
  playstation: "PlayStation",
};

export function getProfilePlatformSummaries(
  profile: Profile | null | undefined,
  entries: PlatformUsageEntry[] = [],
  includeGameUsage = true,
): ProfilePlatformSummary[] {
  if (!profile) return [];

  const gameCounts: Record<GamingPlatform, number> = {
    steam: 0,
    xbox: 0,
    playstation: 0,
  };

  if (includeGameUsage) {
    for (const entry of entries) {
      const uniquePlatforms = new Set(
        (entry.platinum_platforms ?? []).filter(
          (platform): platform is GamingPlatform =>
            platform === "steam" || platform === "xbox" || platform === "playstation",
        ),
      );
      for (const platform of uniquePlatforms) gameCounts[platform] += 1;
    }
  }

  const connected: Record<GamingPlatform, boolean> = {
    steam: Boolean(profile.steam_id),
    xbox: Boolean(profile.xbox_id || profile.xbox_gamertag),
    playstation: Boolean(profile.psn_id || profile.psn_online_id),
  };
  const identities: Record<GamingPlatform, string | null> = {
    steam: null,
    xbox: profile.xbox_gamertag,
    playstation: profile.psn_online_id,
  };

  return platformIds
    .map((id) => ({
      id,
      label: platformLabels[id],
      connected: connected[id],
      identity: identities[id],
      gameCount: gameCounts[id],
    }))
    .filter((platform) => platform.connected || platform.gameCount > 0);
}

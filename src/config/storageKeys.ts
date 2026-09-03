export const STORAGE_KEYS = {
  language: "spotlight.lang",
  onboarding: "spotlight.onboarding.v2",
  matureContent: "spotlight.matureContent",
  layoutMode: {
    base: "spotlight.layoutMode",
    explore: "spotlight.layoutMode.explore",
    topGames: "spotlight.layoutMode.topGames",
    mostPlayed: "spotlight.layoutMode.mostPlayed",
  },
} as const;

export const ONBOARDING_COMPLETED_EVENT = "spotlight:onboarding-completed";

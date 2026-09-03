import { useMemo } from "react";
import { BookOpen, CheckCircle2, Clock3, Search, Trophy, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useGamesByIds } from "@/hooks/useGames";
import { useMaturePreference } from "@/hooks/useMaturePreference";
import { useProfile } from "@/hooks/useProfile";
import { useProfileProgress } from "@/hooks/useProfileProgress";
import { useRecentActivity } from "@/hooks/useRecentActivity";
import { isMatureGame } from "@/lib/matureFilter";
import type { GameData } from "@/types/game";
import { useTranslation } from "react-i18next";

interface PersonalHomePanelProps {
  onGameSelect: (game: GameData) => void;
}

export default function PersonalHomePanel({ onGameSelect }: PersonalHomePanelProps) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [showMature] = useMaturePreference();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: progress, isLoading: progressLoading } = useProfileProgress(user?.id);
  const { data: activity = [], isLoading: activityLoading } = useRecentActivity(user?.id);
  const recentIds = useMemo(() => activity.map((item) => item.app_id), [activity]);
  const { data: recentGames = [], isLoading: gamesLoading } = useGamesByIds(recentIds);
  const recentGame = recentGames.find((game) => showMature || !isMatureGame(game));
  const recentActivity = recentGame
    ? activity.find((item) => item.app_id === recentGame.app_id)
    : undefined;
  const isLoading = profileLoading || progressLoading || activityLoading || gamesLoading;
  const displayName =
    profile?.display_name?.trim() || profile?.username || user?.email?.split("@")[0];

  const stats = [
    { label: t("home.personalGames"), value: progress?.games_count, icon: BookOpen },
    { label: t("home.personalHours"), value: progress?.hours_count, icon: Clock3 },
    { label: t("home.personalCompleted"), value: progress?.completed_count, icon: CheckCircle2 },
    { label: t("home.personalPlatinums"), value: progress?.platinum_count, icon: Trophy },
  ];

  return (
    <section className="premium-surface overflow-hidden p-5 sm:p-6 lg:p-7">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)] lg:items-stretch">
        <div className="min-w-0">
          <p className="eyebrow mb-2">{t("home.personalEyebrow")}</p>
          <h1 className="font-logo text-2xl font-bold tracking-tight sm:text-3xl">
            {t("home.personalGreeting", {
              name: displayName || t("home.personalDefaultName"),
            })}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {t("home.personalSubtitle")}
          </p>

          <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.07] sm:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="bg-card px-3 py-3.5 sm:px-4">
                  <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                    <Icon className="h-3.5 w-3.5" />
                    <span className="text-[11px] font-medium uppercase tracking-wide">
                      {stat.label}
                    </span>
                  </div>
                  <p className="text-xl font-semibold tabular-nums">
                    {isLoading ? "—" : (stat.value ?? 0).toLocaleString()}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-5 flex flex-wrap gap-2.5">
            <Button asChild>
              <Link to="/profile">
                <UserRound className="h-4 w-4" />
                {t("home.personalViewProfile")}
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/search">
                <Search className="h-4 w-4" />
                {t("home.personalExplore")}
              </Link>
            </Button>
          </div>
        </div>

        {recentGame ? (
          <button
            type="button"
            onClick={() => onGameSelect(recentGame)}
            className="group relative min-h-56 overflow-hidden rounded-xl border border-white/[0.09] bg-card text-left transition-colors hover:border-primary/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <img
              src={recentGame.image}
              alt=""
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/55 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                {t("home.personalRecentlyPlayed")}
              </p>
              <h2 className="mt-1 line-clamp-2 text-lg font-semibold text-white">
                {recentGame.title}
              </h2>
              {recentActivity?.playtime_2weeks ? (
                <p className="mt-1.5 text-xs text-slate-300">
                  {t("home.personalRecentHours", {
                    hours: recentActivity.playtime_2weeks.toLocaleString(undefined, {
                      maximumFractionDigits: 1,
                    }),
                  })}
                </p>
              ) : null}
            </div>
          </button>
        ) : (
          <div className="flex min-h-56 flex-col justify-end rounded-xl border border-dashed border-white/[0.1] bg-card/45 p-5">
            <BookOpen className="h-5 w-5 text-primary" />
            <h2 className="mt-4 font-semibold">{t("home.personalEmptyTitle")}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {t("home.personalEmptyDescription")}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

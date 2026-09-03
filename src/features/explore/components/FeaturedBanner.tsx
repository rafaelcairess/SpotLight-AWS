import { Info, Star, UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { GameData } from "@/types/game";
import { cn } from "@/lib/utils";
import steamIcon from "@/assets/steam.png";
import { useTranslation } from "react-i18next";
import { getSteamStoreUrl } from "@/lib/steam";
import { formatPlayers, getRatingColorClass } from "@/lib/format";

interface FeaturedBannerProps {
  game: GameData;
  onExplore: () => void;
  isAuthenticated?: boolean;
}

const FeaturedBanner = ({ game, onExplore, isAuthenticated = false }: FeaturedBannerProps) => {
  const { t } = useTranslation();
  const handleOpenSteam = () => {
    window.open(getSteamStoreUrl(game.app_id), "_blank", "noopener,noreferrer");
  };

  return (
    <div className="group relative min-h-[27rem] w-full overflow-hidden rounded-3xl bg-card shadow-[0_28px_80px_hsl(222_70%_2%/0.38)] ring-1 ring-white/[0.045] sm:min-h-[30rem] lg:min-h-[32rem]">
      <img
        src={game.image}
        alt=""
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.018]"
        fetchPriority="high"
        loading="eager"
        decoding="async"
      />

      <div className="absolute inset-0 bg-[linear-gradient(90deg,hsl(var(--background)/0.98)_0%,hsl(var(--background)/0.82)_38%,hsl(var(--background)/0.18)_76%,transparent_100%)]" />
      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-black/15" />

      <div className="relative flex min-h-[27rem] max-w-[46rem] flex-col justify-end p-6 sm:min-h-[30rem] sm:p-10 lg:min-h-[32rem] lg:p-12 xl:p-16">
        <div className="mb-4 flex min-w-0 items-center gap-2 animate-fade-in sm:mb-6">
          <span className="rounded-full bg-primary/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-primary backdrop-blur-md">
            {t("featuredBanner.badge")}
          </span>
          {game.genre ? (
            <span className="truncate rounded-full bg-black/35 px-3 py-1.5 text-xs font-medium text-foreground/75 backdrop-blur-md">
              {game.genre}
            </span>
          ) : null}
        </div>

        <h1 className="mb-5 line-clamp-2 break-words text-[2.5rem] font-extrabold leading-[0.98] tracking-[-0.055em] text-white [text-wrap:balance] animate-fade-in-up sm:text-6xl lg:text-7xl">
          {game.title}
        </h1>

        <div className="mb-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs animate-fade-in sm:text-sm">
          {game.activePlayers ? (
            <div className="flex items-center gap-2 text-slate-300">
              <Users className="h-4 w-4 text-primary" />
              <span>
                <span className="font-semibold text-white">
                  {formatPlayers(game.activePlayers)}
                </span>{" "}
                {t("gameCard.playing")}
              </span>
            </div>
          ) : null}
          {game.communityRating ? (
            <div className="flex items-center gap-2">
              <Star
                className={cn("h-4 w-4 fill-current", getRatingColorClass(game.communityRating))}
              />
              <span className={cn("font-medium", getRatingColorClass(game.communityRating))}>
                {t("featuredBanner.ratingPositive", {
                  value: game.communityRating,
                })}
              </span>
            </div>
          ) : null}
        </div>

        {game.short_description ? (
          <p className="mb-7 max-w-2xl line-clamp-3 text-sm leading-7 text-slate-300/90 animate-fade-in sm:text-base">
            {game.short_description}
          </p>
        ) : null}

        <div className="flex w-full flex-col gap-2 animate-fade-in-up min-[420px]:w-auto min-[420px]:flex-row min-[420px]:flex-wrap min-[420px]:items-center sm:gap-3">
          {!isAuthenticated ? (
            <Button size="lg" className="w-full gap-2 px-6 min-[420px]:w-auto" asChild>
              <Link to="/auth?mode=signup">
                <UserPlus className="h-4 w-4" />
                {t("featuredBanner.createAccount")}
              </Link>
            </Button>
          ) : (
            <Button
              type="button"
              size="lg"
              className="w-full gap-2 px-6 min-[420px]:w-auto"
              onClick={onExplore}
            >
              <Info className="h-4 w-4" />
              {t("featuredBanner.moreDetails")}
            </Button>
          )}

          {!isAuthenticated ? (
            <Button
              type="button"
              size="lg"
              variant="outline"
              className="w-full gap-2 border-white/[0.12] bg-black/20 px-6 backdrop-blur-sm min-[420px]:w-auto"
              onClick={onExplore}
            >
              <Info className="h-4 w-4" />
              {t("featuredBanner.moreDetails")}
            </Button>
          ) : null}

          <Button
            type="button"
            size={isAuthenticated ? "lg" : "sm"}
            variant={isAuthenticated ? "outline" : "ghost"}
            className={cn(
              "w-full gap-2 min-[420px]:w-auto",
              isAuthenticated
                ? "border-white/[0.12] bg-black/20 px-6 backdrop-blur-sm"
                : "min-h-10 px-3 text-slate-300 hover:bg-white/[0.05] hover:text-white",
            )}
            onClick={handleOpenSteam}
          >
            <img src={steamIcon} alt="" className="h-4 w-4" />
            {t("gameModal.viewOnSteam")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FeaturedBanner;

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
  const Heading = isAuthenticated ? "h2" : "h1";
  const handleOpenSteam = () => {
    window.open(getSteamStoreUrl(game.app_id), "_blank", "noopener,noreferrer");
  };

  return (
    <div className="group relative min-h-[23rem] w-full overflow-hidden rounded-2xl border border-white/[0.1] bg-card shadow-[0_20px_55px_hsl(226_75%_2%/0.46)] sm:min-h-[25rem] lg:min-h-[26rem]">
      <img
        src={game.image}
        alt=""
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-1000 ease-out group-hover:scale-[1.025]"
        fetchPriority="high"
        loading="eager"
        decoding="async"
      />

      <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/72 to-background/10" />
      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-black/20" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />

      <div className="relative flex min-h-[23rem] max-w-3xl flex-col justify-end p-5 sm:min-h-[25rem] sm:p-8 lg:min-h-[26rem] lg:p-10 xl:p-12">
        <div className="mb-4 flex min-w-0 items-center gap-2 animate-fade-in sm:mb-5">
          <span className="rounded-full border border-primary/25 bg-primary/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-primary backdrop-blur-md">
            {t("featuredBanner.badge")}
          </span>
          {game.genre && (
            <span className="truncate rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-xs font-medium text-foreground/85 backdrop-blur-md">
              {game.genre}
            </span>
          )}
        </div>

        <Heading className="mb-4 line-clamp-2 break-words font-logo text-[2.25rem] font-extrabold leading-[1] tracking-[-0.045em] text-white [text-wrap:balance] animate-fade-in-up sm:text-5xl lg:text-6xl xl:text-[4rem]">
          {game.title}
        </Heading>

        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs animate-fade-in sm:mb-5 sm:gap-5 sm:text-sm">
          {game.activePlayers && (
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-3 py-1.5 backdrop-blur-md">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">
                <span className="text-foreground font-semibold">
                  {formatPlayers(game.activePlayers)}
                </span>{" "}
                {t("gameCard.playing")}
              </span>
            </div>
          )}
          {game.communityRating && (
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-3 py-1.5 backdrop-blur-md">
              <Star
                className={cn("w-4 h-4 fill-current", getRatingColorClass(game.communityRating))}
              />
              <span className={getRatingColorClass(game.communityRating)}>
                {t("featuredBanner.ratingPositive", {
                  value: game.communityRating,
                })}
              </span>
            </div>
          )}
        </div>

        {game.short_description && (
          <p className="mb-5 max-w-xl line-clamp-2 text-sm leading-relaxed text-slate-300 animate-fade-in sm:mb-7 sm:text-base md:line-clamp-3">
            {game.short_description}
          </p>
        )}

        <div className="flex w-full flex-col gap-2.5 animate-fade-in-up sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
          {!isAuthenticated ? (
            <Button size="lg" className="w-full gap-2 px-5 sm:w-auto sm:px-7" asChild>
              <Link to="/auth?mode=signup">
                <UserPlus className="h-4 w-4" />
                {t("featuredBanner.createAccount")}
              </Link>
            </Button>
          ) : (
            <Button
              type="button"
              size="lg"
              className="w-full gap-2 px-5 sm:w-auto sm:px-7"
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
              variant="secondary"
              className="w-full gap-2 border border-white/[0.1] bg-white/[0.08] px-5 sm:w-auto"
              onClick={onExplore}
            >
              <Info className="h-4 w-4" />
              {t("featuredBanner.moreDetails")}
            </Button>
          ) : null}

          <Button
            type="button"
            size={isAuthenticated ? "lg" : "sm"}
            variant={isAuthenticated ? "secondary" : "ghost"}
            className="w-full gap-2 px-4 sm:w-auto"
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

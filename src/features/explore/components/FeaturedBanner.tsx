import { ArrowUpRight, Info, Star, UserPlus, Users } from "lucide-react";
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
    <article className="grid w-full border-y border-border bg-background lg:grid-cols-[minmax(0,1.45fr)_minmax(22rem,0.75fr)]">
      <figure className="relative min-h-72 overflow-hidden bg-muted sm:min-h-[25rem] lg:min-h-[34rem]">
        <img
          src={game.image}
          alt={game.title}
          className="absolute inset-0 h-full w-full object-cover"
          fetchPriority="high"
          loading="eager"
          decoding="async"
        />
      </figure>

      <div className="flex min-w-0 flex-col justify-center border-t border-border px-1 py-8 sm:px-6 sm:py-10 lg:border-l lg:border-t-0 lg:px-9 xl:px-12">
        <div className="mb-6 flex min-w-0 items-center gap-3 text-xs">
          <span className="font-bold uppercase tracking-[0.12em] text-primary">
            {t("featuredBanner.badge")}
          </span>
          {game.genre ? (
            <>
              <span aria-hidden="true" className="text-border">
                /
              </span>
              <span className="truncate font-medium text-muted-foreground">{game.genre}</span>
            </>
          ) : null}
        </div>

        <h1 className="mb-6 line-clamp-3 break-words text-4xl font-extrabold leading-[0.98] tracking-[-0.05em] text-foreground [text-wrap:balance] sm:text-5xl lg:text-[3.5rem]">
          {game.title}
        </h1>

        <div className="mb-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-border py-3 text-xs sm:text-sm">
          {game.activePlayers ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4 text-primary" />
              <span>
                <span className="font-semibold text-foreground">
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
          <p className="mb-7 max-w-[62ch] line-clamp-4 text-sm leading-7 text-muted-foreground sm:text-base">
            {game.short_description}
          </p>
        ) : null}

        <div className="flex w-full flex-col items-start gap-1 sm:w-auto">
          <Button
            type="button"
            size="lg"
            className="mb-2 w-full justify-between gap-6 px-5 sm:w-auto"
            onClick={onExplore}
          >
            <span className="inline-flex items-center gap-2">
              <Info className="h-4 w-4" />
              {t("featuredBanner.moreDetails")}
            </span>
            <ArrowUpRight className="h-4 w-4" />
          </Button>

          {!isAuthenticated ? (
            <Button
              size="sm"
              variant="ghost"
              className="h-9 px-1 text-muted-foreground underline-offset-4 hover:bg-transparent hover:text-foreground hover:underline"
              asChild
            >
              <Link to="/auth?mode=signup">
                <UserPlus className="h-4 w-4" />
                {t("featuredBanner.createAccount")}
              </Link>
            </Button>
          ) : null}

          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-9 px-1 text-muted-foreground underline-offset-4 hover:bg-transparent hover:text-foreground hover:underline"
            onClick={handleOpenSteam}
          >
            <img src={steamIcon} alt="" className="h-4 w-4" />
            {t("gameModal.viewOnSteam")}
          </Button>
        </div>
      </div>
    </article>
  );
};

export default FeaturedBanner;

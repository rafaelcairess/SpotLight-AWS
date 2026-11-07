import { Link } from "react-router-dom";
import {
  Building2,
  Compass,
  Cpu,
  DollarSign,
  GamepadIcon,
  Gauge,
  Headset,
  Map,
  Puzzle,
  Repeat,
  SlidersHorizontal,
  Trophy,
  Skull,
  Sword,
  Users,
  UsersRound,
  Sofa,
  BookOpen,
  Zap,
  Sparkles,
  Flame,
  Target,
  ArrowUpRight,
  LucideIcon,
} from "lucide-react";
import { CategoryData } from "@/types/game";
import type { GameData } from "@/types/game";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface CategoryCardProps {
  category: CategoryData;
  index?: number;
  compact?: boolean;
  previewGames?: GameData[];
  variant?: "compact" | "featured" | "row";
}

const iconMap: Record<string, LucideIcon> = {
  Building2,
  Compass,
  Cpu,
  DollarSign,
  GamepadIcon,
  Gauge,
  Headset,
  Map,
  Puzzle,
  Repeat,
  SlidersHorizontal,
  Trophy,
  Skull,
  Sword,
  Users,
  UsersRound,
  Sofa,
  BookOpen,
  Zap,
  Sparkles,
  Flame,
  Target,
};

const CategoryCard = ({
  category,
  index = 0,
  compact = false,
  previewGames = [],
  variant = compact ? "compact" : "row",
}: CategoryCardProps) => {
  const { t } = useTranslation();
  const Icon = iconMap[category.icon] || Sparkles;
  const title = t(`categories.${category.id}.name`, { defaultValue: category.name });
  const description = t(`categories.${category.id}.description`, {
    defaultValue: category.description,
  });
  const previewImage = previewGames[0]?.backgroundImage || previewGames[0]?.image;
  if (variant === "featured") {
    const previewGame = previewGames[0];

    return (
      <Link
        to={`/collections/${category.id}`}
        className="group grid overflow-hidden border border-border bg-card transition-colors duration-150 hover:border-primary/70 sm:grid-cols-[1.15fr_0.85fr]"
      >
        <div className="relative flex items-center bg-secondary p-4 sm:p-5">
          <Icon
            className="absolute -bottom-5 -left-5 h-32 w-32 text-foreground/[0.035]"
            strokeWidth={1.1}
            aria-hidden="true"
          />
          {previewGame ? (
            <div className="relative w-full overflow-hidden border border-border bg-background">
              <img
                src={previewGame.image}
                alt=""
                className="aspect-[460/215] h-auto w-full object-contain"
                loading="lazy"
                decoding="async"
              />
            </div>
          ) : (
            <div className="relative grid aspect-[460/215] w-full place-items-center border border-border">
              <Icon className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
            </div>
          )}
        </div>
        <div className="relative flex flex-col justify-between overflow-hidden border-t border-border p-5 text-left sm:border-l sm:border-t-0 sm:p-6">
          <Icon
            className="absolute -right-5 -top-5 h-24 w-24 text-foreground/[0.035]"
            strokeWidth={1.1}
            aria-hidden="true"
          />
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-primary">
            {String(index + 1).padStart(2, "0")} / SpotLight
          </span>
          <div className="relative mt-7">
            <h3 className="flex items-end justify-between gap-3 text-xl font-bold tracking-[-0.025em] transition-colors group-hover:text-primary">
              {title}
              <ArrowUpRight className="h-4 w-4 shrink-0" />
            </h3>
            <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">
              {description}
            </p>
            {previewGame ? (
              <p className="mt-3 truncate border-t border-border pt-3 text-[11px] font-medium text-foreground/80">
                {previewGame.title}
              </p>
            ) : null}
          </div>
        </div>
      </Link>
    );
  }

  if (variant === "row") {
    return (
      <Link
        to={`/collections/${category.id}`}
        className="group relative block min-h-36 overflow-hidden border-b border-border text-left transition-colors hover:border-primary/70 [contain-intrinsic-size:144px] [content-visibility:auto]"
      >
        {previewImage ? (
          <img
            src={previewImage}
            alt=""
            className="absolute inset-0 h-full w-full scale-[1.04] object-cover opacity-[0.62] blur-[3px]"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center bg-secondary">
            <Icon className="h-12 w-12 text-muted-foreground/20" aria-hidden="true" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-background/[0.78] via-background/[0.58] to-background/[0.32]" />

        <div className="relative z-10 flex min-h-36 min-w-0 flex-col justify-center px-5 py-5 sm:px-6">
          <span className="mb-2 text-[10px] font-semibold tabular-nums text-muted-foreground">
            {String(index + 1).padStart(2, "0")}
          </span>
          <h3 className="flex items-center justify-between gap-3 text-lg font-bold transition-colors group-hover:text-primary">
            <span className="truncate">{title}</span>
            <ArrowUpRight className="h-4 w-4 shrink-0" />
          </h3>
          <p className="mt-1 max-w-lg line-clamp-2 text-xs leading-5 text-foreground/70">
            {description}
          </p>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`/collections/${category.id}`}
      className={cn(
        "group relative block overflow-hidden rounded-xl border border-border bg-card transition-colors duration-150 hover:border-primary/70 hover:bg-card-hover",
        "min-h-36 sm:min-h-40",
        category.featured && "border-primary/25",
      )}
    >
      <div className={cn("absolute inset-0 transition-colors", "bg-transparent")} />
      <Icon
        className={cn(
          "absolute -right-3 -top-3 h-24 w-24 transition-colors",
          compact
            ? "text-white/[0.035] duration-200 group-hover:text-primary/[0.075]"
            : "text-white/[0.045] group-hover:text-primary/[0.09]",
        )}
        strokeWidth={1.25}
        aria-hidden="true"
      />

      <div
        className={cn(
          "relative flex h-full flex-col items-start justify-end text-left",
          compact ? "p-4 sm:p-5" : "p-5 sm:p-6",
        )}
      >
        <div
          className={cn(
            "mb-auto grid place-items-center rounded-lg transition-colors",
            compact
              ? "border border-border bg-secondary"
              : "border border-border bg-secondary group-hover:border-primary/50",
            compact ? "h-9 w-9" : "h-11 w-11",
          )}
        >
          <Icon className="h-5 w-5 text-foreground transition-colors group-hover:text-primary" />
        </div>

        <h3
          className={cn(
            "mb-1 flex w-full items-center justify-between gap-3 font-bold transition-colors group-hover:text-primary",
            compact && "tracking-[-0.015em] duration-200",
            compact ? "text-base" : "text-lg md:text-xl",
          )}
        >
          {title}
          <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
        </h3>

        <p
          className={cn(
            "line-clamp-2 max-w-[230px] text-muted-foreground",
            compact ? "text-xs" : "text-xs md:text-sm",
          )}
        >
          {description}
        </p>
      </div>
    </Link>
  );
};

export default CategoryCard;

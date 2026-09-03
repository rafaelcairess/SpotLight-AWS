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
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface CategoryCardProps {
  category: CategoryData;
  index?: number;
  compact?: boolean;
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

const CategoryCard = ({ category, index = 0, compact = false }: CategoryCardProps) => {
  const { t } = useTranslation();
  const Icon = iconMap[category.icon] || Sparkles;
  const title = t(`categories.${category.id}.name`, { defaultValue: category.name });
  const description = t(`categories.${category.id}.description`, {
    defaultValue: category.description,
  });

  return (
    <Link
      to={`/collections/${category.id}`}
      className={cn(
        "group relative block overflow-hidden rounded-2xl",
        compact ? "min-h-36 sm:min-h-40" : "aspect-[4/3] sm:aspect-[16/10]",
        "bg-gradient-to-br",
        category.gradient,
        "border border-white/[0.08] shadow-[0_12px_32px_hsl(224_60%_2%/0.2)]",
        "transition-[border-color,background-color] duration-200 hover:border-primary/35",
        category.featured && "border-primary/25",
        "animate-fade-in",
      )}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="absolute inset-0 bg-background/20 transition-colors group-hover:bg-background/10" />
      <Icon
        className="absolute -right-3 -top-3 h-24 w-24 text-white/[0.045] transition-colors group-hover:text-primary/[0.09]"
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
            "mb-auto grid place-items-center rounded-lg border border-white/[0.09] bg-background/35 transition-colors group-hover:border-primary/30 group-hover:bg-primary/[0.08]",
            compact ? "h-9 w-9" : "h-11 w-11",
          )}
        >
          <Icon className="h-5 w-5 text-foreground transition-colors group-hover:text-primary" />
        </div>

        <h3
          className={cn(
            "mb-1 flex w-full items-center justify-between gap-3 font-bold transition-colors group-hover:text-primary",
            compact ? "text-base" : "text-lg md:text-xl",
          )}
        >
          {title}
          <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
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

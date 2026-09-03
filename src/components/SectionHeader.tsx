import { Link } from "react-router-dom";
import { ChevronRight, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  actionLabel?: string;
  actionHref?: string;
  className?: string;
  actions?: ReactNode;
  appearance?: "default" | "editorial";
}

const SectionHeader = ({
  title,
  subtitle,
  icon: Icon,
  actionLabel,
  actionHref,
  className,
  actions,
  appearance = "default",
}: SectionHeaderProps) => {
  const isEditorial = appearance === "editorial";

  return (
    <div
      className={cn(
        isEditorial
          ? "mb-6 flex flex-col items-start justify-between gap-4 sm:mb-8 sm:flex-row sm:items-end"
          : "mb-5 flex flex-col items-start justify-between gap-3 sm:mb-6 sm:flex-row sm:items-end sm:gap-4",
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-3 sm:items-center sm:gap-3.5">
        {Icon ? (
          <div
            className={cn(
              "grid shrink-0 place-items-center",
              isEditorial
                ? "h-8 w-8 rounded-lg bg-white/[0.045]"
                : "h-9 w-9 rounded-xl border border-primary/15 bg-primary/10 shadow-[0_0_24px_hsl(var(--primary)/0.08)] sm:h-10 sm:w-10",
            )}
          >
            <Icon className={cn("text-primary", isEditorial ? "h-4 w-4" : "h-5 w-5")} />
          </div>
        ) : null}
        <div>
          <h2
            className={cn(
              "font-bold leading-tight",
              isEditorial
                ? "text-xl tracking-[-0.025em] sm:text-2xl md:text-[1.75rem]"
                : "font-logo text-lg tracking-[-0.03em] sm:text-xl md:text-2xl",
            )}
          >
            {title}
          </h2>
          {subtitle ? (
            <p
              className={cn(
                "max-w-2xl text-muted-foreground",
                isEditorial ? "mt-1.5 text-sm leading-relaxed" : "mt-1 text-sm",
              )}
            >
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>

      {actions ? (
        <div className="flex items-center gap-2">{actions}</div>
      ) : actionLabel && actionHref ? (
        <Link
          to={actionHref}
          className={cn(
            "group flex min-h-10 shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:text-primary",
            isEditorial
              ? "font-medium duration-200 hover:bg-white/[0.035]"
              : "hover:bg-white/[0.04]",
          )}
        >
          {actionLabel}
          <ChevronRight
            className={cn(
              "h-4 w-4 transition-transform group-hover:translate-x-0.5",
              isEditorial && "duration-200",
            )}
          />
        </Link>
      ) : null}
    </div>
  );
};

export default SectionHeader;

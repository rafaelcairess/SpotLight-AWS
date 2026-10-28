import type { HTMLAttributes, ReactNode } from "react";
import Header from "@/components/Header";
import { cn } from "@/lib/utils";

type PageWidth = "narrow" | "content" | "wide" | "full";

const widthClasses: Record<PageWidth, string> = {
  narrow: "max-w-4xl",
  content: "max-w-6xl",
  wide: "max-w-[1440px]",
  full: "max-w-none",
};

interface PageShellProps {
  children: ReactNode;
  className?: string;
  mainClassName?: string;
}

/** Shared page frame used by the main product journeys. */
export function PageShell({ children, className, mainClassName }: PageShellProps) {
  return (
    <div className={cn("relative min-h-screen overflow-x-clip bg-background", className)}>
      <a
        href="#main-content"
        className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-transform focus:translate-y-0"
      >
        Ir para o conteúdo
      </a>
      <Header />
      <main
        id="main-content"
        className={cn(
          "relative z-10 pt-[calc(5.75rem+env(safe-area-inset-top))] xl:pt-[6.75rem]",
          mainClassName,
        )}
      >
        {children}
      </main>
    </div>
  );
}

interface PageContainerProps extends HTMLAttributes<HTMLElement> {
  width?: PageWidth;
  as?: "div" | "section" | "article";
}

export function PageContainer({
  width = "wide",
  as: Component = "div",
  className,
  ...props
}: PageContainerProps) {
  return (
    <Component
      className={cn("mx-auto w-full px-3.5 sm:px-6 lg:px-8", widthClasses[width], className)}
      {...props}
    />
  );
}

export function PageSurface({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("premium-surface", className)} {...props} />;
}

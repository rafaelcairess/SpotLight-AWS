import { Link2, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlatformIcon } from "./PlatformIcon";
import type { ProfilePlatformSummary } from "@/features/profile/profilePlatforms";
import { useTranslation } from "react-i18next";

interface ProfilePlatformHubProps {
  platforms: ProfilePlatformSummary[];
  owner?: boolean;
  onEdit?: () => void;
}

export function ProfilePlatformHub({ platforms, owner = false, onEdit }: ProfilePlatformHubProps) {
  const { t } = useTranslation();

  return (
    <aside className="overflow-hidden rounded-lg border border-border bg-background/25">
      <header className="border-b border-border px-4 py-3">
        <p className="eyebrow">{t("profile.platformHub.eyebrow")}</p>
        <h2 className="mt-1 text-base font-semibold">{t("profile.platformHub.title")}</h2>
      </header>

      <div className="divide-y divide-border">
        {platforms.map((platform) => (
          <div key={platform.id} className="flex items-center gap-3 px-4 py-3.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-border bg-card text-foreground">
              <PlatformIcon platform={platform.id} className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{platform.label}</p>
              <p className="truncate text-xs text-muted-foreground">
                {platform.identity ||
                  (platform.connected
                    ? t("profile.platformHub.connected")
                    : t("profile.platformHub.registeredGames", {
                        count: platform.gameCount,
                      }))}
              </p>
            </div>
            {platform.connected && (
              <Link2
                className="h-3.5 w-3.5 text-primary"
                aria-label={t("profile.platformHub.connected")}
              />
            )}
          </div>
        ))}
        {platforms.length === 0 && owner ? (
          <p className="px-4 py-5 text-sm leading-6 text-muted-foreground">
            {t("profile.platformHub.empty")}
          </p>
        ) : null}
      </div>

      {owner && onEdit && (
        <div className="border-t border-border p-3">
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={onEdit}>
            <Settings2 className="h-4 w-4" />
            {t("profile.platformHub.manage")}
          </Button>
        </div>
      )}
    </aside>
  );
}

export function ProfilePlatformStrip({ platforms }: { platforms: ProfilePlatformSummary[] }) {
  if (platforms.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-4 text-foreground/80 sm:justify-start">
      {platforms.map((platform) => (
        <span key={platform.id} className="inline-flex items-center gap-1.5 text-xs">
          <PlatformIcon platform={platform.id} className="h-4 w-4" />
          {platform.label}
        </span>
      ))}
    </div>
  );
}

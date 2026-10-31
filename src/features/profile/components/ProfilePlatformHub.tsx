import { Link2, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Profile } from "@/hooks/useProfile";
import { PlatformIcon, type GamingPlatform } from "./PlatformIcon";

interface ProfilePlatformHubProps {
  profile: Profile;
  owner?: boolean;
  onEdit?: () => void;
}

const platformNames: Record<GamingPlatform, string> = {
  steam: "Steam",
  xbox: "Xbox",
  playstation: "PlayStation",
};

export function ProfilePlatformHub({ profile, owner = false, onEdit }: ProfilePlatformHubProps) {
  const platforms: Array<{
    id: GamingPlatform;
    identity: string | null;
    connected: boolean;
  }> = [
    { id: "steam", identity: null, connected: Boolean(profile.steam_id) },
    {
      id: "xbox",
      identity: profile.xbox_gamertag,
      connected: Boolean(profile.xbox_id || profile.xbox_gamertag),
    },
    {
      id: "playstation",
      identity: profile.psn_online_id,
      connected: Boolean(profile.psn_id || profile.psn_online_id),
    },
  ];
  const visiblePlatforms = owner ? platforms : platforms.filter((platform) => platform.connected);

  if (!visiblePlatforms.length) return null;

  return (
    <aside className="overflow-hidden rounded-lg border border-border bg-background/25">
      <header className="border-b border-border px-4 py-3">
        <p className="eyebrow">Perfil multiplataforma</p>
        <h2 className="mt-1 text-base font-semibold">Um lugar para todos os seus jogos</h2>
      </header>

      <div className="divide-y divide-border">
        {visiblePlatforms.map((platform) => (
          <div key={platform.id} className="flex items-center gap-3 px-4 py-3.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-border bg-card text-foreground">
              <PlatformIcon platform={platform.id} className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{platformNames[platform.id]}</p>
              <p className="truncate text-xs text-muted-foreground">
                {platform.identity || (platform.connected ? "Conta conectada" : "Não conectada")}
              </p>
            </div>
            {platform.connected && (
              <Link2 className="h-3.5 w-3.5 text-primary" aria-label="Conta conectada" />
            )}
          </div>
        ))}
      </div>

      {owner && onEdit && (
        <div className="border-t border-border p-3">
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={onEdit}>
            <Settings2 className="h-4 w-4" />
            Gerenciar contas
          </Button>
        </div>
      )}
    </aside>
  );
}

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PlatinumPlatform } from "@/hooks/useUserGames";
import steamLogo from "@/assets/steam.png";

const XBOX_HARDWARE_IMAGE =
  "https://assets.xboxservices.com/assets/18/30/1830806b-d41d-40ce-a846-792df7d14e1d.jpg?n=Xbox-Series-X_Sharing_200x200_02.jpg";
const PLAYSTATION_HARDWARE_IMAGE =
  "https://blog.playstation.com/tachyon/2023/10/cd56722db7b991b3d7a33f1bafd55f80d0ac553d.png";

const platinumPlatforms: Array<{
  value: PlatinumPlatform;
  label: string;
  image?: string;
}> = [
  { value: "steam", label: "Steam" },
  { value: "xbox", label: "Xbox", image: XBOX_HARDWARE_IMAGE },
  { value: "playstation", label: "PlayStation", image: PLAYSTATION_HARDWARE_IMAGE },
];

export function PlatformLogo({ platform, size = "sm" }: { platform: string; size?: "sm" | "md" }) {
  const item = platinumPlatforms.find((option) => option.value === platform);
  if (!item) return null;
  if (item.value !== "steam") {
    return (
      <span
        title={item.label}
        className={
          size === "md"
            ? "inline-flex h-7 items-center text-[10px] font-extrabold tracking-[0.08em] text-foreground"
            : "inline-flex h-5 items-center text-[9px] font-extrabold tracking-[0.08em] text-muted-foreground"
        }
      >
        {item.value === "playstation" ? "PS" : "XBOX"}
      </span>
    );
  }
  return (
    <img
      src={steamLogo}
      alt={item.label}
      title={item.label}
      className={size === "md" ? "h-7 w-7 object-contain" : "h-5 w-5 object-contain"}
    />
  );
}

export function PlatformChoices({
  value,
  onChange,
}: {
  value?: PlatinumPlatform;
  onChange: (platform: PlatinumPlatform) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {platinumPlatforms.map((item) => (
        <button
          key={item.value}
          type="button"
          onClick={() => onChange(item.value)}
          className={`group min-w-0 overflow-hidden rounded-md border text-left text-xs transition-colors ${value === item.value ? "border-amber-300/60 bg-amber-300/10 text-foreground" : "border-border text-muted-foreground hover:border-primary/60"}`}
        >
          <span className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-secondary">
            {item.image ? (
              <img
                src={item.image}
                alt=""
                className="h-full w-full object-cover transition-opacity group-hover:opacity-90"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <img src={steamLogo} alt="" className="h-10 w-10 object-contain" />
            )}
          </span>
          <span className="block truncate border-t border-border px-2.5 py-2 font-semibold">
            {item.label}
          </span>
        </button>
      ))}
    </div>
  );
}

export function PlatinumPlatformDialog({
  open,
  onOpenChange,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (platform: PlatinumPlatform) => Promise<void> | void;
}) {
  const [saving, setSaving] = useState(false);
  const choose = async (platform: PlatinumPlatform) => {
    setSaving(true);
    try {
      await onSelect(platform);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Onde você zerou este jogo?</DialogTitle>
          <DialogDescription>
            Escolha uma plataforma. Você poderá alterar isso depois.
          </DialogDescription>
        </DialogHeader>
        <div className={saving ? "pointer-events-none opacity-60" : ""}>
          <PlatformChoices onChange={choose} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

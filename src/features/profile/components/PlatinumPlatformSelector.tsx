import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PlatinumPlatform } from "@/hooks/useUserGames";
import { PlatformIcon } from "@/features/profile/components/PlatformIcon";

const platinumPlatforms: Array<{
  value: PlatinumPlatform;
  label: string;
}> = [
  { value: "steam", label: "Steam" },
  { value: "xbox", label: "Xbox" },
  { value: "playstation", label: "PlayStation" },
];

const selectedPlatformColors: Record<PlatinumPlatform, string> = {
  steam: "text-[#66c0f4]",
  xbox: "text-[#107c10]",
  playstation: "text-[#0070d1]",
};

export function PlatformLogo({ platform, size = "sm" }: { platform: string; size?: "sm" | "md" }) {
  const item = platinumPlatforms.find((option) => option.value === platform);
  if (!item) return null;
  return (
    <span
      title={item.label}
      aria-label={item.label}
      className="inline-grid place-items-center text-foreground"
    >
      <PlatformIcon platform={item.value} className={size === "md" ? "h-7 w-7" : "h-5 w-5"} />
    </span>
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
          aria-pressed={value === item.value}
          className={`min-w-0 rounded-md border px-2 py-4 text-center text-xs transition-colors ${value === item.value ? "border-primary bg-primary/10 text-foreground" : "border-border bg-background/25 text-muted-foreground hover:border-primary/60 hover:text-foreground"}`}
        >
          <span
            className={`flex items-center justify-center ${value === item.value ? selectedPlatformColors[item.value] : "text-foreground"}`}
          >
            <PlatformIcon platform={item.value} className="h-8 w-8" />
          </span>
          <span className="mt-2 block truncate font-semibold">{item.label}</span>
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
          <DialogTitle>Em qual plataforma você completou este jogo?</DialogTitle>
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

import { FaPlaystation, FaSteam, FaXbox } from "react-icons/fa";
import { cn } from "@/lib/utils";

export type GamingPlatform = "steam" | "xbox" | "playstation";

interface PlatformIconProps {
  platform: GamingPlatform;
  className?: string;
}

/** Official platform glyphs rendered with one consistent visual weight. */
export function PlatformIcon({ platform, className }: PlatformIconProps) {
  const sharedClassName = cn("h-5 w-5", className);

  if (platform === "steam") return <FaSteam aria-hidden="true" className={sharedClassName} />;
  if (platform === "xbox") return <FaXbox aria-hidden="true" className={sharedClassName} />;
  return <FaPlaystation aria-hidden="true" className={sharedClassName} />;
}

import type { ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const OTTER_MARK = "/spotlight-icon-512.png";

interface BrandMarkProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> {
  decorative?: boolean;
}

export function BrandMark({ decorative = false, alt, className, ...props }: BrandMarkProps) {
  return (
    <img
      src={OTTER_MARK}
      alt={decorative ? "" : (alt ?? "SpotLight")}
      aria-hidden={decorative || undefined}
      className={cn("block shrink-0 object-contain", className)}
      {...props}
    />
  );
}

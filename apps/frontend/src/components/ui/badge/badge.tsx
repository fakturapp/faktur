"use client";

import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { tv, type VariantProps } from "tailwind-variants";

const badgeVariants = tv({
  base: "badge",
  defaultVariants: {
    variant: "primary",
    color: "default",
    size: "md",
  },
  variants: {
    variant: {
      primary: "badge--primary",
      secondary: "badge--secondary",
      soft: "badge--soft",
    },
    color: {
      default: "badge--default",
      accent: "badge--accent",
      success: "badge--success",
      warning: "badge--warning",
      danger: "badge--danger",
    },
    size: {
      sm: "badge--sm",
      md: "badge--md",
      lg: "badge--lg",
    },
    placement: {
      "top-right": "badge--top-right",
      "top-left": "badge--top-left",
      "bottom-right": "badge--bottom-right",
      "bottom-left": "badge--bottom-left",
    },
  },
});

type BadgeVariants = VariantProps<typeof badgeVariants>;

type LegacyVariant = "default" | "success" | "warning" | "destructive" | "muted";
type NewVariant = BadgeVariants["variant"];
type AnyVariant = LegacyVariant | NonNullable<NewVariant>;

function isLegacyColor(v?: string): v is LegacyVariant {
  return ["default", "success", "warning", "destructive", "muted"].includes(v ?? "");
}

function mapLegacyColor(v?: string): BadgeVariants["color"] {
  switch (v) {
    case "success": return "success";
    case "warning": return "warning";
    case "destructive": return "danger";
    case "muted": return "default";
    default: return "default";
  }
}

interface BadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, "color">, Omit<BadgeVariants, "variant"> {
  variant?: AnyVariant;
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, color, size, placement, children, ...props }, ref) => {
    let resolvedVariant: BadgeVariants["variant"] = "soft";
    let resolvedColor: BadgeVariants["color"] = color as BadgeVariants["color"];

    if (isLegacyColor(variant)) {
      resolvedColor = mapLegacyColor(variant);
    } else if (variant) {
      resolvedVariant = variant as NonNullable<NewVariant>;
    }

    return (
      <span
        ref={ref}
        data-slot="badge"
        className={cn(
          badgeVariants({ variant: resolvedVariant, color: resolvedColor, size, placement }),
          className,
        )}
        {...props}
      >
        <span className="badge__label">{children}</span>
      </span>
    );
  },
);
Badge.displayName = "Badge";

export { Badge, badgeVariants };
export type { BadgeProps, BadgeVariants };

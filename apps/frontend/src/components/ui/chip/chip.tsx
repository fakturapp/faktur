import { forwardRef, type HTMLAttributes } from "react";

import { cn } from "@/lib/cn";
import { tv, type VariantProps } from "tailwind-variants";

const chipVariants = tv({
  base: "chip",
  defaultVariants: {
    variant: "secondary",
    color: "default",
    size: "md",
  },
  variants: {
    variant: {
      primary: "chip--primary",
      secondary: "chip--secondary",
      soft: "chip--soft",
      tertiary: "chip--tertiary",
    },
    color: {
      default: "chip--default",
      accent: "chip--accent",
      success: "chip--success",
      warning: "chip--warning",
      danger: "chip--danger",
    },
    size: {
      sm: "chip--sm",
      md: "chip--md",
      lg: "chip--lg",
    },
  },
});

type ChipVariants = VariantProps<typeof chipVariants>;

interface ChipProps extends Omit<HTMLAttributes<HTMLSpanElement>, "color">, ChipVariants {}

const Chip = forwardRef<HTMLSpanElement, ChipProps>(
  ({ className, variant, color, size, children, ...props }, ref) => (
    <span
      ref={ref}
      data-slot="chip"
      className={cn(chipVariants({ variant, color, size }), className)}
      {...props}
    >
      <span className="chip__label">{children}</span>
    </span>
  ),
);
Chip.displayName = "Chip";

export { Chip, chipVariants };
export type { ChipProps, ChipVariants };

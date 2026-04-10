import { forwardRef, type SVGAttributes } from "react";

import { cn } from "@/lib/cn";
import { tv, type VariantProps } from "tailwind-variants";

const spinnerVariants = tv({
  base: "spinner",
  defaultVariants: {
    size: "md",
    color: "current",
  },
  variants: {
    size: {
      sm: "spinner--sm",
      md: "spinner--md",
      lg: "spinner--lg",
      xl: "spinner--xl",
    },
    color: {
      current: "spinner--current",
      accent: "spinner--accent",
      success: "spinner--success",
      warning: "spinner--warning",
      danger: "spinner--danger",
    },
  },
});

type SpinnerVariants = VariantProps<typeof spinnerVariants>;

interface SpinnerProps extends Omit<SVGAttributes<SVGSVGElement>, "color">, SpinnerVariants {}

const Spinner = forwardRef<SVGSVGElement, SpinnerProps>(
  ({ className, size, color, ...props }, ref) => (
    <svg
      ref={ref}
      data-slot="spinner"
      className={cn(spinnerVariants({ size, color }), className)}
      fill="none"
      viewBox="0 0 24 24"
      role="status"
      aria-label="Chargement"
      {...props}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeOpacity="0.2"
      />
      <path
        d="M22 12a10 10 0 0 1-10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  ),
);
Spinner.displayName = "Spinner";

export { Spinner, spinnerVariants };
export type { SpinnerProps, SpinnerVariants };

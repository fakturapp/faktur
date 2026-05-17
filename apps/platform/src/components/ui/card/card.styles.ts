import { tv, type VariantProps } from "tailwind-variants";

export const cardVariants = tv({
  base: "card",
  defaultVariants: {
    size: "md",
    variant: "default",
    isInteractive: false,
  },
  variants: {
    size: {
      sm: "card--sm",
      md: "card--md",
      lg: "card--lg",
    },
    variant: {
      default: "",
      inset: "card--inset",
      flat: "card--flat",
      plain: "card--plain",
    },
    isInteractive: {
      true: "card--interactive",
    },
  },
});

export type CardVariants = VariantProps<typeof cardVariants>;

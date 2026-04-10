import { tv, type VariantProps } from "tailwind-variants";

export const switchVariants = tv({
  slots: {
    base: "switch",
    content: "switch__content",
    control: "switch__control",
    icon: "switch__icon",
    thumb: "switch__thumb",
  },
  defaultVariants: {
    size: "md",
  },
  variants: {
    size: {
      sm: { base: "switch--sm" },
      md: { base: "switch--md" },
      lg: { base: "switch--lg" },
    },
  },
});

export type SwitchVariants = VariantProps<typeof switchVariants>;

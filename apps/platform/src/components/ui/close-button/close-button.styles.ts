import { tv, type VariantProps } from "tailwind-variants";

export const closeButtonVariants = tv({
  base: "close-button",
  defaultVariants: { variant: "default" },
  variants: {
    variant: {
      default: "close-button--default",
    },
  },
});

export type CloseButtonVariants = VariantProps<typeof closeButtonVariants>;

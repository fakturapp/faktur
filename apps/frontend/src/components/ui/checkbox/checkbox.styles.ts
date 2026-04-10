import { tv, type VariantProps } from "tailwind-variants";

export const checkboxVariants = tv({
  slots: {
    base: "checkbox",
    content: "checkbox__content",
    control: "checkbox__control",
    indicator: "checkbox__indicator",
  },
  defaultVariants: {
    variant: "primary",
  },
  variants: {
    variant: {
      primary: { base: "checkbox--primary" },
      secondary: { base: "checkbox--secondary" },
    },
  },
});

export type CheckboxVariants = VariantProps<typeof checkboxVariants>;

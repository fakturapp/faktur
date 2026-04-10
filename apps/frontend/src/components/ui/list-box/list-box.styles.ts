import { tv, type VariantProps } from "tailwind-variants";

export const listboxVariants = tv({
  base: "list-box",
  defaultVariants: { variant: "default" },
  variants: {
    variant: {
      default: "list-box--default",
      danger: "list-box--danger",
    },
  },
});

export type ListBoxVariants = VariantProps<typeof listboxVariants>;

export const listboxItemVariants = tv({
  slots: {
    item: "list-box-item",
    indicator: "list-box-item__indicator",
  },
  defaultVariants: { variant: "default" },
  variants: {
    variant: {
      default: { item: "list-box-item--default" },
      danger: { item: "list-box-item--danger" },
    },
  },
});

export type ListBoxItemVariants = VariantProps<typeof listboxItemVariants>;

import { tv, type VariantProps } from "tailwind-variants";

export const menuVariants = tv({
  base: "menu",
});

export type MenuVariants = VariantProps<typeof menuVariants>;

export const menuItemVariants = tv({
  slots: {
    item: "menu-item",
    indicator: "menu-item__indicator",
    submenuIndicator: "menu-item__indicator menu-item__indicator--submenu",
  },
  defaultVariants: {
    variant: "default",
  },
  variants: {
    variant: {
      default: { item: "menu-item--default" },
      danger: { item: "menu-item--danger" },
    },
  },
});

export type MenuItemVariants = VariantProps<typeof menuItemVariants>;

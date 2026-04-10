import { tv, type VariantProps } from "tailwind-variants";

export const tabsVariants = tv({
  slots: {
    base: "tabs",
    separator: "tabs__separator",
    tab: "tabs__tab",
    tabIndicator: "tabs__indicator",
    tabList: "tabs__list",
    tabListContainer: "tabs__list-container",
    tabPanel: "tabs__panel",
  },
  defaultVariants: {
    variant: "primary",
  },
  variants: {
    variant: {
      primary: {},
      secondary: {
        base: "tabs--secondary",
      },
    },
  },
});

export type TabsVariants = Omit<
  VariantProps<typeof tabsVariants>,
  "selectedKey"
>;

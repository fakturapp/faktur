import { tv, type VariantProps } from "tailwind-variants";

export const selectVariants = tv({
  slots: {
    base: "select",
    indicator: "select__indicator",
    popover: "select__popover",
    trigger: "select__trigger",
    value: "select__value",
  },
  defaultVariants: {
    fullWidth: false,
    variant: "primary",
  },
  variants: {
    fullWidth: {
      false: {},
      true: {
        base: "select--full-width",
        trigger: "select__trigger--full-width",
      },
    },
    variant: {
      primary: { base: "select--primary" },
      secondary: { base: "select--secondary" },
    },
  },
});

export type SelectVariants = VariantProps<typeof selectVariants>;

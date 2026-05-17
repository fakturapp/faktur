"use client";

import type { ComponentPropsWithRef } from "react";
import { Separator as SeparatorPrimitive } from "react-aria-components";
import { tv, type VariantProps } from "tailwind-variants";

import { cn } from "@/lib/cn";

const separatorVariants = tv({
  base: "separator",
  defaultVariants: {
    orientation: "horizontal",
    color: "default",
  },
  variants: {
    orientation: {
      horizontal: "separator--horizontal",
      vertical: "separator--vertical",
    },
    color: {
      default: "separator--default",
      secondary: "separator--secondary",
      tertiary: "separator--tertiary",
    },
  },
});

type SeparatorVariants = VariantProps<typeof separatorVariants>;

interface SeparatorProps
  extends Omit<ComponentPropsWithRef<typeof SeparatorPrimitive>, "className">,
    SeparatorVariants {
  className?: string;
}

function Separator({
  className,
  orientation,
  color,
  ...props
}: SeparatorProps) {
  return (
    <SeparatorPrimitive
      data-slot="separator"
      orientation={orientation ?? "horizontal"}
      className={cn(separatorVariants({ orientation, color }), className)}
      {...props}
    />
  );
}

export { Separator, separatorVariants };
export type { SeparatorProps, SeparatorVariants };

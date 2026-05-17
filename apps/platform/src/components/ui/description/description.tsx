"use client";

import type { ComponentPropsWithRef } from "react";
import { Text, type TextProps } from "react-aria-components";

import {
  descriptionVariants,
  type DescriptionVariants,
} from "./description.styles";

interface DescriptionProps
  extends ComponentPropsWithRef<typeof Text>,
    TextProps,
    DescriptionVariants {}

function Description({ children, className, ...rest }: DescriptionProps) {
  return (
    <Text
      className={descriptionVariants({ className })}
      data-slot="description"
      slot="description"
      {...rest}
    >
      {children}
    </Text>
  );
}

export { Description };
export type { DescriptionProps };

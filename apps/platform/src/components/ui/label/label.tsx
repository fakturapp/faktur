"use client";

import type { ComponentPropsWithRef } from "react";
import { Label as LabelPrimitive } from "react-aria-components";

import { labelVariants, type LabelVariants } from "./label.styles";

interface LabelProps
  extends ComponentPropsWithRef<typeof LabelPrimitive>,
    LabelVariants {}

function Label({
  children,
  className,
  isDisabled,
  isInvalid,
  isRequired,
  ...rest
}: LabelProps) {
  return (
    <LabelPrimitive
      className={labelVariants({ isRequired, isDisabled, isInvalid, className })}
      data-slot="label"
      {...rest}
    >
      {children}
    </LabelPrimitive>
  );
}

export { Label };
export type { LabelProps };

"use client";

import type { ComponentPropsWithRef } from "react";
import { Input as InputPrimitive } from "react-aria-components";

import { composeTwRenderProps } from "@/lib/compose-tw-render-props";

import { inputVariants, type InputVariants } from "./input.styles";

interface InputProps
  extends ComponentPropsWithRef<typeof InputPrimitive>,
    InputVariants {}

function Input({
  className,
  fullWidth,
  variant,
  ...rest
}: InputProps) {
  return (
    <InputPrimitive
      className={composeTwRenderProps(
        className,
        inputVariants({ fullWidth, variant }),
      )}
      data-slot="input"
      {...rest}
    />
  );
}

export { Input };
export type { InputProps };

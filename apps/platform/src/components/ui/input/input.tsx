"use client";

import type { ComponentPropsWithRef } from "react";
import { useContext } from "react";
import { Input as InputPrimitive } from "react-aria-components";

import { composeTwRenderProps } from "@/lib/compose-tw-render-props";
import { TextFieldContext } from "@/components/ui/textfield";

import { inputVariants, type InputVariants } from "./input.styles";

interface InputProps
  extends ComponentPropsWithRef<typeof InputPrimitive>,
    InputVariants {}

function Input({
  className,
  fullWidth,
  variant: variantProp,
  ...rest
}: InputProps) {
  const textFieldContext = useContext(TextFieldContext);
  const variant = variantProp ?? textFieldContext.variant;

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

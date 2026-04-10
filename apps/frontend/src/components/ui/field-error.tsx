"use client";

import type { ComponentPropsWithRef } from "react";
import { FieldError as FieldErrorPrimitive } from "react-aria-components";

import { composeTwRenderProps } from "@/lib/compose-tw-render-props";

import {
  fieldErrorVariants,
  type FieldErrorVariants,
} from "./field-error.styles";

interface FieldErrorProps
  extends ComponentPropsWithRef<typeof FieldErrorPrimitive>,
    FieldErrorVariants {}

function FieldError({ children, className, ...rest }: FieldErrorProps) {
  return (
    <FieldErrorPrimitive
      data-visible
      className={composeTwRenderProps(className, fieldErrorVariants())}
      data-slot="field-error"
      {...rest}
    >
      {(renderProps) =>
        typeof children === "function" ? children(renderProps) : children
      }
    </FieldErrorPrimitive>
  );
}

export { FieldError };
export type { FieldErrorProps };

"use client";

import type { ComponentPropsWithRef } from "react";
import React, { createContext } from "react";
import { TextField as TextFieldPrimitive } from "react-aria-components";

import { composeTwRenderProps } from "@/lib/compose-tw-render-props";

import {
  textFieldVariants,
  type TextFieldVariants,
} from "./textfield.styles";

interface TextFieldContextValue {
  variant?: "primary" | "secondary";
}

export const TextFieldContext = createContext<TextFieldContextValue>({});

interface TextFieldProps
  extends ComponentPropsWithRef<typeof TextFieldPrimitive>,
    TextFieldVariants {
  
  variant?: "primary" | "secondary";
}

function TextField({
  children,
  className,
  fullWidth,
  variant,
  ...props
}: TextFieldProps) {
  const styles = React.useMemo(
    () => textFieldVariants({ fullWidth }),
    [fullWidth],
  );

  return (
    <TextFieldPrimitive
      data-slot="textfield"
      {...props}
      className={composeTwRenderProps(className, styles)}
    >
      {(values) => (
        <TextFieldContext.Provider value={{ variant }}>
          <>
            {typeof children === "function" ? children(values) : children}
          </>
        </TextFieldContext.Provider>
      )}
    </TextFieldPrimitive>
  );
}

export { TextField };
export type { TextFieldProps };

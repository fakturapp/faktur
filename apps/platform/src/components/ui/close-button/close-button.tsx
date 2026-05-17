"use client";

import type { ComponentPropsWithRef } from "react";
import { useMemo } from "react";
import { Button as ButtonPrimitive } from "react-aria-components";

import { Icon } from "@/lib/icon";
import { composeTwRenderProps } from "@/lib/compose-tw-render-props";

import {
  closeButtonVariants,
  type CloseButtonVariants,
} from "./close-button.styles";

interface CloseButtonProps
  extends ComponentPropsWithRef<typeof ButtonPrimitive>,
    CloseButtonVariants {}

function CloseButton({
  children,
  className,
  slot,
  style,
  variant,
  ...rest
}: CloseButtonProps) {
  const styles = useMemo(() => closeButtonVariants({ variant }), [variant]);

  return (
    <ButtonPrimitive
      aria-label="Fermer"
      className={composeTwRenderProps(className, styles)}
      data-slot="close-button"
      slot={slot}
      style={style}
      {...rest}
    >
      {(renderProps) =>
        typeof children === "function"
          ? children(renderProps)
          : (children ?? (
              <Icon
                icon="lucide:x"
                className="size-4"
                data-slot="close-button-icon"
              />
            ))
      }
    </ButtonPrimitive>
  );
}

export { CloseButton };
export type { CloseButtonProps };

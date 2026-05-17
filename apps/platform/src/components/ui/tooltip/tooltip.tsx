"use client";

import type {
  ComponentPropsWithRef,
  ReactElement,
  ReactNode,
} from "react";
import React, { createContext, useContext, useMemo } from "react";
import {
  Focusable as FocusablePrimitive,
  OverlayArrow,
  Tooltip as TooltipPrimitive,
  TooltipTrigger as TooltipTriggerPrimitive,
} from "react-aria-components";

import {
  composeSlotClassName,
  composeTwRenderProps,
} from "@/lib/compose-tw-render-props";

import { tooltipVariants, type TooltipVariants } from "./tooltip.styles";

type TooltipContextValue = {
  slots?: ReturnType<typeof tooltipVariants>;
};

const TooltipContext = createContext<TooltipContextValue>({});

type TooltipRootProps = ComponentPropsWithRef<typeof TooltipTriggerPrimitive>;

const TooltipRoot = ({ children, ...props }: TooltipRootProps) => {
  const slots = useMemo(() => tooltipVariants(), []);

  return (
    <TooltipContext.Provider value={{ slots }}>
      <TooltipTriggerPrimitive
        delay={400}
        closeDelay={200}
        data-slot="tooltip-root"
        {...props}
      >
        {children}
      </TooltipTriggerPrimitive>
    </TooltipContext.Provider>
  );
};

interface TooltipContentProps
  extends Omit<ComponentPropsWithRef<typeof TooltipPrimitive>, "children">,
    TooltipVariants {
  showArrow?: boolean;
  children: React.ReactNode;
}

const TooltipContent = ({
  children,
  className,
  offset: offsetProp,
  showArrow = false,
  ...props
}: TooltipContentProps) => {
  const { slots } = useContext(TooltipContext);
  const offset = offsetProp ? offsetProp : showArrow ? 7 : 3;

  return (
    <TooltipPrimitive
      {...props}
      className={composeTwRenderProps(className, slots?.base())}
      offset={offset}
    >
      {children}
    </TooltipPrimitive>
  );
};

type TooltipArrowProps = Omit<
  ComponentPropsWithRef<typeof OverlayArrow>,
  "children"
> & {
  children?: React.ReactNode;
};

const TooltipArrow = ({ children, className, ...props }: TooltipArrowProps) => {
  const defaultArrow = (
    <svg
      data-slot="overlay-arrow"
      fill="none"
      height="12"
      viewBox="0 0 12 12"
      width="12"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M0 0C5.48483 8 6.5 8 12 0Z" />
    </svg>
  );

  const arrow = React.isValidElement(children)
    ? React.cloneElement(
        children as ReactElement<{
          className?: string;
          "data-slot"?: "overlay-arrow";
        }>,
        {
          "data-slot": "overlay-arrow",
        },
      )
    : defaultArrow;

  return (
    <OverlayArrow data-slot="tooltip-arrow" {...props} className={className}>
      {arrow}
    </OverlayArrow>
  );
};

interface TooltipTriggerProps {
  children?: ReactNode;
  className?: string;
  asChild?: boolean;
}

const TooltipTrigger = ({
  children,
  className,
  asChild,
  ...props
}: TooltipTriggerProps) => {
  const { slots } = useContext(TooltipContext);

  if (asChild) {
    return (
      <FocusablePrimitive>{children as React.ReactElement<any, any>}</FocusablePrimitive>
    );
  }

  return (
    <FocusablePrimitive>
      <div
        className={composeSlotClassName(slots?.trigger, className)}
        data-slot="tooltip-trigger"
        role="button"
        {...(props as Record<string, unknown>)}
      >
        {children}
      </div>
    </FocusablePrimitive>
  );
};

interface LegacyTooltipProps {
  content: ReactNode;
  children: ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  showArrow?: boolean;
  className?: string;
  delay?: number;
}

function Tooltip({
  content,
  children,
  side = "top",
  showArrow = true,
  className,
  delay = 300,
}: LegacyTooltipProps) {
  return (
    <TooltipRoot delay={delay}>
      {children}
      <TooltipContent
        placement={side}
        showArrow={showArrow}
        className={className}
        shouldFlip={false}
      >
        {showArrow && <TooltipArrow />}
        {content}
      </TooltipContent>
    </TooltipRoot>
  );
}

export { Tooltip, TooltipRoot, TooltipTrigger, TooltipContent, TooltipArrow };

export type {
  TooltipRootProps,
  TooltipArrowProps,
  TooltipContentProps,
  TooltipTriggerProps,
  LegacyTooltipProps,
};

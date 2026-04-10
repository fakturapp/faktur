"use client";

/**
 * Tooltip — simplified from HeroUI v3
 *
 * Uses react-aria-components TooltipTrigger which auto-attaches to
 * its focusable child. Tooltip.Trigger is a transparent wrapper
 * (just passes children through) — the user puts a Button or other
 * focusable element inside.
 */

import type { ComponentPropsWithRef, ReactElement, ReactNode } from "react";
import React, { createContext, useContext, useMemo } from "react";
import {
  OverlayArrow,
  Tooltip as TooltipPrimitive,
  TooltipTrigger as TooltipTriggerPrimitive,
} from "react-aria-components";

import { composeTwRenderProps } from "@/lib/compose-tw-render-props";

import { tooltipVariants, type TooltipVariants } from "./tooltip.styles";

/* ------------------------------------------------------------------
 * Context
 * ------------------------------------------------------------------ */
interface TooltipContextValue {
  slots?: ReturnType<typeof tooltipVariants>;
}

const TooltipContext = createContext<TooltipContextValue>({});

/* ------------------------------------------------------------------
 * Root — uses TooltipTriggerPrimitive which wraps a focusable element
 * ------------------------------------------------------------------ */
type TooltipRootProps = ComponentPropsWithRef<typeof TooltipTriggerPrimitive>;

const TooltipRoot = ({ children, ...props }: TooltipRootProps) => {
  const slots = useMemo(() => tooltipVariants(), []);

  return (
    <TooltipContext.Provider value={{ slots }}>
      <TooltipTriggerPrimitive delay={400} closeDelay={200} {...props}>
        {children}
      </TooltipTriggerPrimitive>
    </TooltipContext.Provider>
  );
};

/* ------------------------------------------------------------------
 * Trigger — transparent pass-through wrapper
 *
 * react-aria-components' TooltipTrigger auto-attaches to the first
 * focusable child. We don't need to wrap anything — just render
 * the children as-is so they get the correct parent context.
 * ------------------------------------------------------------------ */
interface TooltipTriggerProps {
  children: ReactNode;
}

const TooltipTrigger = ({ children }: TooltipTriggerProps) => {
  return <>{children}</>;
};

/* ------------------------------------------------------------------
 * Content
 * ------------------------------------------------------------------ */
interface TooltipContentProps
  extends Omit<ComponentPropsWithRef<typeof TooltipPrimitive>, "children">,
    TooltipVariants {
  showArrow?: boolean;
  children: ReactNode;
}

const TooltipContent = ({
  children,
  className,
  offset: offsetProp,
  showArrow = false,
  ...props
}: TooltipContentProps) => {
  const { slots } = useContext(TooltipContext);
  const offset = offsetProp ? offsetProp : showArrow ? 7 : 4;

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

/* ------------------------------------------------------------------
 * Arrow
 * ------------------------------------------------------------------ */
type TooltipArrowProps = Omit<
  ComponentPropsWithRef<typeof OverlayArrow>,
  "children"
> & {
  children?: ReactNode;
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
    ? React.cloneElement(children as ReactElement<{ "data-slot"?: string }>, {
        "data-slot": "overlay-arrow",
      })
    : defaultArrow;

  return (
    <OverlayArrow data-slot="tooltip-arrow" {...props} className={className}>
      {arrow}
    </OverlayArrow>
  );
};

/* Legacy Tooltip — simple wrapper for backward compatibility */
interface LegacyTooltipProps {
  content: string;
  children: ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
}

function Tooltip({ content, children, side, className }: LegacyTooltipProps) {
  return (
    <TooltipRoot delay={300}>
      <TooltipTrigger>{children}</TooltipTrigger>
      <TooltipContent placement={side} className={className}>
        {content}
      </TooltipContent>
    </TooltipRoot>
  );
}

export { Tooltip, TooltipRoot, TooltipTrigger, TooltipContent, TooltipArrow };
export type {
  TooltipRootProps,
  TooltipTriggerProps,
  TooltipContentProps,
  TooltipArrowProps,
  LegacyTooltipProps,
};

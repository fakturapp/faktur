"use client";

/**
 * Popover — copied from HeroUI v3 (simplified, SurfaceContext removed)
 * Source: heroui/packages/react/src/components/popover/popover.tsx
 */

import type { ComponentPropsWithRef, ReactNode } from "react";
import React, { createContext, useContext, useMemo } from "react";
import {
  Dialog as DialogPrimitive,
  Heading as HeadingPrimitive,
  OverlayArrow,
  Popover as PopoverPrimitive,
  DialogTrigger as PopoverTriggerPrimitive,
  Pressable as PressablePrimitive,
} from "react-aria-components";

import {
  composeSlotClassName,
  composeTwRenderProps,
} from "@/lib/compose-tw-render-props";

import { popoverVariants, type PopoverVariants } from "./popover.styles";

/* ------------------------------------------------------------------
 * Context
 * ------------------------------------------------------------------ */
interface PopoverContextValue {
  slots?: ReturnType<typeof popoverVariants>;
}

const PopoverContext = createContext<PopoverContextValue>({});

/* ------------------------------------------------------------------
 * Root
 * ------------------------------------------------------------------ */
type PopoverRootProps = ComponentPropsWithRef<typeof PopoverTriggerPrimitive>;

const PopoverRoot = ({ children, ...props }: PopoverRootProps) => {
  const slots = useMemo(() => popoverVariants(), []);

  return (
    <PopoverContext.Provider value={{ slots }}>
      <PopoverTriggerPrimitive data-slot="popover-root" {...props}>
        {children}
      </PopoverTriggerPrimitive>
    </PopoverContext.Provider>
  );
};

/* ------------------------------------------------------------------
 * Content (the floating panel)
 * ------------------------------------------------------------------ */
interface PopoverContentProps
  extends Omit<ComponentPropsWithRef<typeof PopoverPrimitive>, "children">,
    PopoverVariants {
  children: ReactNode;
}

const PopoverContent = ({
  children,
  className,
  ...props
}: PopoverContentProps) => {
  const { slots } = useContext(PopoverContext);

  return (
    <PopoverPrimitive
      {...props}
      className={composeTwRenderProps(className, slots?.base())}
    >
      {children}
    </PopoverPrimitive>
  );
};

/* ------------------------------------------------------------------
 * Dialog (inner a11y wrapper)
 * ------------------------------------------------------------------ */
interface PopoverDialogProps
  extends Omit<ComponentPropsWithRef<typeof DialogPrimitive>, "children"> {
  children: ReactNode;
}

const PopoverDialog = ({
  children,
  className,
  ...props
}: PopoverDialogProps) => {
  const { slots } = useContext(PopoverContext);

  return (
    <DialogPrimitive
      data-slot="popover-dialog"
      {...props}
      className={composeSlotClassName(slots?.dialog, className)}
    >
      {children}
    </DialogPrimitive>
  );
};

/* ------------------------------------------------------------------
 * Trigger
 * ------------------------------------------------------------------ */
type PopoverTriggerProps = ComponentPropsWithRef<"div">;

const PopoverTrigger = ({
  children,
  className,
  ...props
}: PopoverTriggerProps) => {
  const { slots } = useContext(PopoverContext);

  return (
    <PressablePrimitive>
      <div
        className={composeSlotClassName(slots?.trigger, className)}
        data-slot="popover-trigger"
        role="button"
        {...props}
      >
        {children}
      </div>
    </PressablePrimitive>
  );
};

/* ------------------------------------------------------------------
 * Heading
 * ------------------------------------------------------------------ */
type PopoverHeadingProps = ComponentPropsWithRef<typeof HeadingPrimitive>;

const PopoverHeading = ({
  children,
  className,
  ...props
}: PopoverHeadingProps) => {
  const { slots } = useContext(PopoverContext);

  return (
    <HeadingPrimitive
      slot="title"
      {...props}
      className={composeSlotClassName(slots?.heading, className)}
    >
      {children}
    </HeadingPrimitive>
  );
};

/* ------------------------------------------------------------------
 * Arrow (optional)
 * ------------------------------------------------------------------ */
type PopoverArrowProps = Omit<
  ComponentPropsWithRef<typeof OverlayArrow>,
  "children"
> & {
  children?: ReactNode;
};

const PopoverArrow = ({ children, className, ...props }: PopoverArrowProps) => {
  const defaultArrow = (
    <svg
      data-slot="popover-overlay-arrow"
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
        children as React.ReactElement<{
          className?: string;
          "data-slot"?: "popover-overlay-arrow";
        }>,
        { "data-slot": "popover-overlay-arrow" },
      )
    : defaultArrow;

  return (
    <OverlayArrow
      data-slot="popover-overlay-arrow-group"
      {...props}
      className={className}
    >
      {arrow}
    </OverlayArrow>
  );
};

export {
  PopoverRoot,
  PopoverTrigger,
  PopoverContent,
  PopoverDialog,
  PopoverHeading,
  PopoverArrow,
};
export type {
  PopoverRootProps,
  PopoverTriggerProps,
  PopoverContentProps,
  PopoverDialogProps,
  PopoverHeadingProps,
  PopoverArrowProps,
};

"use client";

/**
 * Checkbox — copied from HeroUI v3 (simplified — CheckboxGroup dep removed)
 * Source: heroui/packages/react/src/components/checkbox/checkbox.tsx
 *
 * Compound: Checkbox (root) + Checkbox.Control (the square box)
 *           + Checkbox.Indicator (SVG or custom) + Checkbox.Content
 */

import type {
  ComponentPropsWithRef,
  ReactNode,
} from "react";
import React, { createContext, useContext, useMemo } from "react";
import type { CheckboxRenderProps } from "react-aria-components";
import { Checkbox as CheckboxPrimitive } from "react-aria-components";

import {
  composeSlotClassName,
  composeTwRenderProps,
} from "@/lib/compose-tw-render-props";

import { checkboxVariants, type CheckboxVariants } from "./checkbox.styles";

/* ------------------------------------------------------------------
 * Context
 * ------------------------------------------------------------------ */
interface CheckboxContextValue {
  slots?: ReturnType<typeof checkboxVariants>;
  state?: CheckboxRenderProps;
}

const CheckboxContext = createContext<CheckboxContextValue>({});

/* ------------------------------------------------------------------
 * Root
 * ------------------------------------------------------------------ */
interface CheckboxRootProps
  extends ComponentPropsWithRef<typeof CheckboxPrimitive>,
    CheckboxVariants {
  /** Form name (used when submitting an HTML form). */
  name?: string;
}

const CheckboxRoot = ({
  children,
  className,
  variant,
  ...props
}: CheckboxRootProps) => {
  const slots = useMemo(() => checkboxVariants({ variant }), [variant]);

  return (
    <CheckboxPrimitive
      data-slot="checkbox"
      {...props}
      className={composeTwRenderProps(className, slots.base())}
    >
      {(values) => (
        <CheckboxContext.Provider value={{ slots, state: values }}>
          {typeof children === "function" ? children(values) : children}
        </CheckboxContext.Provider>
      )}
    </CheckboxPrimitive>
  );
};

/* ------------------------------------------------------------------
 * Control (the square box)
 * ------------------------------------------------------------------ */
interface CheckboxControlProps extends ComponentPropsWithRef<"span"> {}

const CheckboxControl = ({
  children,
  className,
  ...props
}: CheckboxControlProps) => {
  const { slots } = useContext(CheckboxContext);

  return (
    <span
      className={composeSlotClassName(slots?.control, className)}
      data-slot="checkbox-control"
      {...props}
    >
      {children}
    </span>
  );
};

/* ------------------------------------------------------------------
 * Indicator (default checkmark / indeterminate line / custom)
 * ------------------------------------------------------------------ */
interface CheckboxIndicatorProps
  extends Omit<ComponentPropsWithRef<"span">, "children"> {
  children?: ReactNode | ((props: CheckboxRenderProps) => ReactNode);
}

const CheckboxIndicator = ({
  children,
  className,
  ...props
}: CheckboxIndicatorProps) => {
  const { slots, state } = useContext(CheckboxContext);

  const isSelected = state?.isSelected;
  const isIndeterminate = state?.isIndeterminate;

  const content =
    typeof children === "function" ? (
      children(state ?? ({} as CheckboxRenderProps))
    ) : children ? (
      children
    ) : isIndeterminate ? (
      <svg
        aria-hidden="true"
        data-slot="checkbox-default-indicator--indeterminate"
        fill="none"
        role="presentation"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth={3}
        viewBox="0 0 24 24"
      >
        <line x1="21" x2="3" y1="12" y2="12" />
      </svg>
    ) : (
      <svg
        aria-hidden="true"
        data-slot="checkbox-default-indicator--checkmark"
        fill="none"
        role="presentation"
        stroke="currentColor"
        strokeDasharray={22}
        strokeDashoffset={isSelected ? 44 : 66}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        viewBox="0 0 17 18"
      >
        <polyline points="1 9 7 14 15 4" />
      </svg>
    );

  return (
    <span
      aria-hidden="true"
      className={composeSlotClassName(slots?.indicator, className)}
      data-slot="checkbox-indicator"
      {...props}
    >
      {content}
    </span>
  );
};

/* ------------------------------------------------------------------
 * Content (label + description wrapper)
 * ------------------------------------------------------------------ */
interface CheckboxContentProps extends ComponentPropsWithRef<"div"> {}

const CheckboxContent = ({
  children,
  className,
  ...props
}: CheckboxContentProps) => {
  const { slots } = useContext(CheckboxContext);

  return (
    <div
      className={composeSlotClassName(slots?.content, className)}
      data-slot="checkbox-content"
      {...props}
    >
      {children}
    </div>
  );
};

export { CheckboxRoot, CheckboxControl, CheckboxIndicator, CheckboxContent };
export type {
  CheckboxRootProps,
  CheckboxControlProps,
  CheckboxIndicatorProps,
  CheckboxContentProps,
};

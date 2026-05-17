"use client";

/**
 * Switch — copied from HeroUI v3
 * Source: heroui/packages/react/src/components/switch/switch.tsx
 *
 * Compound: Switch (root) + Switch.Control (track) + Switch.Thumb
 *           + Switch.Icon + Switch.Content
 */

import type { ComponentPropsWithRef } from "react";
import React, { createContext, useContext, useMemo } from "react";
import { Switch as SwitchPrimitive } from "react-aria-components";

import { cn } from "@/lib/utils";
import {
  composeSlotClassName,
  composeTwRenderProps,
} from "@/lib/compose-tw-render-props";

import { switchVariants, type SwitchVariants } from "./switch.styles";

/* ------------------------------------------------------------------
 * Context
 * ------------------------------------------------------------------ */
interface SwitchContextValue {
  slots?: ReturnType<typeof switchVariants>;
}

const SwitchContext = createContext<SwitchContextValue>({});

/* ------------------------------------------------------------------
 * Root
 * ------------------------------------------------------------------ */
interface SwitchRootProps
  extends ComponentPropsWithRef<typeof SwitchPrimitive>,
    SwitchVariants {}

const SwitchRoot = ({ children, className, size, ...props }: SwitchRootProps) => {
  const slots = useMemo(() => switchVariants({ size }), [size]);

  return (
    <SwitchContext.Provider value={{ slots }}>
      <SwitchPrimitive
        data-slot="switch"
        {...props}
        className={composeTwRenderProps(className, slots.base())}
      >
        {(values) => (
          <>{typeof children === "function" ? children(values) : children}</>
        )}
      </SwitchPrimitive>
    </SwitchContext.Provider>
  );
};

/* ------------------------------------------------------------------
 * Sub-elements
 * ------------------------------------------------------------------ */
const SwitchControl = ({
  children,
  className,
  ...props
}: ComponentPropsWithRef<"span">) => {
  const { slots } = useContext(SwitchContext);
  return (
    <span
      className={composeSlotClassName(slots?.control, className)}
      data-slot="switch-control"
      {...props}
    >
      {children}
    </span>
  );
};

const SwitchThumb = ({
  children,
  className,
  ...props
}: ComponentPropsWithRef<"span">) => {
  const { slots } = useContext(SwitchContext);
  return (
    <span
      className={composeSlotClassName(slots?.thumb, className)}
      data-slot="switch-thumb"
      {...props}
    >
      {children}
    </span>
  );
};

const SwitchIcon = ({
  children,
  className,
  ...props
}: ComponentPropsWithRef<"span">) => {
  const { slots } = useContext(SwitchContext);
  return (
    <span
      className={composeSlotClassName(slots?.icon, className)}
      data-slot="switch-icon"
      {...props}
    >
      {children}
    </span>
  );
};

const SwitchContent = ({
  children,
  className,
  ...props
}: ComponentPropsWithRef<"div">) => {
  const { slots } = useContext(SwitchContext);
  return (
    <div
      className={composeSlotClassName(slots?.content, className)}
      data-slot="switch-content"
      {...props}
    >
      {children}
    </div>
  );
};

/* Legacy Switch — simple toggle for backward compatibility */
interface LegacySwitchProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  className?: string;
}

function Switch({ checked, onChange, disabled, className }: LegacySwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "switch__control",
        checked && "switch__control--selected",
        disabled && "switch__control--disabled",
        className,
      )}
      data-slot="switch"
      data-selected={checked || undefined}
    >
      <span className="switch__thumb" />
    </button>
  );
}

export { Switch, SwitchRoot, SwitchControl, SwitchThumb, SwitchIcon, SwitchContent };
export type { SwitchRootProps, LegacySwitchProps };

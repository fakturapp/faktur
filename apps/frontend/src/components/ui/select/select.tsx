"use client";

/**
 * Select — copied from HeroUI v3 (simplified — SurfaceContext dropped)
 * Source: heroui/packages/react/src/components/select/select.tsx
 *
 * Uses react-aria-components Select primitive with Popover + ListBox internally.
 * Compound API:
 *   <Select>
 *     <Label>Country</Label>
 *     <Select.Trigger>
 *       <Select.Value />
 *       <Select.Indicator />
 *     </Select.Trigger>
 *     <Select.Popover>
 *       <ListBox>
 *         <ListBoxItem>...</ListBoxItem>
 *       </ListBox>
 *     </Select.Popover>
 *   </Select>
 */

import type { ComponentPropsWithRef, ReactElement, ReactNode } from "react";
import React, { createContext, useContext, useMemo } from "react";
import {
  Button as ButtonPrimitive,
  Popover as PopoverPrimitive,
  Select as SelectPrimitive,
  SelectStateContext,
  SelectValue as SelectValuePrimitive,
} from "react-aria-components";

import { Icon } from "@/lib/icon";
import {
  composeSlotClassName,
  composeTwRenderProps,
} from "@/lib/compose-tw-render-props";

import { selectVariants, type SelectVariants } from "./select.styles";

/* ------------------------------------------------------------------
 * Context
 * ------------------------------------------------------------------ */
interface SelectContextValue {
  slots?: ReturnType<typeof selectVariants>;
}

const SelectContext = createContext<SelectContextValue>({});

/* ------------------------------------------------------------------
 * Root
 * ------------------------------------------------------------------ */
interface SelectRootProps<T extends object>
  extends Omit<ComponentPropsWithRef<typeof SelectPrimitive<T>>, "items">,
    SelectVariants {
  items?: Iterable<T>;
}

function SelectRoot<T extends object>({
  children,
  className,
  fullWidth,
  variant,
  ...props
}: SelectRootProps<T>) {
  const slots = useMemo(
    () => selectVariants({ fullWidth, variant }),
    [fullWidth, variant],
  );

  return (
    <SelectContext.Provider value={{ slots }}>
      <SelectPrimitive
        data-slot="select"
        {...props}
        className={composeTwRenderProps(className, slots?.base())}
      >
        {(values) => (
          <>{typeof children === "function" ? children(values) : children}</>
        )}
      </SelectPrimitive>
    </SelectContext.Provider>
  );
}

/* ------------------------------------------------------------------
 * Trigger
 * ------------------------------------------------------------------ */
interface SelectTriggerProps
  extends ComponentPropsWithRef<typeof ButtonPrimitive> {}

const SelectTrigger = ({
  children,
  className,
  ...props
}: SelectTriggerProps) => {
  const { slots } = useContext(SelectContext);

  return (
    <ButtonPrimitive
      className={composeTwRenderProps(className, slots?.trigger())}
      data-slot="select-trigger"
      {...props}
    >
      {(values) => (
        <>{typeof children === "function" ? children(values) : children}</>
      )}
    </ButtonPrimitive>
  );
};

/* ------------------------------------------------------------------
 * Value
 * ------------------------------------------------------------------ */
interface SelectValueProps
  extends ComponentPropsWithRef<typeof SelectValuePrimitive> {}

const SelectValue = ({ children, className, ...props }: SelectValueProps) => {
  const { slots } = useContext(SelectContext);

  return (
    <SelectValuePrimitive
      className={composeTwRenderProps(className, slots?.value())}
      data-slot="select-value"
      {...props}
    >
      {children}
    </SelectValuePrimitive>
  );
};

/* ------------------------------------------------------------------
 * Indicator (chevron-down)
 * ------------------------------------------------------------------ */
interface SelectIndicatorProps extends ComponentPropsWithRef<"svg"> {
  className?: string;
}

const SelectIndicator = ({
  children,
  className,
  ...props
}: SelectIndicatorProps) => {
  const { slots } = useContext(SelectContext);
  const state = useContext(SelectStateContext);
  const isOpen = state?.isOpen ? "true" : undefined;

  if (children && React.isValidElement(children)) {
    return React.cloneElement(children as ReactElement<Record<string, unknown>>, {
      ...props,
      className: composeSlotClassName(slots?.indicator, className),
      "data-slot": "select-indicator",
      "data-open": isOpen,
    });
  }

  return (
    <Icon
      icon="lucide:chevron-down"
      className={composeSlotClassName(slots?.indicator, className)}
      data-open={isOpen}
      data-slot="select-default-indicator"
      {...props}
    />
  );
};

/* ------------------------------------------------------------------
 * Popover
 * ------------------------------------------------------------------ */
interface SelectPopoverProps
  extends Omit<ComponentPropsWithRef<typeof PopoverPrimitive>, "children"> {
  children: ReactNode;
}

const SelectPopover = ({
  children,
  className,
  placement = "bottom",
  ...props
}: SelectPopoverProps) => {
  const { slots } = useContext(SelectContext);

  return (
    <PopoverPrimitive
      {...props}
      className={composeTwRenderProps(className, slots?.popover())}
      placement={placement}
    >
      {children}
    </PopoverPrimitive>
  );
};

/* Legacy Select — native <select> wrapper for backward compatibility */
const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={className ?? "input w-full"}
      data-slot="select-native"
      {...props}
    >
      {children}
    </select>
  ),
);
Select.displayName = "Select";

export {
  Select,
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectIndicator,
  SelectPopover,
};
export type {
  SelectRootProps,
  SelectTriggerProps,
  SelectValueProps,
  SelectIndicatorProps,
  SelectPopoverProps,
};

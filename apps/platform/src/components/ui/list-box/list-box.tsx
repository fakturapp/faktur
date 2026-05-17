"use client";

/**
 * ListBox + ListBoxItem — copied from HeroUI v3
 * Source: heroui/packages/react/src/components/list-box/
 *         heroui/packages/react/src/components/list-box-item/
 *
 * Used both standalone and inside Select's popover.
 */

import type { ComponentPropsWithRef, ReactNode } from "react";
import React, { createContext, useContext, useMemo } from "react";
import type { ListBoxItemRenderProps } from "react-aria-components";
import {
  ListBox as ListBoxPrimitive,
  ListBoxItem as ListBoxItemPrimitive,
} from "react-aria-components";

import {
  composeSlotClassName,
  composeTwRenderProps,
} from "@/lib/compose-tw-render-props";

import {
  listboxVariants,
  listboxItemVariants,
  type ListBoxVariants,
  type ListBoxItemVariants,
} from "./list-box.styles";

/* ------------------------------------------------------------------
 * ListBox Root
 * ------------------------------------------------------------------ */
interface ListBoxRootProps<T extends object>
  extends ComponentPropsWithRef<typeof ListBoxPrimitive<T>>,
    ListBoxVariants {
  className?: string;
}

function ListBoxRoot<T extends object>({
  className,
  variant,
  ...props
}: ListBoxRootProps<T>) {
  const styles = useMemo(() => listboxVariants({ variant }), [variant]);

  return (
    <ListBoxPrimitive
      className={composeTwRenderProps(className, styles)}
      data-slot="list-box"
      {...props}
    />
  );
}

/* ------------------------------------------------------------------
 * ListBox Item Context
 * ------------------------------------------------------------------ */
interface ListBoxItemContextValue {
  slots?: ReturnType<typeof listboxItemVariants>;
  state?: ListBoxItemRenderProps;
}

const ListBoxItemContext = createContext<ListBoxItemContextValue>({});

/* ------------------------------------------------------------------
 * ListBox Item Root
 * ------------------------------------------------------------------ */
interface ListBoxItemRootProps
  extends ComponentPropsWithRef<typeof ListBoxItemPrimitive>,
    ListBoxItemVariants {
  className?: string;
}

const ListBoxItemRoot = ({
  children,
  className,
  variant,
  ...props
}: ListBoxItemRootProps) => {
  const slots = useMemo(() => listboxItemVariants({ variant }), [variant]);

  return (
    <ListBoxItemPrimitive
      className={composeTwRenderProps(className, slots.item())}
      data-slot="list-box-item"
      {...props}
    >
      {(values) => (
        <ListBoxItemContext.Provider value={{ slots, state: values }}>
          {typeof children === "function" ? children(values) : children}
          <AutoIndicator />
        </ListBoxItemContext.Provider>
      )}
    </ListBoxItemPrimitive>
  );
};

/* Auto-render indicator inside every list box item */
const AutoIndicator = () => {
  const { slots, state } = useContext(ListBoxItemContext);
  const isSelected = state?.isSelected;

  return (
    <span
      aria-hidden="true"
      className={composeSlotClassName(slots?.indicator)}
      data-slot="list-box-item-indicator"
      data-visible={isSelected || undefined}
    >
      <svg
        aria-hidden="true"
        data-slot="list-box-item-indicator--checkmark"
        fill="none"
        role="presentation"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        viewBox="0 0 17 18"
        style={{
          strokeDasharray: 22,
          strokeDashoffset: isSelected ? 44 : 66,
          transition: 'stroke-dashoffset 250ms linear',
        }}
      >
        <polyline points="1 9 7 14 15 4" />
      </svg>
    </span>
  );
};

/* ------------------------------------------------------------------
 * ListBox Item Indicator
 * ------------------------------------------------------------------ */
interface ListBoxItemIndicatorProps
  extends Omit<ComponentPropsWithRef<"span">, "children"> {
  children?: ReactNode | ((props: ListBoxItemRenderProps) => ReactNode);
}

const ListBoxItemIndicator = ({
  children,
  className,
  ...props
}: ListBoxItemIndicatorProps) => {
  const { slots, state } = useContext(ListBoxItemContext);
  const isSelected = state?.isSelected;

  const content =
    typeof children === "function" ? (
      children(state ?? ({} as ListBoxItemRenderProps))
    ) : children ? (
      children
    ) : (
      <svg
        aria-hidden="true"
        data-slot="list-box-item-indicator--checkmark"
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
      data-slot="list-box-item-indicator"
      data-visible={isSelected || undefined}
      {...props}
    >
      {content}
    </span>
  );
};

export { ListBoxRoot, ListBoxItemRoot, ListBoxItemIndicator };
export type {
  ListBoxRootProps,
  ListBoxItemRootProps,
  ListBoxItemIndicatorProps,
};

"use client";

/**
 * Menu + MenuItem — copied from HeroUI v3 (simplified)
 * Source: heroui/packages/react/src/components/menu/
 *         heroui/packages/react/src/components/menu-item/
 *
 * Usage (inside a Popover or as a standalone dropdown):
 *   <Menu>
 *     <MenuItem>
 *       <Label>Item label</Label>
 *     </MenuItem>
 *     <MenuItem variant="danger">
 *       <Label>Delete</Label>
 *     </MenuItem>
 *   </Menu>
 */

import type { ComponentPropsWithRef, ReactNode } from "react";
import React, { createContext, useContext, useMemo } from "react";
import type { MenuItemRenderProps } from "react-aria-components";
import {
  Menu as MenuPrimitive,
  MenuItem as MenuItemPrimitive,
  MenuSection as MenuSectionPrimitive,
} from "react-aria-components";

import { Icon } from "@/lib/icon";
import {
  composeSlotClassName,
  composeTwRenderProps,
} from "@/lib/compose-tw-render-props";

import {
  menuVariants,
  menuItemVariants,
  type MenuVariants,
  type MenuItemVariants,
} from "./menu.styles";

/* ------------------------------------------------------------------
 * Menu Root
 * ------------------------------------------------------------------ */
interface MenuRootProps<T extends object>
  extends ComponentPropsWithRef<typeof MenuPrimitive<T>>,
    MenuVariants {
  className?: string;
}

function MenuRoot<T extends object>({
  className,
  ...props
}: MenuRootProps<T>) {
  const styles = useMemo(() => menuVariants(), []);

  return (
    <MenuPrimitive
      className={composeTwRenderProps(className, styles)}
      data-slot="menu"
      {...props}
    />
  );
}

/* ------------------------------------------------------------------
 * Menu Section
 * ------------------------------------------------------------------ */
interface MenuSectionProps<T extends object>
  extends ComponentPropsWithRef<typeof MenuSectionPrimitive<T>> {}

function MenuSection<T extends object>({
  className,
  ...props
}: MenuSectionProps<T>) {
  return (
    <MenuSectionPrimitive
      className={composeTwRenderProps(className, "menu-section") as string}
      data-slot="menu-section"
      {...props}
    />
  );
}

/* ------------------------------------------------------------------
 * Menu Item Context
 * ------------------------------------------------------------------ */
interface MenuItemContextValue {
  slots?: ReturnType<typeof menuItemVariants>;
  state?: MenuItemRenderProps;
}

const MenuItemContext = createContext<MenuItemContextValue>({});

/* ------------------------------------------------------------------
 * Menu Item Root
 * ------------------------------------------------------------------ */
interface MenuItemRootProps
  extends ComponentPropsWithRef<typeof MenuItemPrimitive>,
    MenuItemVariants {
  className?: string;
}

const MenuItemRoot = ({
  children,
  className,
  variant,
  ...props
}: MenuItemRootProps) => {
  const slots = useMemo(() => menuItemVariants({ variant }), [variant]);

  return (
    <MenuItemPrimitive
      className={composeTwRenderProps(className, slots.item())}
      data-slot="menu-item"
      {...props}
    >
      {(values) => (
        <MenuItemContext.Provider value={{ slots, state: values }}>
          {typeof children === "function" ? children(values) : children}
        </MenuItemContext.Provider>
      )}
    </MenuItemPrimitive>
  );
};

/* ------------------------------------------------------------------
 * Menu Item Indicator
 * ------------------------------------------------------------------ */
interface MenuItemIndicatorProps
  extends Omit<ComponentPropsWithRef<"span">, "children"> {
  children?: ReactNode | ((props: MenuItemRenderProps) => ReactNode);
  type?: "checkmark" | "dot";
}

const MenuItemIndicator = ({
  children,
  className,
  type = "checkmark",
  ...props
}: MenuItemIndicatorProps) => {
  const { slots, state } = useContext(MenuItemContext);
  const isSelected = state?.isSelected;

  const content =
    typeof children === "function" ? (
      children(state ?? ({} as MenuItemRenderProps))
    ) : children ? (
      children
    ) : type === "dot" ? (
      <svg
        aria-hidden="true"
        data-slot="menu-item-indicator--dot"
        fill="currentColor"
        fillRule="evenodd"
        role="presentation"
        viewBox="0 0 16 16"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          clipRule="evenodd"
          d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14"
          fillRule="evenodd"
        />
      </svg>
    ) : (
      <svg
        aria-hidden="true"
        data-slot="menu-item-indicator--checkmark"
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
      data-slot="menu-item-indicator"
      data-type={type}
      data-visible={isSelected || undefined}
      {...props}
    >
      {content}
    </span>
  );
};

/* ------------------------------------------------------------------
 * Menu Item Submenu Indicator
 * ------------------------------------------------------------------ */
interface MenuItemSubmenuIndicatorProps
  extends Omit<ComponentPropsWithRef<"span">, "children"> {
  children?: ReactNode;
}

const MenuItemSubmenuIndicator = ({
  children,
  className,
  ...props
}: MenuItemSubmenuIndicatorProps) => {
  const { slots, state } = useContext(MenuItemContext);
  const hasSubmenu = state?.hasSubmenu;

  if (!hasSubmenu) {
    return null;
  }

  const content = children ?? <Icon icon="lucide:chevron-right" />;

  return (
    <span
      aria-hidden="true"
      className={composeSlotClassName(slots?.submenuIndicator, className)}
      data-slot="submenu-indicator"
      {...props}
    >
      {content}
    </span>
  );
};

export {
  MenuRoot,
  MenuSection,
  MenuItemRoot,
  MenuItemIndicator,
  MenuItemSubmenuIndicator,
};
export type {
  MenuRootProps,
  MenuSectionProps,
  MenuItemRootProps,
  MenuItemIndicatorProps,
  MenuItemSubmenuIndicatorProps,
};

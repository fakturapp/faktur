"use client";

/**
 * Composes a className (string or render-prop function) with a
 * Tailwind class expression, mirroring HeroUI v3's utility in
 * `heroui/packages/react/src/utils/compose.ts`.
 *
 * Used by every HeroUI component we port — allows end-user
 * `className` to merge with internal variant classes while still
 * receiving react-aria render-prop arguments (pressed, hovered, ...).
 */

import { composeRenderProps } from "react-aria-components";
import { cx } from "tailwind-variants";

export function composeTwRenderProps<T>(
  className: string | ((v: T) => string) | undefined,
  tailwind?: string | ((v: T) => string | undefined),
): string | ((v: T) => string) {
  return composeRenderProps(className, (className, renderProps): string => {
    const tw =
      typeof tailwind === "function" ? (tailwind(renderProps) ?? "") : (tailwind ?? "");
    const cls = className ?? "";

    return cx(tw, cls) ?? "";
  });
}

export function composeSlotClassName(
  slotFn:
    | ((args?: { className?: string; [key: string]: unknown }) => string)
    | undefined,
  className?: string,
  variants?: Record<string, unknown>,
): string | undefined {
  return typeof slotFn === "function"
    ? slotFn({ ...(variants ?? {}), className })
    : className;
}

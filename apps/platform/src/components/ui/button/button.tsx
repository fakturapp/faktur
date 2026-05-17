"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type LegacyVariant = "default" | "outline" | "destructive" | "ghost" | "link";
type NewVariant = "primary" | "secondary" | "tertiary" | "danger" | "danger-soft";
type ButtonVariant = LegacyVariant | NewVariant;
type ButtonSize = "default" | "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  isIconOnly?: boolean;
}

function variantClass(v?: ButtonVariant): string {
  switch (v) {
    case "destructive": return "button--danger";
    case "link": return "button--tertiary";
    case "secondary": return "button--secondary";
    case "tertiary": return "button--tertiary";
    case "danger": return "button--danger";
    case "danger-soft": return "button--danger-soft";
    case "ghost": return "button--ghost";
    case "outline": return "button--outline";
    case "primary":
    case "default":
    default: return "button--primary";
  }
}

function sizeClass(s?: ButtonSize): string {
  switch (s) {
    case "sm": return "button--sm";
    case "lg": return "button--lg";
    case "icon": return "button--icon-only";
    case "md":
    case "default":
    default: return "button--md";
  }
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, isIconOnly, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "button",
        variantClass(variant),
        sizeClass(size),
        fullWidth && "button--full-width",
        isIconOnly && "button--icon-only",
        className
      )}
      {...props}
    />
  )
);
Button.displayName = "Button";

export const buttonVariants = ({ variant, size }: { variant?: ButtonVariant; size?: ButtonSize } = {}) =>
  cn("button", variantClass(variant), sizeClass(size));

export { Button };

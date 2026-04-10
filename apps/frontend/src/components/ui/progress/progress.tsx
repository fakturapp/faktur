"use client";

import { forwardRef, type HTMLAttributes } from "react";
import { tv, type VariantProps } from "tailwind-variants";

import { cn } from "@/lib/cn";

const progressBarVariants = tv({
  base: "progress-bar",
  defaultVariants: {
    size: "md",
    color: "accent",
  },
  variants: {
    size: {
      sm: "progress-bar--sm",
      md: "progress-bar--md",
      lg: "progress-bar--lg",
    },
    color: {
      default: "progress-bar--default",
      accent: "progress-bar--accent",
      success: "progress-bar--success",
      warning: "progress-bar--warning",
      danger: "progress-bar--danger",
    },
  },
});

type ProgressBarVariants = VariantProps<typeof progressBarVariants>;

interface ProgressBarProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "color">,
    ProgressBarVariants {
  
  value?: number;
  
  minValue?: number;
  
  maxValue?: number;
  
  label?: string;
  
  showOutput?: boolean;
  
  isIndeterminate?: boolean;
}

const ProgressBar = forwardRef<HTMLDivElement, ProgressBarProps>(
  (
    {
      className,
      value = 0,
      minValue = 0,
      maxValue = 100,
      label,
      showOutput = true,
      isIndeterminate,
      size,
      color,
      "aria-label": ariaLabel,
      ...props
    },
    ref,
  ) => {
    const percentage = isIndeterminate
      ? 0
      : Math.max(
          0,
          Math.min(
            100,
            Math.round(
              ((value - minValue) / (maxValue - minValue)) * 100,
            ),
          ),
        );

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-label={ariaLabel ?? label}
        aria-valuenow={isIndeterminate ? undefined : percentage}
        aria-valuemin={minValue}
        aria-valuemax={maxValue}
        data-indeterminate={isIndeterminate || undefined}
        data-slot="progress-bar"
        className={cn(progressBarVariants({ size, color }), className)}
        {...props}
      >
        {(label || (showOutput && !isIndeterminate)) && (
          <div className="progress-bar__header">
            {label && (
              <span className="progress-bar__label">{label}</span>
            )}
            {showOutput && !isIndeterminate && (
              <span className="progress-bar__output">{percentage}%</span>
            )}
          </div>
        )}
        <div className="progress-bar__track" data-slot="progress-bar-track">
          <div
            className="progress-bar__fill"
            data-slot="progress-bar-fill"
            style={{
              width: isIndeterminate ? undefined : `${percentage}%`,
            }}
          />
        </div>
      </div>
    );
  },
);
ProgressBar.displayName = "ProgressBar";

const STROKE_WIDTH = 4;
const CENTER = 18;
const RADIUS = CENTER - STROKE_WIDTH / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const progressCircleVariants = tv({
  base: "progress-circle",
  defaultVariants: {
    size: "md",
    color: "accent",
  },
  variants: {
    size: {
      sm: "progress-circle--sm",
      md: "progress-circle--md",
      lg: "progress-circle--lg",
    },
    color: {
      default: "progress-circle--default",
      accent: "progress-circle--accent",
      success: "progress-circle--success",
      warning: "progress-circle--warning",
      danger: "progress-circle--danger",
    },
  },
});

type ProgressCircleVariants = VariantProps<typeof progressCircleVariants>;

interface ProgressCircleProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "color">,
    ProgressCircleVariants {
  value?: number;
  minValue?: number;
  maxValue?: number;
  isIndeterminate?: boolean;
}

const ProgressCircle = forwardRef<HTMLDivElement, ProgressCircleProps>(
  (
    {
      className,
      value = 0,
      minValue = 0,
      maxValue = 100,
      isIndeterminate,
      size,
      color,
      "aria-label": ariaLabel,
      ...props
    },
    ref,
  ) => {
    const percentage = isIndeterminate
      ? 25
      : Math.max(
          0,
          Math.min(
            100,
            ((value - minValue) / (maxValue - minValue)) * 100,
          ),
        );
    const strokeDashoffset =
      CIRCUMFERENCE - (percentage / 100) * CIRCUMFERENCE;

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-label={ariaLabel}
        aria-valuenow={isIndeterminate ? undefined : Math.round(percentage)}
        aria-valuemin={minValue}
        aria-valuemax={maxValue}
        data-indeterminate={isIndeterminate || undefined}
        data-slot="progress-circle"
        className={cn(progressCircleVariants({ size, color }), className)}
        {...props}
      >
        <svg
          className="progress-circle__track"
          data-slot="progress-circle-track"
          fill="none"
          viewBox={`0 0 ${CENTER * 2} ${CENTER * 2}`}
        >
          <circle
            className="progress-circle__track-circle"
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            strokeWidth={STROKE_WIDTH}
          />
          <circle
            className="progress-circle__fill-circle"
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            strokeWidth={STROKE_WIDTH}
            transform={`rotate(-90 ${CENTER} ${CENTER})`}
          />
        </svg>
      </div>
    );
  },
);
ProgressCircle.displayName = "ProgressCircle";

export {
  ProgressBar,
  ProgressCircle,
  progressBarVariants,
  progressCircleVariants,
};
export type {
  ProgressBarProps,
  ProgressBarVariants,
  ProgressCircleProps,
  ProgressCircleVariants,
};

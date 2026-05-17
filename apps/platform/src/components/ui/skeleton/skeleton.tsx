import { forwardRef, type HTMLAttributes } from "react";

import { cn } from "@/lib/cn";
import { tv, type VariantProps } from "tailwind-variants";

const skeletonVariants = tv({
  base: "skeleton",
  defaultVariants: {
    animation: "shimmer",
  },
  variants: {
    animation: {
      shimmer: "skeleton--shimmer",
      pulse: "skeleton--pulse",
      none: "skeleton--none",
    },
  },
});

type SkeletonVariants = VariantProps<typeof skeletonVariants>;

interface SkeletonProps
  extends HTMLAttributes<HTMLDivElement>,
    SkeletonVariants {}

const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, animation, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="skeleton"
      className={cn(skeletonVariants({ animation }), className)}
      {...props}
    />
  ),
);
Skeleton.displayName = "Skeleton";

export { Skeleton, skeletonVariants };
export type { SkeletonProps, SkeletonVariants };

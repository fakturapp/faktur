import { forwardRef, type HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

import { cardVariants, type CardVariants } from "./card.styles";

interface CardProps extends HTMLAttributes<HTMLDivElement>, CardVariants {}

const CardRoot = forwardRef<HTMLDivElement, CardProps>(
  ({ className, size, variant, isInteractive, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="card"
      className={cn(
        cardVariants({ size, variant, isInteractive }),
        className,
      )}
      {...props}
    />
  ),
);
CardRoot.displayName = "Card";

const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="card-header"
      className={cn("card__header", className)}
      {...props}
    />
  ),
);
CardHeader.displayName = "Card.Header";

const CardTitle = forwardRef<
  HTMLHeadingElement,
  HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    data-slot="card-title"
    className={cn("card__title", className)}
    {...props}
  />
));
CardTitle.displayName = "Card.Title";

const CardDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    data-slot="card-description"
    className={cn("card__description", className)}
    {...props}
  />
));
CardDescription.displayName = "Card.Description";

const CardBody = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="card-body"
      className={cn("card__body", className)}
      {...props}
    />
  ),
);
CardBody.displayName = "Card.Body";

const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="card-footer"
      className={cn("card__footer", className)}
      {...props}
    />
  ),
);
CardFooter.displayName = "Card.Footer";

const CardAction = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="card-action"
      className={cn("card__action", className)}
      {...props}
    />
  ),
);
CardAction.displayName = "Card.Action";

const Card = CardRoot;
const CardContent = CardBody;

export {
  Card,
  CardRoot,
  CardHeader,
  CardTitle,
  CardDescription,
  CardBody,
  CardContent,
  CardFooter,
  CardAction,
};
export type { CardProps };

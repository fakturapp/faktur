import * as React from 'react'
import { cn } from '@/lib/utils'

const FieldGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col gap-5', className)} {...props} />
  )
)
FieldGroup.displayName = 'FieldGroup'

const Field = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('grid gap-2', className)} {...props} />
  )
)
Field.displayName = 'Field'

const FieldLabel = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn('text-sm font-medium leading-none tracking-[-0.015em] text-foreground', className)}
    {...props}
  />
))
FieldLabel.displayName = 'FieldLabel'

const FieldDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      'text-xs text-muted-foreground [&_a]:text-accent [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-accent/80',
      className
    )}
    {...props}
  />
))
FieldDescription.displayName = 'FieldDescription'

const FieldSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn('relative', className)} {...props}>
    <div className="absolute inset-0 flex items-center">
      <span className="w-full border-t border-separator" />
    </div>
    {children && (
      <div className="relative flex justify-center text-xs uppercase">
        <span
          data-slot="field-separator-content"
          className="bg-background px-2 text-muted-foreground"
        >
          {children}
        </span>
      </div>
    )}
  </div>
))
FieldSeparator.displayName = 'FieldSeparator'

const FieldError = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-xs text-danger', className)} {...props} />
))
FieldError.displayName = 'FieldError'

export { FieldGroup, Field, FieldLabel, FieldDescription, FieldSeparator, FieldError }

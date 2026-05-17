"use client";

/**
 * Modal — copied from HeroUI v3 (simplified)
 * Source: heroui/packages/react/src/components/modal/modal.tsx
 *
 * Dropped deps: use-overlay-state (uses uncontrolled DialogTrigger instead),
 *               SurfaceContext (not needed in ui-preview).
 *
 * API:
 *   <Modal>
 *     <Modal.Trigger>Open</Modal.Trigger>
 *     <Modal.Backdrop>
 *       <Modal.Container size="md">
 *         <Modal.Dialog>
 *           <Modal.Header>
 *             <Modal.Heading>Title</Modal.Heading>
 *           </Modal.Header>
 *           <Modal.Body>...</Modal.Body>
 *           <Modal.Footer>...</Modal.Footer>
 *           <Modal.CloseTrigger />
 *         </Modal.Dialog>
 *       </Modal.Container>
 *     </Modal.Backdrop>
 *   </Modal>
 */

import type { ComponentPropsWithRef, ReactNode } from "react";
import { createContext, useContext, useMemo } from "react";
import type {
  Button as ButtonPrimitive,
  DialogProps as DialogPrimitiveProps,
} from "react-aria-components";
import {
  Dialog as DialogPrimitive,
  Heading as HeadingPrimitive,
  ModalOverlay as ModalOverlayPrimitive,
  Modal as ModalPrimitive,
  DialogTrigger as ModalTriggerPrimitive,
  Pressable as PressablePrimitive,
} from "react-aria-components";

import { CloseButton } from "@/components/ui/close-button";
import {
  composeSlotClassName,
  composeTwRenderProps,
} from "@/lib/compose-tw-render-props";

import { modalVariants, type ModalVariants } from "./modal.styles";

type ModalPlacement = "auto" | "top" | "center" | "bottom";

/* ------------------------------------------------------------------
 * Context
 * ------------------------------------------------------------------ */
interface ModalContextValue {
  slots?: ReturnType<typeof modalVariants>;
  placement?: ModalPlacement;
}

const ModalContext = createContext<ModalContextValue>({});

/* ------------------------------------------------------------------
 * Root
 * ------------------------------------------------------------------ */
interface ModalRootProps
  extends ComponentPropsWithRef<typeof ModalTriggerPrimitive> {}

const ModalRoot = ({ children, ...props }: ModalRootProps) => {
  const value = useMemo<ModalContextValue>(
    () => ({ slots: modalVariants() }),
    [],
  );

  return (
    <ModalContext.Provider value={value}>
      <ModalTriggerPrimitive data-slot="modal-root" {...props}>
        {children}
      </ModalTriggerPrimitive>
    </ModalContext.Provider>
  );
};

/* ------------------------------------------------------------------
 * Trigger
 * ------------------------------------------------------------------ */
interface ModalTriggerProps extends ComponentPropsWithRef<"div"> {}

const ModalTrigger = ({ children, className, ...props }: ModalTriggerProps) => {
  const { slots } = useContext(ModalContext);

  return (
    <PressablePrimitive>
      <div
        className={composeSlotClassName(slots?.trigger, className)}
        data-slot="modal-trigger"
        role="button"
        {...props}
      >
        {children}
      </div>
    </PressablePrimitive>
  );
};

/* ------------------------------------------------------------------
 * Backdrop (overlay)
 * ------------------------------------------------------------------ */
interface ModalBackdropProps
  extends ComponentPropsWithRef<typeof ModalOverlayPrimitive> {
  variant?: ModalVariants["variant"];
  /** @default true */
  isDismissable?: boolean;
}

const ModalBackdrop = ({
  children,
  className,
  isDismissable = true,
  onClick,
  variant,
  ...props
}: ModalBackdropProps) => {
  const { slots: contextSlots } = useContext(ModalContext);
  const updatedSlots = useMemo(() => modalVariants({ variant }), [variant]);
  const value = useMemo<ModalContextValue>(
    () => ({ slots: { ...contextSlots, ...updatedSlots } }),
    [contextSlots, updatedSlots],
  );

  return (
    <ModalOverlayPrimitive
      className={composeTwRenderProps(className, updatedSlots?.backdrop())}
      data-slot="modal-backdrop"
      isDismissable={isDismissable}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(e);
      }}
      {...props}
    >
      {(renderProps) => (
        <ModalContext.Provider value={value}>
          {typeof children === "function" ? children(renderProps) : children}
        </ModalContext.Provider>
      )}
    </ModalOverlayPrimitive>
  );
};

/* ------------------------------------------------------------------
 * Container (positioning wrapper)
 * ------------------------------------------------------------------ */
interface ModalContainerProps
  extends Omit<
    ComponentPropsWithRef<typeof ModalPrimitive>,
    Exclude<keyof ModalBackdropProps, "children" | "className">
  > {
  placement?: ModalPlacement;
  scroll?: ModalVariants["scroll"];
  size?: ModalVariants["size"];
}

const ModalContainer = ({
  children,
  className,
  placement = "auto",
  scroll,
  size,
  ...props
}: ModalContainerProps) => {
  const { slots: contextSlots } = useContext(ModalContext);
  const updatedSlots = useMemo(
    () => modalVariants({ scroll, size }),
    [scroll, size],
  );
  const value = useMemo<ModalContextValue>(
    () => ({ placement, slots: { ...contextSlots, ...updatedSlots } }),
    [contextSlots, placement, updatedSlots],
  );

  return (
    <ModalPrimitive
      className={composeTwRenderProps(className, updatedSlots?.container())}
      data-placement={placement}
      data-slot="modal-container"
      {...props}
    >
      {(renderProps) => (
        <ModalContext.Provider value={value}>
          {typeof children === "function" ? children(renderProps) : children}
        </ModalContext.Provider>
      )}
    </ModalPrimitive>
  );
};

/* ------------------------------------------------------------------
 * Dialog
 * ------------------------------------------------------------------ */
interface ModalDialogProps extends DialogPrimitiveProps {}

const ModalDialog = ({ children, className, ...props }: ModalDialogProps) => {
  const { placement, slots } = useContext(ModalContext);

  return (
    <DialogPrimitive
      className={composeSlotClassName(slots?.dialog, className)}
      data-placement={placement}
      data-slot="modal-dialog"
      {...props}
    >
      {children}
    </DialogPrimitive>
  );
};

/* ------------------------------------------------------------------
 * Sub-elements
 * ------------------------------------------------------------------ */
const ModalHeader = ({
  children,
  className,
  ...props
}: ComponentPropsWithRef<"div">) => {
  const { slots } = useContext(ModalContext);
  return (
    <div
      className={composeSlotClassName(slots?.header, className)}
      data-slot="modal-header"
      {...props}
    >
      {children}
    </div>
  );
};

interface ModalHeadingProps
  extends ComponentPropsWithRef<typeof HeadingPrimitive> {}

const ModalHeading = ({ children, className, ...props }: ModalHeadingProps) => {
  const { slots } = useContext(ModalContext);
  return (
    <HeadingPrimitive
      className={composeSlotClassName(slots?.heading, className)}
      data-slot="modal-heading"
      slot="title"
      {...props}
    >
      {children}
    </HeadingPrimitive>
  );
};

const ModalIcon = ({
  children,
  className,
  ...props
}: ComponentPropsWithRef<"div">) => {
  const { slots } = useContext(ModalContext);
  return (
    <div
      className={composeSlotClassName(slots?.icon, className)}
      data-slot="modal-icon"
      {...props}
    >
      {children}
    </div>
  );
};

const ModalBody = ({
  children,
  className,
  ...props
}: ComponentPropsWithRef<"div">) => {
  const { slots } = useContext(ModalContext);
  return (
    <div
      className={composeSlotClassName(slots?.body, className)}
      data-slot="modal-body"
      {...props}
    >
      {children}
    </div>
  );
};

const ModalFooter = ({
  children,
  className,
  ...props
}: ComponentPropsWithRef<"div">) => {
  const { slots } = useContext(ModalContext);
  return (
    <div
      className={composeSlotClassName(slots?.footer, className)}
      data-slot="modal-footer"
      {...props}
    >
      {children}
    </div>
  );
};

/* ------------------------------------------------------------------
 * CloseTrigger
 * ------------------------------------------------------------------ */
interface ModalCloseTriggerProps
  extends ComponentPropsWithRef<typeof ButtonPrimitive> {
  className?: string;
  children?: ReactNode;
}

const ModalCloseTrigger = ({
  className,
  ...rest
}: ModalCloseTriggerProps) => {
  const { slots } = useContext(ModalContext);

  return (
    <CloseButton
      className={composeTwRenderProps(className, slots?.closeTrigger())}
      data-slot="modal-close-trigger"
      slot="close"
      {...rest}
    />
  );
};

export {
  ModalRoot,
  ModalTrigger,
  ModalBackdrop,
  ModalContainer,
  ModalDialog,
  ModalHeader,
  ModalHeading,
  ModalIcon,
  ModalBody,
  ModalFooter,
  ModalCloseTrigger,
};
export type {
  ModalRootProps,
  ModalTriggerProps,
  ModalBackdropProps,
  ModalContainerProps,
  ModalDialogProps,
  ModalHeadingProps,
  ModalCloseTriggerProps,
};

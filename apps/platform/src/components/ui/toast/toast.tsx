"use client"

import type {
  CSSProperties,
  ComponentPropsWithRef,
  MutableRefObject,
  ReactNode,
} from "react"
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import {
  Text as TextPrimitive,
  UNSTABLE_ToastContent as ToastContentPrimitive,
  UNSTABLE_Toast as ToastPrimitive,
  UNSTABLE_ToastRegion as ToastRegionPrimitive,
  UNSTABLE_ToastStateContext as ToastStateContext,
  type ToastProps as ToastPrimitiveProps,
  type ToastRegionProps,
} from "react-aria-components"
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react"
import { Button as RACButton } from "react-aria-components"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import {
  composeSlotClassName,
  composeTwRenderProps,
} from "@/lib/compose-tw-render-props"
import { getLastApiError, isDevModeEnabled } from "@/lib/dev-mode"

import {
  DEFAULT_GAP,
  DEFAULT_MAX_VISIBLE_TOAST,
  DEFAULT_SCALE_FACTOR,
  DEFAULT_TOAST_WIDTH,
} from "./constants"
import {
  ToastQueue,
  toast as defaultToastQueue,
  type StatelyToastQueue,
  type ToastActionProps,
  type ToastContentValue,
} from "./toast-queue"
import { toastVariants, type ToastVariants } from "./toast.styles"

function dataAttr(condition: boolean | undefined): string | undefined {
  return condition ? "true" : undefined
}

function useMeasuredHeight(ref: MutableRefObject<HTMLElement | null>) {
  const [height, setHeight] = useState<number | undefined>(undefined)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof ResizeObserver === "undefined") return
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setHeight(entry.contentRect.height)
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return { height }
}

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)
  useEffect(() => {
    if (typeof window === "undefined") return
    const mql = window.matchMedia(query)
    setMatches(mql.matches)
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches)
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [query])
  return matches
}

type ToastContextValue = {
  slots?: ReturnType<typeof toastVariants>
  placement?: ToastVariants["placement"]
  width?: number | string
  scaleFactor?: number
  gap?: number
  maxVisibleToasts?: number
  heightsByKey?: Record<string, number>
  onToastHeightChange?: (key: string, height: number) => void
}

const ToastContext = createContext<ToastContextValue>({})

interface ToastProps<T extends object = ToastContentValue>
  extends ToastPrimitiveProps<T>,
    ToastVariants {
  scaleFactor?: number
}

const Toast = <T extends object = ToastContentValue>({
  children,
  className,
  placement,
  scaleFactor = DEFAULT_SCALE_FACTOR,
  toast,
  variant,
  ...rest
}: ToastProps<T>) => {
  const {
    gap = DEFAULT_GAP,
    heightsByKey,
    maxVisibleToasts = DEFAULT_MAX_VISIBLE_TOAST,
    onToastHeightChange,
    placement: contextPlacement,
    scaleFactor: contextScaleFactor,
    slots,
  } = useContext(ToastContext)

  const finalPlacement = placement ?? contextPlacement
  const finalScaleFactor = scaleFactor ?? contextScaleFactor

  const state = useContext(ToastStateContext)!
  const visibleToasts = state.visibleToasts
  const index = visibleToasts.indexOf(toast)
  const isFrontmost = index <= 0
  const isBottom = finalPlacement?.startsWith("bottom") ?? true
  const isHidden = index >= maxVisibleToasts
  const toastKey = toast?.key
  const toastRef = useRef<HTMLDivElement | null>(null)
  const { height: toastHeight } = useMeasuredHeight(toastRef)

  useEffect(() => {
    if (toastKey && typeof toastHeight === "number") {
      onToastHeightChange?.(toastKey, toastHeight)
    }
  }, [toastKey, toastHeight, onToastHeightChange])

  const style = useMemo<CSSProperties>(() => {
    const frontToastKey = visibleToasts[0]?.key
    const frontHeight =
      (frontToastKey ? heightsByKey?.[frontToastKey] : undefined) ?? toastHeight ?? 0
    const offset = index * gap
    const translateY = (isBottom ? -1 : 1) * offset
    const scale = 1 - index * (finalScaleFactor ?? DEFAULT_SCALE_FACTOR)

    return {
      viewTransitionName: `toast-${String(toast.key).replace(/[^a-zA-Z0-9]/g, "-")}`,
      translate: `0 ${translateY}px 0`,
      scale: `${scale}`,
      zIndex: visibleToasts.length - index,
      ...(frontHeight ? ({ "--front-height": `${frontHeight}px` } as CSSProperties) : null),
      opacity: isHidden ? 0 : 1,
      pointerEvents: isHidden ? ("none" as const) : ("auto" as const),
      ...rest.style,
    }
  }, [
    finalScaleFactor,
    gap,
    heightsByKey,
    index,
    isBottom,
    isHidden,
    rest.style,
    toast.key,
    toastHeight,
    visibleToasts,
  ])

  return (
    <ToastPrimitive
      ref={toastRef}
      aria-hidden={isHidden}
      className={composeTwRenderProps(className, slots?.toast({ variant }))}
      data-frontmost={dataAttr(isFrontmost)}
      data-hidden={dataAttr(isHidden)}
      data-index={index}
      data-slot="toast"
      style={style}
      toast={toast}
      {...rest}
    >
      {children}
    </ToastPrimitive>
  )
}

Toast.displayName = "Faktur.Toast"

interface ToastContentProps extends ComponentPropsWithRef<typeof ToastContentPrimitive> {}

const ToastContent = ({ children, className, ...rest }: ToastContentProps) => {
  const { slots } = useContext(ToastContext)
  return (
    <ToastContentPrimitive
      className={composeSlotClassName(slots?.content, className)}
      data-slot="toast-content"
      {...rest}
    >
      {children}
    </ToastContentPrimitive>
  )
}

interface ToastIndicatorProps {
  children?: ReactNode
  className?: string
  variant?: ToastVariants["variant"]
}

const ToastIndicator = ({ children, className, variant }: ToastIndicatorProps) => {
  const { slots } = useContext(ToastContext)

  const defaultIcon = useMemo(() => {
    const props = {
      "data-slot": "toast-default-icon",
      className: "size-4",
    } as const
    switch (variant) {
      case "success":
        return <CheckCircle2 {...props} />
      case "warning":
        return <AlertTriangle {...props} />
      case "danger":
        return <AlertCircle {...props} />
      case "accent":
      default:
        return <Info {...props} />
    }
  }, [variant])

  return (
    <div
      className={composeSlotClassName(slots?.indicator, className)}
      data-slot="toast-indicator"
    >
      {children ?? defaultIcon}
    </div>
  )
}

type ToastTextProps = ComponentPropsWithRef<typeof TextPrimitive>

const ToastTitle = ({ children, className, ...rest }: ToastTextProps) => {
  const { slots } = useContext(ToastContext)
  return (
    <TextPrimitive
      className={composeSlotClassName(slots?.title, className)}
      data-slot="toast-title"
      slot="title"
      {...rest}
    >
      {children}
    </TextPrimitive>
  )
}

const ToastDescription = ({ children, className, ...rest }: ToastTextProps) => {
  const { slots } = useContext(ToastContext)
  return (
    <TextPrimitive
      className={composeSlotClassName(slots?.description, className)}
      data-slot="toast-description"
      slot="description"
      {...rest}
    >
      {children}
    </TextPrimitive>
  )
}

const ToastCloseButton = ({
  className,
  ...rest
}: ComponentPropsWithRef<typeof RACButton>) => {
  const { slots } = useContext(ToastContext)
  return (
    <RACButton
      aria-label="Fermer"
      className={composeTwRenderProps(className, slots?.close())}
      data-slot="toast-close"
      slot="close"
      {...rest}
    >
      <X aria-hidden="true" />
    </RACButton>
  )
}

const ToastActionButton = ({
  children,
  className,
  variant = "tertiary",
  onPress,
  ...rest
}: ToastActionProps & { onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void }) => {
  const { slots } = useContext(ToastContext)
  return (
    <Button
      type="button"
      size="sm"
      variant={variant as React.ComponentProps<typeof Button>["variant"]}
      className={composeSlotClassName(slots?.action, className)}
      data-slot="toast-action-button"
      onClick={(e) => onPress?.(e)}
      {...rest}
    >
      {children}
    </Button>
  )
}

interface ToastProviderProps
  extends Omit<ToastRegionProps<ToastContentValue>, "queue" | "children"> {
  children?: ToastRegionProps<ToastContentValue>["children"]
  gap?: number
  maxVisibleToasts?: number
  scaleFactor?: number
  placement?: ToastVariants["placement"]
  queue?: ToastQueue<ToastContentValue>
  width?: number | string
}

const ToastProvider = ({
  children,
  className,
  gap = DEFAULT_GAP,
  maxVisibleToasts,
  placement = "bottom",
  queue: queueProp,
  scaleFactor = DEFAULT_SCALE_FACTOR,
  width = DEFAULT_TOAST_WIDTH,
  ...rest
}: ToastProviderProps) => {
  const slots = useMemo(() => toastVariants({ placement }), [placement])
  const isMobile = useMediaQuery("(max-width: 768px)")
  const [toastHeights, setToastHeights] = useState<Record<string, number>>({})

  const toastRACQueue = useMemo<StatelyToastQueue<ToastContentValue>>(() => {
    if (queueProp) return queueProp.getQueue()
    return defaultToastQueue.getQueue() as StatelyToastQueue<ToastContentValue>
  }, [queueProp])

  const resolvedMaxVisibleToasts = useMemo(() => {
    const queueLimit =
      queueProp && "maxVisibleToasts" in queueProp ? queueProp.maxVisibleToasts : undefined
    return maxVisibleToasts ?? queueLimit ?? DEFAULT_MAX_VISIBLE_TOAST
  }, [maxVisibleToasts, queueProp])

  const handleToastHeightChange = useCallback((key: string, height: number) => {
    setToastHeights((prev) => {
      if (prev[key] === height) return prev
      return { ...prev, [key]: height }
    })
  }, [])

  return (
    <ToastRegionPrimitive<ToastContentValue>
      className={composeTwRenderProps(className, slots.region())}
      data-slot="toast-region"
      queue={toastRACQueue}
      style={
        {
          "--gap": `${gap}px`,
          "--scale-factor": scaleFactor,
          "--placement": placement,
          "--toast-width": typeof width === "number" ? `${width}px` : width,
        } as React.CSSProperties
      }
      {...rest}
    >
      {(renderProps) => {
        const content = renderProps.toast.content as ToastContentValue
        const { actionProps, description, indicator, isLoading, title, variant } = content ?? {}

        const child = (
          <Toast
            placement={placement}
            scaleFactor={scaleFactor}
            toast={renderProps.toast}
            variant={variant}
          >
            {indicator === null ? null : isLoading ? (
              <ToastIndicator variant={variant}>
                <Spinner size="sm" />
              </ToastIndicator>
            ) : (
              <ToastIndicator variant={variant}>{indicator}</ToastIndicator>
            )}
            <ToastContent>
              {!!title && <ToastTitle>{title}</ToastTitle>}
              {!!description && <ToastDescription>{description}</ToastDescription>}
              {isMobile && actionProps?.children ? (
                <ToastActionButton {...actionProps}>{actionProps.children}</ToastActionButton>
              ) : null}
            </ToastContent>
            {!isMobile && actionProps?.children ? (
              <ToastActionButton {...actionProps}>{actionProps.children}</ToastActionButton>
            ) : null}
            <ToastCloseButton />
          </Toast>
        )

        return (
          <ToastContext.Provider
            value={{
              slots,
              placement,
              scaleFactor,
              gap,
              maxVisibleToasts: resolvedMaxVisibleToasts,
              heightsByKey: toastHeights,
              onToastHeightChange: handleToastHeightChange,
              width,
            }}
          >
            {typeof children === "undefined"
              ? child
              : typeof children === "function"
                ? children(renderProps)
                : children}
          </ToastContext.Provider>
        )
      }}
    </ToastRegionPrimitive>
  )
}

ToastProvider.displayName = "Faktur.ToastProvider"


type LegacyToastType = "success" | "error" | "info"

const DEV_DETAILS_EVENT = "faktur:show-api-error-details"

export function useToast() {
  const fn = useCallback((message: string | ReactNode, type: LegacyToastType = "info") => {
    if (type === "error") {
      const apiError = isDevModeEnabled() ? getLastApiError() : undefined
      return defaultToastQueue.danger(
        message,
        apiError
          ? {
              actionProps: {
                children: "Détails",
                variant: "outline",
                onPress: () => {
                  window.dispatchEvent(
                    new CustomEvent(DEV_DETAILS_EVENT, { detail: apiError }),
                  )
                },
              },
            }
          : undefined,
      )
    }
    if (type === "success") {
      return defaultToastQueue.success(message)
    }
    return defaultToastQueue(message)
  }, [])
  return { toast: fn }
}

export { DEV_DETAILS_EVENT }

export {
  Toast,
  ToastProvider,
  ToastContent,
  ToastIndicator,
  ToastTitle,
  ToastDescription,
  ToastActionButton,
  ToastCloseButton,
}

export type { ToastProps, ToastProviderProps, ToastIndicatorProps }

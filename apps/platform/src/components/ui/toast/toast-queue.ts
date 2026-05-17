"use client"

import type { ReactNode, MouseEvent } from "react"
import {
  UNSTABLE_ToastQueue as ToastQueuePrimitive,
  type ToastOptions as RACToastOptions,
} from "react-aria-components"
import { flushSync } from "react-dom"

import { DEFAULT_RAC_MAX_VISIBLE_TOAST, DEFAULT_TOAST_TIMEOUT } from "./constants"

export interface ToastActionProps {
  children: ReactNode
  onPress?: (e: MouseEvent<HTMLButtonElement>) => void
  variant?: "primary" | "secondary" | "tertiary" | "danger" | "danger-soft" | "outline"
  className?: string
}

export interface ToastQueueOptions {
  maxVisibleToasts?: number
  wrapUpdate?: (fn: () => void) => void
}

export type StatelyToastQueue<T extends object = ToastContentValue> = InstanceType<
  typeof ToastQueuePrimitive<T>
>

export class ToastQueue<T extends object = ToastContentValue> {
  private queue: StatelyToastQueue<T>
  readonly maxVisibleToasts?: number

  constructor(options?: ToastQueueOptions) {
    this.maxVisibleToasts = options?.maxVisibleToasts
    this.queue = new ToastQueuePrimitive<T>({
      maxVisibleToasts: DEFAULT_RAC_MAX_VISIBLE_TOAST,
      wrapUpdate: options?.wrapUpdate
        ? options.wrapUpdate
        : (fn: () => void) => {
            if (typeof document !== "undefined" && "startViewTransition" in document) {
              ;(document as Document & { startViewTransition: (cb: () => void) => unknown })
                .startViewTransition(() => {
                  flushSync(fn)
                })
            } else {
              fn()
            }
          },
    })
  }

  add(content: T, options?: RACToastOptions): string {
    const timeout = options?.timeout !== undefined ? options.timeout : DEFAULT_TOAST_TIMEOUT

    return this.queue.add(content, { ...options, timeout })
  }

  close(key: string): void {
    this.queue.close(key)
  }

  pauseAll(): void {
    this.queue.pauseAll()
  }

  resumeAll(): void {
    this.queue.resumeAll()
  }

  clear(): void {
    // No public clear() — iterate visible toasts and close each
    for (const t of this.queue.visibleToasts) {
      this.queue.close(t.key)
    }
  }

  subscribe(fn: () => void): () => void {
    return this.queue.subscribe(fn)
  }

  get visibleToasts() {
    return this.queue.visibleToasts
  }

  getQueue(): StatelyToastQueue<T> {
    return this.queue
  }
}

export interface ToastContentValue {
  indicator?: ReactNode | null
  title?: ReactNode
  description?: ReactNode
  variant?: "default" | "accent" | "success" | "warning" | "danger"
  actionProps?: ToastActionProps
  isLoading?: boolean
}

export interface FakturToastOptions {
  description?: ReactNode
  indicator?: ReactNode | null
  variant?: ToastContentValue["variant"]
  actionProps?: ToastActionProps
  isLoading?: boolean
  timeout?: number
  onClose?: () => void
}

export interface ToastPromiseOptions<T = unknown> {
  loading: ReactNode
  success: ((data: T) => ReactNode) | ReactNode
  error: ((error: Error) => ReactNode) | ReactNode
}

function createToastFunction(queue: ToastQueue<ToastContentValue>) {
  const toastFn = (message: ReactNode, options?: FakturToastOptions): string => {
    const timeout = options?.timeout !== undefined ? options.timeout : DEFAULT_TOAST_TIMEOUT

    return queue.add(
      {
        title: message,
        description: options?.description,
        indicator: options?.indicator,
        variant: options?.variant || "default",
        actionProps: options?.actionProps,
        isLoading: options?.isLoading,
      },
      {
        timeout,
        onClose: () => {
          requestAnimationFrame(() => {
            options?.onClose?.()
          })
        },
      },
    )
  }

  toastFn.success = (
    message: ReactNode,
    options?: Omit<FakturToastOptions, "variant">,
  ): string => toastFn(message, { ...options, variant: "success" })

  toastFn.danger = (
    message: ReactNode,
    options?: Omit<FakturToastOptions, "variant">,
  ): string => toastFn(message, { ...options, variant: "danger" })

  toastFn.error = toastFn.danger

  toastFn.info = (
    message: ReactNode,
    options?: Omit<FakturToastOptions, "variant">,
  ): string => toastFn(message, { ...options, variant: "accent" })

  toastFn.warning = (
    message: ReactNode,
    options?: Omit<FakturToastOptions, "variant">,
  ): string => toastFn(message, { ...options, variant: "warning" })

  toastFn.promise = <T>(
    promise: Promise<T> | (() => Promise<T>),
    options: ToastPromiseOptions<T>,
  ): string => {
    const promiseFn = typeof promise === "function" ? promise() : promise
    const loadingId = queue.add(
      { title: options.loading, variant: "default", isLoading: true },
      { timeout: 0 },
    )

    promiseFn
      .then((data) => {
        const successMessage =
          typeof options.success === "function" ? options.success(data) : options.success
        queue.close(loadingId)
        toastFn.success(successMessage)
      })
      .catch((error: Error) => {
        const errorMessage =
          typeof options.error === "function" ? options.error(error) : options.error
        queue.close(loadingId)
        toastFn.danger(errorMessage)
      })

    return loadingId
  }

  toastFn.getQueue = () => queue.getQueue()
  toastFn.close = (key: string) => queue.close(key)
  toastFn.pauseAll = () => queue.pauseAll()
  toastFn.resumeAll = () => queue.resumeAll()
  toastFn.clear = () => queue.clear()

  return toastFn
}

const toastQueue = new ToastQueue<ToastContentValue>({
  maxVisibleToasts: DEFAULT_RAC_MAX_VISIBLE_TOAST,
})

export const toast = createToastFunction(toastQueue)
export { toastQueue }

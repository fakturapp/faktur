'use client'

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type HTMLAttributes,
} from 'react'
import { cn } from '@/lib/utils'

type Orientation = 'vertical' | 'horizontal'

export interface ScrollShadowProps extends HTMLAttributes<HTMLDivElement> {
  /** Scroll axis. Defaults to `vertical`. */
  orientation?: Orientation
  /** Size of the blurred/faded edge, in pixels. Defaults to 56. */
  size?: number
  /** Hide the native scrollbar. */
  hideScrollBar?: boolean
}

/**
 * ScrollShadow — recreation of HeroUI's ScrollShadow without the dependency.
 *
 * Rather than HeroUI's flat color gradient shadow, the scrollable edges are
 * softened with a real blur: a `backdrop-blur` strip is overlaid at the top
 * and bottom (or left/right), itself feathered with a mask so the blur fades
 * gently into the content. The strips appear only on the side that still has
 * content to scroll, and update live on scroll / resize.
 */
export const ScrollShadow = forwardRef<HTMLDivElement, ScrollShadowProps>(function ScrollShadow(
  { orientation = 'vertical', size = 56, hideScrollBar = true, className, children, ...rest },
  ref
) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [start, setStart] = useState(false)
  const [end, setEnd] = useState(false)

  useImperativeHandle(ref, () => scrollRef.current as HTMLDivElement)

  const update = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    if (orientation === 'vertical') {
      const max = el.scrollHeight - el.clientHeight
      setStart(el.scrollTop > 1)
      setEnd(el.scrollTop < max - 1)
    } else {
      const max = el.scrollWidth - el.clientWidth
      setStart(el.scrollLeft > 1)
      setEnd(el.scrollLeft < max - 1)
    }
  }, [orientation])

  useEffect(() => {
    update()
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null
    ro?.observe(el)
    return () => {
      el.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
      ro?.disconnect()
    }
  }, [update])

  const vertical = orientation === 'vertical'
  const px = `${size}px`
  // Feather the blur strip so it dissolves into the content (opaque at the
  // edge, transparent toward the inside).
  const topMask = `linear-gradient(to bottom, #000 0, #000 35%, transparent 100%)`
  const bottomMask = `linear-gradient(to top, #000 0, #000 35%, transparent 100%)`
  const leftMask = `linear-gradient(to right, #000 0, #000 35%, transparent 100%)`
  const rightMask = `linear-gradient(to left, #000 0, #000 35%, transparent 100%)`

  return (
    <div className={cn('relative flex flex-col', className)}>
      {/* Top / left blur strip */}
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute z-10 backdrop-blur-[3px] transition-opacity duration-300',
          vertical ? 'inset-x-0 top-0' : 'inset-y-0 left-0',
          start ? 'opacity-100' : 'opacity-0'
        )}
        style={{
          [vertical ? 'height' : 'width']: px,
          WebkitMaskImage: vertical ? topMask : leftMask,
          maskImage: vertical ? topMask : leftMask,
        }}
      />
      {/* Bottom / right blur strip */}
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute z-10 backdrop-blur-[3px] transition-opacity duration-300',
          vertical ? 'inset-x-0 bottom-0' : 'inset-y-0 right-0',
          end ? 'opacity-100' : 'opacity-0'
        )}
        style={{
          [vertical ? 'height' : 'width']: px,
          WebkitMaskImage: vertical ? bottomMask : rightMask,
          maskImage: vertical ? bottomMask : rightMask,
        }}
      />
      <div
        ref={scrollRef}
        className={cn(
          'min-h-0 flex-1 overflow-auto',
          vertical ? 'overflow-x-hidden' : 'overflow-y-hidden',
          hideScrollBar && 'scrollbar-hidden'
        )}
        {...rest}
      >
        {children}
      </div>
    </div>
  )
})

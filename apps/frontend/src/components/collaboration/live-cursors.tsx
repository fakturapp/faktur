'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import type { CollaboratorInfo, CursorPosition } from '@/hooks/use-collaboration'

// ── Spring physics (copied from Liveblocks) ───────────────────────────────

const STIFFNESS = 320
const DAMPING = 32
const EPSILON = 0.01

interface SpringState {
  x: number
  y: number
  vx: number
  vy: number
  tx: number
  ty: number
  active: boolean
}

// ── Shared RAF loop (single requestAnimationFrame for all springs) ────────

const springs = new Map<string, { state: SpringState; el: HTMLElement }>()
let rafId: number | null = null
let lastTime = 0

function tick(currentTime: number) {
  const dt = Math.min((currentTime - lastTime) / 1000, 0.05)
  lastTime = currentTime

  for (const [id, { state, el }] of springs) {
    if (!state.active) continue

    const dx = state.x - state.tx
    const dy = state.y - state.ty

    state.vx += (-STIFFNESS * dx - DAMPING * state.vx) * dt
    state.vy += (-STIFFNESS * dy - DAMPING * state.vy) * dt

    state.x += state.vx * dt
    state.y += state.vy * dt

    // GPU-accelerated transform
    el.style.transform = `translate3d(${state.x}px, ${state.y}px, 0)`
    el.style.display = ''

    // Settle check
    if (
      Math.abs(state.vx) < EPSILON &&
      Math.abs(state.vy) < EPSILON &&
      Math.abs(state.tx - state.x) < EPSILON &&
      Math.abs(state.ty - state.y) < EPSILON
    ) {
      state.x = state.tx
      state.y = state.ty
      state.vx = 0
      state.vy = 0
      state.active = false
      el.style.transform = `translate3d(${state.x}px, ${state.y}px, 0)`
    }
  }

  // Continue loop if any spring is active
  if (Array.from(springs.values()).some((s) => s.state.active)) {
    rafId = requestAnimationFrame(tick)
  } else {
    rafId = null
  }
}

function ensureLoop() {
  if (rafId === null) {
    lastTime = performance.now()
    rafId = requestAnimationFrame(tick)
  }
}

// ── Component ─────────────────────────────────────────────────────────────

interface LiveCursorsProps {
  cursors: Map<string, CursorPosition>
  collaborators: CollaboratorInfo[]
  containerRef: React.RefObject<HTMLElement | null>
}

function getDisplayName(collab: CollaboratorInfo): string {
  if (collab.fullName) return collab.fullName.split(' ')[0]
  return collab.email.split('@')[0]
}

export function LiveCursors({ cursors, collaborators, containerRef }: LiveCursorsProps) {
  const collabMap = new Map(collaborators.map((c) => [c.userId, c]))
  const containerSizeRef = useRef({ w: 0, h: 0 })
  const cursorRefs = useRef(new Map<string, HTMLDivElement>())
  const [, forceUpdate] = useState(0)

  // Track container size via ResizeObserver (like Liveblocks)
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        containerSizeRef.current = {
          w: entry.contentRect.width,
          h: entry.contentRect.height,
        }
        // Re-position all active cursors when container resizes
        for (const [id, { state, el: cursorEl }] of springs) {
          if (cursorEl && state.active) {
            cursorEl.style.transform = `translate3d(${state.x}px, ${state.y}px, 0)`
          }
        }
      }
    })

    containerSizeRef.current = { w: el.offsetWidth, h: el.offsetHeight }
    ro.observe(el)
    return () => ro.disconnect()
  }, [containerRef])

  // Hide cursors when window loses focus (like Liveblocks)
  useEffect(() => {
    const handleBlur = () => {
      for (const [, { el }] of springs) {
        el.style.display = 'none'
      }
    }
    const handleFocus = () => forceUpdate((n) => n + 1)

    window.addEventListener('blur', handleBlur)
    window.addEventListener('focus', handleFocus)
    return () => {
      window.removeEventListener('blur', handleBlur)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  // Update spring targets when cursor positions change
  useEffect(() => {
    const { w, h } = containerSizeRef.current
    if (w === 0 || h === 0) return

    for (const [userId, pos] of cursors) {
      // Skip out-of-bounds
      if (pos.x < 0 || pos.x > 1 || pos.y < 0 || pos.y > 1) continue

      const localX = pos.x * w
      const localY = pos.y * h
      const el = cursorRefs.current.get(userId)
      if (!el) continue

      const existing = springs.get(userId)
      if (existing) {
        // Update target — spring will animate to it
        existing.state.tx = localX
        existing.state.ty = localY
        if (!existing.state.active) {
          existing.state.active = true
          ensureLoop()
        }
      } else {
        // New cursor — snap to position immediately
        const state: SpringState = {
          x: localX, y: localY,
          vx: 0, vy: 0,
          tx: localX, ty: localY,
          active: false,
        }
        springs.set(userId, { state, el })
        el.style.transform = `translate3d(${localX}px, ${localY}px, 0)`
        el.style.display = ''
      }
    }

    // Hide cursors that are no longer present
    for (const [id, { el }] of springs) {
      if (!cursors.has(id)) {
        el.style.display = 'none'
        springs.delete(id)
      }
    }
  }, [cursors])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      springs.clear()
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
        rafId = null
      }
    }
  }, [])

  // Register ref for a cursor element
  const setRef = useCallback((userId: string, el: HTMLDivElement | null) => {
    if (el) {
      cursorRefs.current.set(userId, el)
      // Also register in springs if not already
      const existing = springs.get(userId)
      if (existing) existing.el = el
    } else {
      cursorRefs.current.delete(userId)
    }
  }, [])

  return (
    <div className="pointer-events-none absolute inset-0 z-40 overflow-hidden">
      {Array.from(cursors.keys()).map((userId) => {
        const collab = collabMap.get(userId)
        if (!collab) return null

        return (
          <div
            key={userId}
            ref={(el) => setRef(userId, el)}
            style={{ position: 'absolute', top: 0, left: 0, display: 'none', willChange: 'transform' }}
          >
            {/* Liveblocks-style cursor SVG */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 32 32"
              width="20"
              height="20"
              fill="none"
              style={{ color: collab.color }}
            >
              <path
                fill="currentColor"
                d="m.088 1.75 11.25 29.422c.409 1.07 1.908 1.113 2.377.067l5.223-11.653c.13-.288.36-.518.648-.648l11.653-5.223c1.046-.47 1.004-1.968-.067-2.377L1.75.088C.71-.31-.31.71.088 1.75Z"
              />
            </svg>
            {/* Name label */}
            <div
              className="ml-4 -mt-1 rounded px-1.5 py-0.5 text-[10px] font-semibold text-white whitespace-nowrap shadow-sm select-none"
              style={{ backgroundColor: collab.color }}
            >
              {getDisplayName(collab)}
            </div>
          </div>
        )
      })}
    </div>
  )
}

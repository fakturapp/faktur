'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { ShareModal } from '@/components/collaboration/share-modal'
import { PresenceBar } from '@/components/collaboration/presence-bar'
import { LiveCursors } from '@/components/collaboration/live-cursors'
import { ReadOnlyBanner } from '@/components/collaboration/read-only-banner'
import { useCollaborationContext } from '@/components/collaboration/collaboration-provider'
import { Share2, Wifi, WifiOff } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────

type DocumentType = 'invoice' | 'quote' | 'credit_note'

interface CollaborationToolbarProps {
  documentType: DocumentType
  documentId: string | null
  className?: string
}

/**
 * Drop-in toolbar component for the editor header.
 * Reads collaboration state from CollaborationProvider context.
 */
export function CollaborationToolbar({
  documentType,
  documentId,
  className,
}: CollaborationToolbarProps) {
  const [shareOpen, setShareOpen] = useState(false)
  const collab = useCollaborationContext()

  const collaborators = collab?.collaborators ?? []
  const isConnected = collab?.isConnected ?? false
  const isOwner = collab?.isOwner ?? false

  return (
    <>
      <div className={className}>
        {/* Connection indicator — only show when there are other collaborators */}
        {documentId && collaborators.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mr-1" title={isConnected ? 'Connecte en temps reel' : 'Reconnexion...'}>
            {isConnected ? (
              <Wifi className="h-3 w-3 text-green-500" />
            ) : (
              <WifiOff className="h-3 w-3 text-amber-500 animate-pulse" />
            )}
          </div>
        )}

        {/* Presence avatars */}
        <PresenceBar collaborators={collaborators} />

        {/* Share button — only team owners/editors can share */}
        {documentId && isOwner && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShareOpen(true)}
            className="gap-1.5"
          >
            <Share2 className="h-3.5 w-3.5" />
            Partager
          </Button>
        )}
      </div>

      {/* Share modal */}
      {documentId && (
        <ShareModal
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          documentType={documentType}
          documentId={documentId}
        />
      )}
    </>
  )
}

// ── Read-only banner (uses context) ───────────────────────────────────────

export function CollaborationReadOnlyBanner() {
  const collab = useCollaborationContext()
  if (!collab || collab.myPermission !== 'viewer') return null
  return <ReadOnlyBanner />
}

// ── Collaboration wrapper for the editor area ─────────────────────────────

interface CollaborationEditorProps {
  /** Ref to the A4Sheet container for cursor positioning */
  editorRef: React.RefObject<HTMLDivElement | null>
  children: React.ReactNode
}

/**
 * Wraps the editor area to add live cursors and cursor tracking.
 * Uses percentage-based coordinates (0-1) so cursors are accurate
 * regardless of screen size, zoom level, or scroll position.
 */
export function CollaborationEditor({
  editorRef,
  children,
}: CollaborationEditorProps) {
  const collab = useCollaborationContext()

  const collaborators = collab?.collaborators ?? []
  const cursors = collab?.cursors ?? new Map()
  const isConnected = collab?.isConnected ?? false
  const myPermission = collab?.myPermission
  const sendCursorMove = collab?.sendCursorMove

  // Send cursor as percentage (0-1) of container dimensions (like Liveblocks)
  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!editorRef.current || !isConnected || !sendCursorMove) return
      const rect = editorRef.current.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return
      const xPct = (e.clientX - rect.left) / rect.width
      const yPct = (e.clientY - rect.top) / rect.height
      sendCursorMove(xPct, yPct)
    },
    [editorRef, isConnected, sendCursorMove]
  )

  // Hide cursor when pointer leaves (like Liveblocks handlePointerLeave)
  const handlePointerLeave = useCallback(() => {
    sendCursorMove?.(-1, -1) // Out-of-bounds = hidden
  }, [sendCursorMove])

  const isReadOnly = myPermission === 'viewer'

  return (
    <div
      className="relative"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      ref={editorRef as React.RefObject<HTMLDivElement>}
    >
      {/* Live cursors from other users */}
      {isConnected && collaborators.length > 0 && (
        <LiveCursors
          cursors={cursors}
          collaborators={collaborators}
          containerRef={editorRef}
        />
      )}

      {/* Read-only overlay for viewers */}
      {isReadOnly && (
        <div className="absolute inset-0 z-30 cursor-not-allowed" title="Lecture seule - vous ne pouvez pas modifier ce document">
          <div className="pointer-events-none">{children}</div>
        </div>
      )}

      {!isReadOnly && children}
    </div>
  )
}

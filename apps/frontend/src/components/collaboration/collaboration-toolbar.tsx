'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { ShareModal } from '@/components/collaboration/share-modal'
import { PresenceBar } from '@/components/collaboration/presence-bar'
import { LiveCursors } from '@/components/collaboration/live-cursors'
import { ReadOnlyBanner } from '@/components/collaboration/read-only-banner'
import { useCollaborationContext } from '@/components/collaboration/collaboration-provider'
import { Share2, Wifi, WifiOff, FlaskConical } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────

type DocumentType = 'invoice' | 'quote' | 'credit_note'

interface CollaborationToolbarProps {
  documentType: DocumentType
  documentId: string | null
  className?: string
}

/**
 * Drop-in toolbar component for the editor header.
 * Only rendered when collaborationEnabled is true.
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

  return (
    <>
      <div className={className}>
        {/* Connection indicator */}
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

        {/* Share button with beta badge */}
        {documentId && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShareOpen(true)}
            className="gap-1.5 relative"
          >
            <Share2 className="h-3.5 w-3.5" />
            Partager
            <span className="inline-flex items-center gap-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 px-1.5 py-px text-[9px] font-bold text-purple-500 uppercase tracking-wider">
              <FlaskConical className="h-2.5 w-2.5" />
              Beta
            </span>
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
  editorRef: React.RefObject<HTMLDivElement | null>
  children: React.ReactNode
}

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

  const handlePointerLeave = useCallback(() => {
    sendCursorMove?.(-1, -1)
  }, [sendCursorMove])

  const isReadOnly = myPermission === 'viewer'

  return (
    <div
      className="relative"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      ref={editorRef as React.RefObject<HTMLDivElement>}
    >
      {isConnected && collaborators.length > 0 && (
        <LiveCursors
          cursors={cursors}
          collaborators={collaborators}
          containerRef={editorRef}
        />
      )}

      {isReadOnly && (
        <div className="absolute inset-0 z-30 cursor-not-allowed" title="Lecture seule - vous ne pouvez pas modifier ce document">
          <div className="pointer-events-none">{children}</div>
        </div>
      )}

      {!isReadOnly && children}
    </div>
  )
}

'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { useCollaboration, type DocumentChange } from '@/hooks/use-collaboration'
import { ShareModal } from '@/components/collaboration/share-modal'
import { PresenceBar } from '@/components/collaboration/presence-bar'
import { LiveCursors } from '@/components/collaboration/live-cursors'
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
 * Renders: Share button + PresenceBar + connection indicator.
 */
export function CollaborationToolbar({
  documentType,
  documentId,
  className,
}: CollaborationToolbarProps) {
  const [shareOpen, setShareOpen] = useState(false)
  const { addToast } = useToast()

  const {
    collaborators,
    isConnected,
  } = useCollaboration({
    documentType,
    documentId,
    enabled: !!documentId,
    onAccessRevoked: () => {
      addToast("Votre acces a ce document a ete revoque", 'error')
      window.location.href = '/dashboard'
    },
  })

  return (
    <>
      <div className={className}>
        {/* Connection indicator */}
        {documentId && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mr-1" title={isConnected ? 'Connecte en temps reel' : 'Deconnecte'}>
            {isConnected ? (
              <Wifi className="h-3 w-3 text-green-500" />
            ) : (
              <WifiOff className="h-3 w-3 text-destructive" />
            )}
          </div>
        )}

        {/* Presence avatars */}
        <PresenceBar collaborators={collaborators} />

        {/* Share button */}
        {documentId && (
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

// ── Collaboration wrapper for the editor area ─────────────────────────────

interface CollaborationEditorProps {
  documentType: DocumentType
  documentId: string | null
  /** Ref to the A4Sheet container for cursor positioning */
  editorRef: React.RefObject<HTMLDivElement | null>
  /** Called when a remote user changes a field */
  onRemoteChange?: (change: DocumentChange) => void
  children: React.ReactNode
}

/**
 * Wraps the editor area to add live cursors and cursor tracking.
 */
export function CollaborationEditor({
  documentType,
  documentId,
  editorRef,
  onRemoteChange,
  children,
}: CollaborationEditorProps) {
  const { addToast } = useToast()

  const {
    collaborators,
    cursors,
    focusedFields,
    myPermission,
    isConnected,
    sendCursorMove,
    sendDocumentChange,
    sendFieldFocus,
    sendFieldBlur,
  } = useCollaboration({
    documentType,
    documentId,
    enabled: !!documentId,
    onDocumentChange: onRemoteChange,
    onAccessRevoked: () => {
      addToast("Votre acces a ce document a ete revoque", 'error')
      window.location.href = '/dashboard'
    },
  })

  // Track mouse position for cursor broadcasting
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!editorRef.current || !isConnected) return
      const rect = editorRef.current.getBoundingClientRect()
      sendCursorMove(
        e.clientX - rect.left,
        e.clientY - rect.top
      )
    },
    [editorRef, isConnected, sendCursorMove]
  )

  // Read-only overlay for viewers
  const isReadOnly = myPermission === 'viewer'

  return (
    <div
      className="relative"
      onMouseMove={handleMouseMove}
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

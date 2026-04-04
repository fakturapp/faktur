'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { io, type Socket } from 'socket.io-client'

const WS_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'

// ── Types ─────────────────────────────────────────────────────────────────

export interface CollaboratorInfo {
  userId: string
  fullName: string | null
  email: string
  avatarUrl: string | null
  permission: 'viewer' | 'editor'
  isOwner: boolean
  color: string
}

export interface CursorPosition {
  userId: string
  x: number
  y: number
  fieldId?: string
}

export interface DocumentChange {
  userId: string
  path: string
  value: any
  timestamp: number
}

export interface FieldFocus {
  userId: string
  fieldId: string
}

export interface UseCollaborationOptions {
  documentType: 'invoice' | 'quote' | 'credit_note'
  documentId: string | null
  enabled?: boolean
  onDocumentChange?: (change: DocumentChange) => void
  onAccessRevoked?: () => void
}

export interface UseCollaborationReturn {
  collaborators: CollaboratorInfo[]
  cursors: Map<string, CursorPosition>
  focusedFields: Map<string, string> // fieldId → userId
  myPermission: 'viewer' | 'editor' | null
  isOwner: boolean
  isConnected: boolean
  myColor: string | null
  sendCursorMove: (x: number, y: number, fieldId?: string) => void
  sendDocumentChange: (path: string, value: any) => void
  sendFieldFocus: (fieldId: string) => void
  sendFieldBlur: (fieldId: string) => void
}

export function useCollaboration({
  documentType,
  documentId,
  enabled = true,
  onDocumentChange,
  onAccessRevoked,
}: UseCollaborationOptions): UseCollaborationReturn {
  const socketRef = useRef<Socket | null>(null)
  const [collaborators, setCollaborators] = useState<CollaboratorInfo[]>([])
  const [cursors, setCursors] = useState<Map<string, CursorPosition>>(new Map())
  const [focusedFields, setFocusedFields] = useState<Map<string, string>>(new Map())
  const [myPermission, setMyPermission] = useState<'viewer' | 'editor' | null>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [myColor, setMyColor] = useState<string | null>(null)

  // Store latest callbacks in refs to avoid reconnecting on every render
  const onDocumentChangeRef = useRef(onDocumentChange)
  onDocumentChangeRef.current = onDocumentChange
  const onAccessRevokedRef = useRef(onAccessRevoked)
  onAccessRevokedRef.current = onAccessRevoked

  useEffect(() => {
    if (!enabled || !documentId) return

    const token = localStorage.getItem('faktur_token')
    if (!token) return

    const socket = io(`${WS_URL}/collaboration`, {
      path: '/ws',
      transports: ['websocket', 'polling'],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    })

    socketRef.current = socket

    socket.on('connect', () => {
      setIsConnected(true)
      socket.emit('join-document', { documentType, documentId })
    })

    socket.on('disconnect', () => {
      setIsConnected(false)
    })

    socket.on('room-joined', (data: {
      permission: 'viewer' | 'editor'
      isOwner: boolean
      color: string
      collaborators: CollaboratorInfo[]
    }) => {
      setMyPermission(data.permission)
      setIsOwner(data.isOwner)
      setMyColor(data.color)
      setCollaborators(data.collaborators)
    })

    socket.on('collaborator-joined', (collab: CollaboratorInfo) => {
      setCollaborators((prev) => {
        if (prev.some((c) => c.userId === collab.userId)) return prev
        return [...prev, collab]
      })
    })

    socket.on('collaborator-left', (data: { userId: string }) => {
      setCollaborators((prev) => prev.filter((c) => c.userId !== data.userId))
      setCursors((prev) => {
        const next = new Map(prev)
        next.delete(data.userId)
        return next
      })
      setFocusedFields((prev) => {
        const next = new Map(prev)
        // Remove all entries for this user
        for (const [fieldId, userId] of next) {
          if (userId === data.userId) next.delete(fieldId)
        }
        return next
      })
    })

    socket.on('cursor-moved', (data: CursorPosition) => {
      setCursors((prev) => {
        const next = new Map(prev)
        next.set(data.userId, data)
        return next
      })
    })

    socket.on('document-changed', (change: DocumentChange) => {
      onDocumentChangeRef.current?.(change)
    })

    socket.on('field-focused', (data: FieldFocus) => {
      setFocusedFields((prev) => {
        const next = new Map(prev)
        next.set(data.fieldId, data.userId)
        return next
      })
    })

    socket.on('field-blurred', (data: FieldFocus) => {
      setFocusedFields((prev) => {
        const next = new Map(prev)
        if (next.get(data.fieldId) === data.userId) {
          next.delete(data.fieldId)
        }
        return next
      })
    })

    socket.on('permission-changed', (data: { permission: 'viewer' | 'editor' }) => {
      setMyPermission(data.permission)
    })

    socket.on('access-revoked', () => {
      onAccessRevokedRef.current?.()
    })

    socket.on('access-denied', () => {
      onAccessRevokedRef.current?.()
    })

    socket.on('error', (data: { message: string }) => {
      console.error('[collaboration]', data.message)
    })

    return () => {
      socket.emit('leave-document')
      socket.disconnect()
      socketRef.current = null
      setCollaborators([])
      setCursors(new Map())
      setFocusedFields(new Map())
      setMyPermission(null)
      setIsOwner(false)
      setIsConnected(false)
      setMyColor(null)
    }
  }, [documentType, documentId, enabled])

  // Throttle cursor moves to ~30fps to avoid flooding
  const lastCursorSend = useRef(0)
  const sendCursorMove = useCallback((x: number, y: number, fieldId?: string) => {
    const now = Date.now()
    if (now - lastCursorSend.current < 33) return // ~30fps
    lastCursorSend.current = now
    socketRef.current?.emit('cursor-move', { x, y, fieldId })
  }, [])

  const sendDocumentChange = useCallback((path: string, value: any) => {
    socketRef.current?.emit('document-change', { path, value })
  }, [])

  const sendFieldFocus = useCallback((fieldId: string) => {
    socketRef.current?.emit('field-focus', { fieldId })
  }, [])

  const sendFieldBlur = useCallback((fieldId: string) => {
    socketRef.current?.emit('field-blur', { fieldId })
  }, [])

  return {
    collaborators,
    cursors,
    focusedFields,
    myPermission,
    isOwner,
    isConnected,
    myColor,
    sendCursorMove,
    sendDocumentChange,
    sendFieldFocus,
    sendFieldBlur,
  }
}

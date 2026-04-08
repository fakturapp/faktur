import { Server as SocketServer, type Socket } from 'socket.io'
import type { Server as HttpServer } from 'node:http'
import { Secret } from '@adonisjs/core/helpers'
import env from '#start/env'
import User from '#models/account/user'
import type { SharePermission } from '#models/collaboration/document_share'


export interface CollaboratorInfo {
  userId: string
  fullName: string | null
  email: string
  avatarUrl: string | null
  permission: SharePermission
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


const CURSOR_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4',
  '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e',
]


interface RoomPresence {
  collaborators: Map<string, CollaboratorInfo & { socketId: string }>
  colorIndex: number
}

const rooms = new Map<string, RoomPresence>()

function getRoomKey(documentType: string, documentId: string): string {
  return `${documentType}:${documentId}`
}

function getOrCreateRoom(roomKey: string): RoomPresence {
  if (!rooms.has(roomKey)) {
    rooms.set(roomKey, { collaborators: new Map(), colorIndex: 0 })
  }
  return rooms.get(roomKey)!
}

/**
 * Returns a map of documentId → list of active editors for a given type + team.
 */
export function getActiveEditors(documentType: string, _teamId: string): Record<string, { userId: string; fullName: string | null; email: string; avatarUrl: string | null; color: string }[]> {
  const result: Record<string, any[]> = {}
  for (const [roomKey, room] of rooms) {
    const [type, docId] = roomKey.split(':')
    if (type !== documentType) continue
    // Only include rooms where at least one collaborator belongs to this team
    const collabs = Array.from(room.collaborators.values())
    if (collabs.length === 0) continue
    result[docId] = collabs.map(({ socketId: _, ...c }) => ({
      userId: c.userId,
      fullName: c.fullName,
      email: c.email,
      avatarUrl: c.avatarUrl,
      color: c.color,
    }))
  }
  return result
}

// ── Singleton ─────────────────────────────────────────────────────────────

let io: SocketServer | null = null

export function getSocketServer(): SocketServer | null {
  return io
}

/**
 * Initialize the Socket.io server and attach it to the Node.js HTTP server.
 */
export function initWebSocket(httpServer: HttpServer) {
  io = new SocketServer(httpServer, {
    cors: {
      origin: env.get('FRONTEND_URL', 'http://localhost:3000'),
      methods: ['GET', 'POST'],
      credentials: true,
    },
    path: '/ws',
    transports: ['websocket', 'polling'],
  })

  const collabNs = io.of('/collaboration')

  // ── Authentication middleware ─────────────────────────────────────────

  collabNs.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token as string
      if (!token) {
        return next(new Error('Authentication required'))
      }

      // Verify the Bearer token via AdonisJS DbAccessTokensProvider
      const accessToken = await User.accessTokens.verify(new Secret(token))
      if (!accessToken) {
        return next(new Error('Invalid token'))
      }

      const user = await User.find(accessToken.tokenableId)
      if (!user) {
        return next(new Error('User not found'))
      }

      // Attach user info to socket
      ;(socket as any).userId = user.id
      ;(socket as any).user = {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        avatarUrl: (user as any).avatarUrl ?? null,
        currentTeamId: user.currentTeamId,
      }

      next()
    } catch {
      next(new Error('Authentication failed'))
    }
  })

  // ── Connection handler ────────────────────────────────────────────────

  // Track connected sockets per user to prevent connection flooding
  const userSocketCount = new Map<string, number>()
  const MAX_SOCKETS_PER_USER = 5

  collabNs.on('connection', (socket: Socket) => {
    const userData = (socket as any).user
    const userId = (socket as any).userId as string

    // Limit concurrent connections per user
    const count = userSocketCount.get(userId) || 0
    if (count >= MAX_SOCKETS_PER_USER) {
      socket.emit('error', { message: 'Too many concurrent connections' })
      socket.disconnect(true)
      return
    }
    userSocketCount.set(userId, count + 1)
    socket.on('disconnect', () => {
      const c = userSocketCount.get(userId) || 1
      if (c <= 1) userSocketCount.delete(userId)
      else userSocketCount.set(userId, c - 1)
    })

    // ── Join a document room ──────────────────────────────────────────

    socket.on('join-document', async (data: {
      documentType: string
      documentId: string
    }) => {
      const { documentType, documentId } = data

      // Validate input
      const validTypes = ['invoice', 'quote', 'credit_note']
      if (!documentType || !validTypes.includes(documentType)) {
        socket.emit('error', { message: 'Invalid document type' })
        return
      }
      if (!documentId || typeof documentId !== 'string' || documentId.length > 100) {
        socket.emit('error', { message: 'Invalid document ID' })
        return
      }

      const roomKey = getRoomKey(documentType, documentId)

      // Check access: team member or shared user
      let permission: SharePermission = 'viewer'
      let isOwner = false

      // Import dynamically to avoid circular dependencies
      const { default: DocumentAccessService } = await import(
        '#services/collaboration/document_access_service'
      )
      const accessService = new DocumentAccessService()

      // Check if user is team owner
      const document = await accessService.getDocument(
        documentType as any,
        documentId,
        userData.currentTeamId
      )

      if (document) {
        permission = 'editor'
        isOwner = true
      } else {
        // Check shared access
        const sharePermission = await accessService.getSharePermission(
          documentType as any,
          documentId,
          userId
        )
        if (!sharePermission) {
          socket.emit('access-denied', { message: 'You do not have access to this document' })
          return
        }
        permission = sharePermission
      }

      // Join the Socket.io room
      socket.join(roomKey)

      // Add to presence
      const room = getOrCreateRoom(roomKey)
      const color = CURSOR_COLORS[room.colorIndex % CURSOR_COLORS.length]
      room.colorIndex++

      const collaboratorInfo: CollaboratorInfo & { socketId: string } = {
        userId,
        fullName: userData.fullName,
        email: userData.email,
        avatarUrl: userData.avatarUrl,
        permission,
        isOwner,
        color,
        socketId: socket.id,
      }

      room.collaborators.set(userId, collaboratorInfo)

      // Store room key on socket for cleanup
      ;(socket as any).currentRoom = roomKey

      // Send current collaborators to the joining user
      const collaborators = Array.from(room.collaborators.values()).map(({ socketId: _, ...c }) => c)
      socket.emit('room-joined', {
        permission,
        isOwner,
        color,
        collaborators,
      })

      // Notify others that someone joined
      socket.to(roomKey).emit('collaborator-joined', {
        userId,
        fullName: userData.fullName,
        email: userData.email,
        avatarUrl: userData.avatarUrl,
        permission,
        isOwner,
        color,
      })
    })

    // ── Cursor movement ───────────────────────────────────────────────

    socket.on('cursor-move', (data: { x: number; y: number; fieldId?: string }) => {
      const roomKey = (socket as any).currentRoom
      if (!roomKey) return
      if (typeof data?.x !== 'number' || typeof data?.y !== 'number') return

      socket.to(roomKey).emit('cursor-moved', {
        userId,
        x: Math.round(data.x),
        y: Math.round(data.y),
        fieldId: typeof data.fieldId === 'string' ? data.fieldId.slice(0, 100) : undefined,
      })
    })

    // ── Document changes ──────────────────────────────────────────────

    socket.on('document-change', (data: { path: string; value: any }) => {
      const roomKey = (socket as any).currentRoom
      if (!roomKey) return
      if (typeof data?.path !== 'string' || data.path.length > 200) return

      // Check editor permission
      const room = rooms.get(roomKey)
      const collaborator = room?.collaborators.get(userId)
      if (!collaborator || collaborator.permission !== 'editor') {
        socket.emit('error', { message: 'You do not have edit permission' })
        return
      }

      // Broadcast to all others in the room (last-write-wins for V1)
      socket.to(roomKey).emit('document-changed', {
        userId,
        path: data.path,
        value: data.value,
        timestamp: Date.now(),
      })
    })

    // ── Field focus (show who is editing what) ────────────────────────

    socket.on('field-focus', (data: { fieldId: string }) => {
      const roomKey = (socket as any).currentRoom
      if (!roomKey) return

      socket.to(roomKey).emit('field-focused', {
        userId,
        fieldId: data.fieldId,
      })
    })

    socket.on('field-blur', (data: { fieldId: string }) => {
      const roomKey = (socket as any).currentRoom
      if (!roomKey) return

      socket.to(roomKey).emit('field-blurred', {
        userId,
        fieldId: data.fieldId,
      })
    })

    // ── Leave document room ───────────────────────────────────────────

    socket.on('leave-document', () => {
      handleLeaveRoom(socket, userId)
    })

    // ── Disconnect ────────────────────────────────────────────────────

    socket.on('disconnect', () => {
      handleLeaveRoom(socket, userId)
    })
  })

  console.log('[faktur] WebSocket server initialized on /ws')
  return io
}

async function handleLeaveRoom(socket: Socket, userId: string) {
  const roomKey = (socket as any).currentRoom
  if (!roomKey) return

  socket.leave(roomKey)
  ;(socket as any).currentRoom = null

  const room = rooms.get(roomKey)
  if (!room) return

  // Check if the user has other active sockets in this room
  // (handles multiple browser tabs for the same user)
  if (io) {
    const collabNs = io.of('/collaboration')
    const socketsInRoom = await collabNs.in(roomKey).fetchSockets()
    const userStillPresent = socketsInRoom.some(
      (s) => (s as any).userId === userId && s.id !== socket.id
    )

    if (!userStillPresent) {
      room.collaborators.delete(userId)
      socket.to(roomKey).emit('collaborator-left', { userId })

      // Auto-expire share links created by this user
      const [docType, docId] = roomKey.split(':')
      if (docType && docId) {
        import('#models/collaboration/document_share_link').then(({ default: DocumentShareLink }) => {
          DocumentShareLink.query()
            .where('document_type', docType)
            .where('document_id', docId)
            .where('created_by_user_id', userId)
            .where('auto_expire', true)
            .where('is_active', true)
            .update({ isActive: false })
            .catch(() => {})
        })
      }

      if (room.collaborators.size === 0) {
        rooms.delete(roomKey)
      }
    }
  }
}

/**
 * Broadcast that a document was deleted — all collaborators should leave.
 */
export function broadcastDocumentDeleted(
  documentType: string,
  documentId: string,
) {
  if (!io) return

  const roomKey = getRoomKey(documentType, documentId)
  const collabNs = io.of('/collaboration')
  collabNs.to(roomKey).emit('document-deleted', {
    message: 'This document has been deleted',
  })

  // Clean up the room
  rooms.delete(roomKey)
}

/**
 * Broadcast that a document was saved, so other collaborators can refresh.
 */
export function broadcastDocumentSaved(
  documentType: string,
  documentId: string,
  savedByUserId: string
) {
  if (!io) return

  const roomKey = getRoomKey(documentType, documentId)
  const collabNs = io.of('/collaboration')
  collabNs.to(roomKey).emit('document-saved', {
    savedByUserId,
    timestamp: Date.now(),
  })
}

/**
 * Forcefully disconnect a user from a document room.
 * Called when access is revoked.
 */
export async function disconnectUserFromDocument(
  documentType: string,
  documentId: string,
  userId: string
) {
  if (!io) return

  const roomKey = getRoomKey(documentType, documentId)
  const room = rooms.get(roomKey)
  if (!room) return

  const collaborator = room.collaborators.get(userId)
  if (!collaborator) return

  // Find and disconnect the socket
  const collabNs = io.of('/collaboration')
  const sockets = await collabNs.in(roomKey).fetchSockets()

  for (const s of sockets) {
    if ((s as any).userId === userId) {
      s.emit('access-revoked', {
        message: 'Your access to this document has been revoked',
      })
      s.leave(roomKey)
      ;(s as any).currentRoom = null
    }
  }

  // Remove from presence
  room.collaborators.delete(userId)
  collabNs.to(roomKey).emit('collaborator-left', { userId })

  if (room.collaborators.size === 0) {
    rooms.delete(roomKey)
  }
}

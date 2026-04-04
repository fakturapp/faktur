/*
|--------------------------------------------------------------------------
| WebSocket server (Socket.io)
|--------------------------------------------------------------------------
|
| Attaches a Socket.io server to the AdonisJS HTTP server for real-time
| collaborative editing. The /collaboration namespace handles document
| rooms, presence, cursor tracking, and live sync.
|
*/

import app from '@adonisjs/core/services/app'
import server from '@adonisjs/core/services/server'
import { initWebSocket } from '#services/collaboration/websocket_service'

app.ready(async () => {
  const httpServer = server.getNodeServer()
  if (httpServer) {
    initWebSocket(httpServer)
  }
})

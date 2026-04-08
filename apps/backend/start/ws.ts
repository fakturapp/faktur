
import app from '@adonisjs/core/services/app'
import server from '@adonisjs/core/services/server'
import { initWebSocket } from '#services/collaboration/websocket_service'

app.ready(async () => {
  const httpServer = server.getNodeServer()
  if (httpServer) {
    initWebSocket(httpServer)
  }
})

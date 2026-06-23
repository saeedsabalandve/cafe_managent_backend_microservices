// services/order-service/internal/handlers/ws_handler.go
// #websocket-handler #kitchen-display

package handlers

import (
	"log"
	"net/http"

	"order-service/internal/websocket"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

// #kitchen-websocket
func (h *OrderHandler) KitchenWebSocket(c *gin.Context) {
	cafeID := c.GetHeader("x-cafe-id")
	
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("WebSocket upgrade failed: %v", err)
		return
	}

	client := websocket.NewClient(h.hub, conn, cafeID)
	h.hub.Register <- client

	go client.WritePump()
	go client.ReadPump()
}

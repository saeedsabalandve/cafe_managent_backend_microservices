// services/order-service/internal/handlers/order_handler.go
// #http-handlers #gin #order-crud

package handlers

import (
	"net/http"

	"order-service/internal/models"
	"order-service/internal/services"
	"order-service/internal/websocket"

	"github.com/gin-gonic/gin"
)

type OrderHandler struct {
	service *services.OrderService
	hub     *websocket.Hub
}

func NewOrderHandler(service *services.OrderService, hub *websocket.Hub) *OrderHandler {
	return &OrderHandler{service: service, hub: hub}
}

// #create-order-handler
func (h *OrderHandler) CreateOrder(c *gin.Context) {
	var order models.Order
	if err := c.ShouldBindJSON(&order); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	order.CafeID = c.GetHeader("x-cafe-id")
	order.CreatedBy = c.GetHeader("x-user-id")

	if err := h.service.CreateOrder(c.Request.Context(), &order); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// #notify-kitchen-display
	h.hub.BroadcastToCafe(order.CafeID, map[string]interface{}{
		"type":  "new_order",
		"order": order,
	})

	c.JSON(http.StatusCreated, order)
}

// #get-active-orders
func (h *OrderHandler) GetActiveOrders(c *gin.Context) {
	cafeID := c.GetHeader("x-cafe-id")
	orders, err := h.service.GetActiveOrders(c.Request.Context(), cafeID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, orders)
}

// #update-order-status
func (h *OrderHandler) UpdateOrderStatus(c *gin.Context) {
	orderID := c.Param("id")
	var body struct {
		Status string `json:"status"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	changedBy := c.GetHeader("x-user-id")
	newStatus := models.OrderStatus(body.Status)

	if err := h.service.UpdateStatus(c.Request.Context(), orderID, newStatus, changedBy); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Status updated"})
}

// #get-order
func (h *OrderHandler) GetOrder(c *gin.Context) {
	orderID := c.Param("id")
	order, err := h.service.GetOrder(c.Request.Context(), orderID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}
	c.JSON(http.StatusOK, order)
}

// #cancel-order
func (h *OrderHandler) CancelOrder(c *gin.Context) {
	orderID := c.Param("id")
	cancelledBy := c.GetHeader("x-user-id")
	
	if err := h.service.CancelOrder(c.Request.Context(), orderID, cancelledBy); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"message": "Order cancelled"})
}

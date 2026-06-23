// services/order-service/internal/models/order.go
// #order-model #state-machine #aggregate-root

package models

import (
	"time"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// #order-status-enum
type OrderStatus string

const (
	StatusNew       OrderStatus = "NEW"
	StatusPreparing OrderStatus = "PREPARING"
	StatusReady     OrderStatus = "READY"
	StatusServed    OrderStatus = "SERVED"
	StatusCompleted OrderStatus = "COMPLETED"
	StatusCancelled OrderStatus = "CANCELLED"
)

// #state-transition-map
var ValidTransitions = map[OrderStatus][]OrderStatus{
	StatusNew:       {StatusPreparing, StatusCancelled},
	StatusPreparing: {StatusReady, StatusCancelled},
	StatusReady:     {StatusServed, StatusCancelled},
	StatusServed:    {StatusCompleted},
}

// #order-item
type OrderItem struct {
	MenuItemID   string             `bson:"menu_item_id" json:"menu_item_id"`
	Name         string             `bson:"name" json:"name"`
	Quantity     int                `bson:"quantity" json:"quantity"`
	UnitPrice    float64            `bson:"unit_price" json:"unit_price"`
	Modifiers    []ModifierSelection `bson:"modifiers" json:"modifiers"`
	SpecialNotes string             `bson:"special_notes,omitempty" json:"special_notes,omitempty"`
	Subtotal     float64            `bson:"subtotal" json:"subtotal"`
}

type ModifierSelection struct {
	ModifierID string  `bson:"modifier_id" json:"modifier_id"`
	Name       string  `bson:"name" json:"name"`
	PriceDelta float64 `bson:"price_delta" json:"price_delta"`
}

// #order-aggregate
type Order struct {
	ID            primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	CafeID        string             `bson:"cafe_id" json:"cafe_id"`
	TableNumber   int                `bson:"table_number" json:"table_number"`
	Items         []OrderItem        `bson:"items" json:"items"`
	Status        OrderStatus        `bson:"status" json:"status"`
	TotalAmount   float64            `bson:"total_amount" json:"total_amount"`
	Notes         string             `bson:"notes,omitempty" json:"notes,omitempty"`
	CreatedBy     string             `bson:"created_by" json:"created_by"`
	CreatedAt     time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt     time.Time          `bson:"updated_at" json:"updated_at"`
	StatusHistory []StatusChange     `bson:"status_history" json:"status_history"`
	Version       int                `bson:"version" json:"version"`
}

type StatusChange struct {
	From      OrderStatus `bson:"from" json:"from"`
	To        OrderStatus `bson:"to" json:"to"`
	ChangedBy string      `bson:"changed_by" json:"changed_by"`
	Timestamp time.Time   `bson:"timestamp" json:"timestamp"`
}

// #validate-transition
func (o *Order) IsValidTransition(newStatus OrderStatus) bool {
	for _, allowed := range ValidTransitions[o.Status] {
		if allowed == newStatus {
			return true
		}
	}
	return false
}

// #calculate-total
func (o *Order) CalculateTotal() float64 {
	var total float64
	for _, item := range o.Items {
		itemTotal := item.UnitPrice
		for _, mod := range item.Modifiers {
			itemTotal += mod.PriceDelta
		}
		total += itemTotal * float64(item.Quantity)
	}
	return total
}

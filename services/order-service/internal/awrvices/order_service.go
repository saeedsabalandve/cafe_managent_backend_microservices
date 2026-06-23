// services/order-service/internal/services/order_service.go
// #business-logic #order-state-machine #status-transitions

package services

import (
	"context"
	"errors"
	"time"

	"order-service/internal/models"
	"order-service/internal/repository"
)

type OrderService struct {
	repo *repository.OrderRepository
}

func NewOrderService(repo *repository.OrderRepository) *OrderService {
	return &OrderService{repo: repo}
}

// #create-order
func (s *OrderService) CreateOrder(ctx context.Context, order *models.Order) error {
	order.Status = models.StatusNew
	order.CreatedAt = time.Now()
	order.UpdatedAt = time.Now()
	order.Version = 1
	order.TotalAmount = order.CalculateTotal()

	order.StatusHistory = []models.StatusChange{
		{
			From:      "",
			To:        models.StatusNew,
			ChangedBy: order.CreatedBy,
			Timestamp: time.Now(),
		},
	}

	return s.repo.Create(ctx, order)
}

// #update-status
func (s *OrderService) UpdateStatus(ctx context.Context, orderID string, newStatus models.OrderStatus, changedBy string) error {
	order, err := s.repo.FindByID(ctx, orderID)
	if err != nil {
		return err
	}

	if !order.IsValidTransition(newStatus) {
		return errors.New("invalid status transition")
	}

	statusChange := models.StatusChange{
		From:      order.Status,
		To:        newStatus,
		ChangedBy: changedBy,
		Timestamp: time.Now(),
	}

	return s.repo.UpdateStatus(ctx, orderID, newStatus, statusChange, order.Version)
}

// #cancel-order
func (s *OrderService) CancelOrder(ctx context.Context, orderID string, cancelledBy string) error {
	return s.UpdateStatus(ctx, orderID, models.StatusCancelled, cancelledBy)
}

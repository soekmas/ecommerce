package scheduler

import (
	"context"
	"log/slog"
	"time"

	"github.com/vibecoding/ecommerce/internal/domain"
)

type OrderScheduler struct {
	orderSvc domain.OrderService
}

func NewOrderScheduler(orderSvc domain.OrderService) *OrderScheduler {
	return &OrderScheduler{orderSvc: orderSvc}
}

func (s *OrderScheduler) Start(ctx context.Context) {
	ticker := time.NewTicker(5 * time.Minute) // Check every 5 minutes
	defer ticker.Stop()

	// Run once at start
	go func() {
		if err := s.orderSvc.AutoCancelExpiredOrders(ctx); err != nil {
			slog.Error("Initial order scheduler run failed", "error", err)
		}
	}()

	for {
		select {
		case <-ctx.Done():
			slog.Info("Stopping Order Scheduler")
			return
		case <-ticker.C:
			if err := s.orderSvc.AutoCancelExpiredOrders(ctx); err != nil {
				slog.Error("Order scheduler run failed", "error", err)
			}
		}
	}
}

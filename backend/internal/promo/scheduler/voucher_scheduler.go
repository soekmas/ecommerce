package scheduler

import (
	"context"
	"log/slog"
	"time"

	"gorm.io/gorm"
	"github.com/vibecoding/ecommerce/internal/domain"
)

type VoucherScheduler struct {
	db *gorm.DB
}

func NewVoucherScheduler(db *gorm.DB) *VoucherScheduler {
	return &VoucherScheduler{db: db}
}

func (s *VoucherScheduler) Start(ctx context.Context) {
	ticker := time.NewTicker(1 * time.Minute) // Check every minute
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			slog.Info("Stopping Voucher Scheduler")
			return
		case <-ticker.C:
			s.deactivateExpiredVouchers()
		}
	}
}

func (s *VoucherScheduler) deactivateExpiredVouchers() {
	now := time.Now()
	// Update vouchers where end date is in the past and is_active is true
	res := s.db.Model(&domain.Voucher{}).
		Where("is_active = ? AND end_date < ?", true, now).
		Update("is_active", false)

	if res.Error != nil {
		slog.Error("Failed to run voucher scheduler", "error", res.Error)
		return
	}

	if res.RowsAffected > 0 {
		slog.Info("Voucher scheduler deactivated expired vouchers", "count", res.RowsAffected)
	}
}

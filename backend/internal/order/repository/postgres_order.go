package repository

import (
	"context"
	"time"

	"github.com/vibecoding/ecommerce/internal/domain"
	"gorm.io/gorm"
)

type postgresOrderRepository struct {
	db *gorm.DB
}

func NewPostgresOrderRepository(db *gorm.DB) domain.OrderRepository {
	db.AutoMigrate(&domain.Order{}, &domain.OrderItem{})
	return &postgresOrderRepository{db: db}
}

func (r *postgresOrderRepository) CreateOrder(ctx context.Context, order *domain.Order) error {
	return r.db.WithContext(ctx).Session(&gorm.Session{FullSaveAssociations: true}).Create(order).Error
}

func (r *postgresOrderRepository) GetOrderByID(ctx context.Context, id uint) (*domain.Order, error) {
	var order domain.Order
	err := r.db.WithContext(ctx).
		Preload("User").
		Preload("Items").
		Preload("Items.Product").
		Preload("Items.Product.Category").
		Preload("AppliedPromoRule").
		Preload("AppliedVoucher").
		First(&order, id).Error
	if err != nil {
		return nil, err
	}
	return &order, nil
}

func (r *postgresOrderRepository) ListOrdersByUserID(ctx context.Context, userID uint) ([]*domain.Order, error) {
	var orders []*domain.Order
	err := r.db.WithContext(ctx).Where("user_id = ?", userID).
		Preload("Items").
		Order("created_at DESC").Find(&orders).Error
	return orders, err
}

func (r *postgresOrderRepository) ListAllOrders(ctx context.Context) ([]*domain.Order, error) {
	var orders []*domain.Order
	err := r.db.WithContext(ctx).
		Preload("User").
		Preload("Items").
		Preload("Items.Product").
		Preload("Items.Product.Category").
		Preload("AppliedPromoRule").
		Preload("AppliedVoucher").
		Order("created_at DESC").Find(&orders).Error
	return orders, err
}

func (r *postgresOrderRepository) GetExpiredPendingOrders(ctx context.Context, expiryTime time.Time) ([]*domain.Order, error) {
	var orders []*domain.Order
	err := r.db.WithContext(ctx).
		Preload("Items").
		Preload("User").
		Where("status = ? AND created_at < ?", domain.OrderStatusPendingPayment, expiryTime).
		Find(&orders).Error
	return orders, err
}

func (r *postgresOrderRepository) UpdateOrderStatus(ctx context.Context, id uint, status domain.OrderStatus) error {
	return r.db.WithContext(ctx).Model(&domain.Order{}).Where("id = ?", id).Update("status", status).Error
}

func (r *postgresOrderRepository) UpdateOrderAWB(ctx context.Context, id uint, awb, biteshipOrderID string) error {
	return r.db.WithContext(ctx).Model(&domain.Order{}).Where("id = ?", id).Updates(map[string]interface{}{
		"awb_number":        awb,
		"biteship_order_id": biteshipOrderID,
		"status":            domain.OrderStatusShipped,
	}).Error
}

func (r *postgresOrderRepository) UpdatePaymentInfo(ctx context.Context, id uint, xenditID, paymentURL string) error {
	return r.db.WithContext(ctx).Model(&domain.Order{}).Where("id = ?", id).Updates(map[string]interface{}{
		"xendit_invoice_id": xenditID,
		"payment_url":       paymentURL,
	}).Error
}

func (r *postgresOrderRepository) GetByXenditInvoiceID(ctx context.Context, xenditID string) (*domain.Order, error) {
	var order domain.Order
	err := r.db.WithContext(ctx).
		Preload("User").
		Preload("Items").
		Where("xendit_invoice_id = ?", xenditID).
		First(&order).Error
	if err != nil {
		return nil, err
	}
	return &order, nil
}

func (r *postgresOrderRepository) CountOrders(ctx context.Context) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&domain.Order{}).Count(&count).Error
	return count, err
}

func (r *postgresOrderRepository) ListSalesReport(ctx context.Context, filter *domain.OrderFilter) ([]*domain.Order, int64, error) {
	var orders []*domain.Order
	var total int64

	db := r.db.WithContext(ctx).Model(&domain.Order{}).
		Preload("User").
		Preload("Items").
		Preload("Items.Product")

	if filter.StartDate != nil {
		db = db.Where("created_at >= ?", filter.StartDate)
	}
	if filter.EndDate != nil {
		db = db.Where("created_at <= ?", filter.EndDate)
	}
	if filter.Status != "" {
		db = db.Where("status = ?", filter.Status)
	}

	if filter.Search != "" {
		searchTerm := "%" + filter.Search + "%"
		db = db.Joins("JOIN users ON users.id = orders.user_id").
			Where("orders.order_number ILIKE ? OR users.name ILIKE ?", searchTerm, searchTerm)
	}

	// Count total records before applying limit/offset
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Apply sorting and pagination
	err := db.Order("created_at DESC").
		Limit(filter.Limit).
		Offset(filter.Offset).
		Find(&orders).Error

	return orders, total, err
}

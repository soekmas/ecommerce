package domain

import (
	"context"
	"time"

	"github.com/vibecoding/ecommerce/pkg/biteship"
	"gorm.io/gorm"
)

type OrderStatus string

const (
	OrderStatusPendingPayment OrderStatus = "pending_payment"
	OrderStatusPaid           OrderStatus = "paid"
	OrderStatusProcessing     OrderStatus = "processing"
	OrderStatusShipped        OrderStatus = "shipped"
	OrderStatusDelivered      OrderStatus = "delivered"
	OrderStatusCancelled      OrderStatus = "cancelled"
)

type Order struct {
	ID                  uint           `gorm:"primaryKey" json:"id"`
	UserID              uint           `gorm:"index;not null" json:"user_id"`
	User                User           `gorm:"foreignKey:UserID" json:"user"`
	OrderNumber         string         `gorm:"uniqueIndex;not null" json:"order_number"` // e.g., INV/20231010/0001
	Status              OrderStatus    `gorm:"type:varchar(20);default:'pending_payment'" json:"status"`
	TotalAmount         int64          `gorm:"not null" json:"total_amount"`
	DiscountAmount      int64          `gorm:"default:0" json:"discount_amount"`
	ShippingCost        int64          `gorm:"not null" json:"shipping_cost"`
	FinalAmount         int64          `gorm:"not null" json:"final_amount"` // Total - Discount + Shipping
	CourierName         string         `json:"courier_name"`                 // biteship
	CourierService      string         `json:"courier_service"`              // biteship
	AWBNumber           string         `json:"awb_number"`                   // Tracking number
	ShippingAddress     string         `json:"shipping_address"`
	Latitude            float64        `json:"latitude"`
	Longitude           float64        `json:"longitude"`
	PostalCode          string         `json:"postal_code"`
	Items               []OrderItem    `gorm:"foreignKey:OrderID" json:"items"`
	AppliedPromoRuleID  *uint          `json:"applied_promo_rule_id"`
	AppliedPromoRule    *PromoRule     `gorm:"foreignKey:AppliedPromoRuleID" json:"applied_promo_rule"`
	AppliedVoucherID    *uint          `json:"applied_voucher_id"`
	AppliedVoucher      *Voucher       `gorm:"foreignKey:AppliedVoucherID" json:"applied_voucher"`
	PaymentURL          string         `json:"payment_url"`
	XenditInvoiceID     string         `json:"xendit_invoice_id"`
	PaymentStatus       string         `json:"payment_status"` // For internal tracking if needed
	CreatedAt           time.Time      `json:"created_at"`
	UpdatedAt           time.Time      `json:"updated_at"`
	DeletedAt           gorm.DeletedAt `gorm:"index" json:"-"`
}

type OrderItem struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	OrderID   uint           `gorm:"index;not null" json:"order_id"`
	ProductID uint           `gorm:"not null" json:"product_id"`
	Product   Product        `gorm:"foreignKey:ProductID" json:"product"`
	Quantity  int            `gorm:"not null;default:1" json:"quantity"`
	Price     int64          `gorm:"not null" json:"price"` // price per item at the time of purchase
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

type OrderRequest struct {
	Items           []OrderItemRequest `json:"items" binding:"required,min=1"`
	ShippingAddress string             `json:"shipping_address" binding:"required"`
	Latitude        float64            `json:"latitude"`
	Longitude       float64            `json:"longitude"`
	PostalCode     string             `json:"postal_code"`
	CourierName     string             `json:"courier_name" binding:"required"`
	CourierService  string             `json:"courier_service" binding:"required"`
	VoucherCode     string             `json:"voucher_code"`
}

type ShippingRateRequest struct {
	Latitude  float64 `json:"latitude" binding:"required"`
	Longitude float64 `json:"longitude" binding:"required"`
	PostalCode string `json:"postal_code"`
}

type OrderItemRequest struct {
	ProductID uint `json:"product_id" binding:"required"`
	Quantity  int  `json:"quantity" binding:"required,min=1"`
}

type OrderRepository interface {
	CreateOrder(ctx context.Context, order *Order) error
	GetOrderByID(ctx context.Context, id uint) (*Order, error)
	ListOrdersByUserID(ctx context.Context, userID uint) ([]*Order, error)
	ListAllOrders(ctx context.Context) ([]*Order, error)
	UpdateOrderStatus(ctx context.Context, id uint, status OrderStatus) error
	UpdateOrderAWB(ctx context.Context, id uint, awb string) error
	UpdatePaymentInfo(ctx context.Context, id uint, xenditID, paymentURL string) error
	GetByXenditInvoiceID(ctx context.Context, xenditID string) (*Order, error)
	CountOrders(ctx context.Context) (int64, error)
}

type OrderService interface {
	CreateCheckout(ctx context.Context, userID uint, req *OrderRequest) (*Order, error)
	GetShippingRates(ctx context.Context, req *ShippingRateRequest) ([]biteship.CourierRate, error)
	GetOrder(ctx context.Context, userID uint, role UserRole, orderID uint) (*Order, error)
	ListMyOrders(ctx context.Context, userID uint) ([]*Order, error)
	ListAllOrders(ctx context.Context, adminID uint) ([]*Order, error)
	ProcessPayment(ctx context.Context, orderID uint) error
	HandleXenditCallback(ctx context.Context, xenditID, status string) error
	GenerateAWB(ctx context.Context, adminID, orderID uint) error // Interact with biteship
}

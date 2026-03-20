package domain

import (
	"context"
	"time"

	"gorm.io/gorm"
)

type TargetType string

const (
	TargetTypeGlobal   TargetType = "global"
	TargetTypeDomain   TargetType = "domain"   // email domain, e.g. @company.com
	TargetTypeUserRole TargetType = "role"     // based on user role
	TargetTypeCategory TargetType = "category" // based on user's category (if exist)
)

type DiscountType string

const (
	DiscountTypePercentage DiscountType = "percentage"
	DiscountTypeFixedPrice DiscountType = "fixed"
)

// PromoRule represents Phase 1 pricing: Targeted Pricing
type PromoRule struct {
	ID             uint         `gorm:"primaryKey" json:"id"`
	Name           string       `gorm:"not null" json:"name"`
	TargetType     TargetType   `gorm:"type:varchar(20);not null" json:"target_type"` // Domain, Role, Global
	TargetValue    string       `json:"target_value"`                                 // e.g "gmail.com", "active"
	DiscountType   DiscountType `gorm:"type:varchar(20);not null" json:"discount_type"`
	DiscountValue  int64        `gorm:"not null" json:"discount_value"`               // % (1-100) or Fixed Amount
	StartDate      time.Time    `json:"start_date"`
	EndDate        time.Time    `json:"end_date"`
	StackableWith  bool         `gorm:"default:false" json:"stackable_with"` // Can it be used with Voucher?
	MaxUsagePerUsr int          `gorm:"default:0" json:"max_usage_per_user"` // 0 = unlimited
	CreatedAt      time.Time    `json:"created_at"`
	UpdatedAt      time.Time    `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `gorm:"index" json:"-"`
}

// Voucher represents Phase 2 pricing: Manual Promo Code
type Voucher struct {
	ID                uint         `gorm:"primaryKey" json:"id"`
	Code              string       `gorm:"uniqueIndex;not null" json:"code"`
	DiscountType      DiscountType `gorm:"type:varchar(20);not null" json:"discount_type"`
	DiscountValue     int64        `gorm:"not null" json:"discount_value"`
	MinPurchase       int64        `gorm:"default:0" json:"min_purchase"`
	MaxDiscount       int64        `gorm:"default:0" json:"max_discount"`
	TargetType        string       `gorm:"type:varchar(20);default:'global'" json:"target_type"` // global | email | domain
	TargetValue       string       `gorm:"default:''" json:"target_value"`                      // e.g. user@mail.com | @company.com
	MaxUsagePerUser   int          `gorm:"default:0" json:"max_usage_per_user"`                 // 0 = unlimited
	StartDate         time.Time    `json:"start_date"`
	EndDate           time.Time    `json:"end_date"`
	MaxTotalUsage     int          `gorm:"default:0" json:"max_total_usage"`
	CurrentUsage      int          `gorm:"default:0" json:"current_usage"`
	IsActive          bool         `gorm:"default:true" json:"is_active"`
	CreatedAt         time.Time    `json:"created_at"`
	UpdatedAt         time.Time    `json:"updated_at"`
	DeletedAt         gorm.DeletedAt `gorm:"index" json:"-"`
}

type PromoRequest struct {
	Name           string       `json:"name" binding:"required"`
	TargetType     TargetType   `json:"target_type" binding:"required"`
	TargetValue    string       `json:"target_value"`
	DiscountType   DiscountType `json:"discount_type" binding:"required"`
	DiscountValue  int64        `json:"discount_value" binding:"required"`
	StartDate      time.Time    `json:"start_date" binding:"required"`
	EndDate        time.Time    `json:"end_date" binding:"required"`
	StackableWith  bool         `json:"stackable_with"`
}

type VoucherRequest struct {
	Code            string       `json:"code" binding:"required"`
	DiscountType    DiscountType `json:"discount_type" binding:"required"`
	DiscountValue   int64        `json:"discount_value" binding:"required"`
	MinPurchase     int64        `json:"min_purchase"`
	MaxDiscount     int64        `json:"max_discount"`
	TargetType      string       `json:"target_type"`  // global | email | domain
	TargetValue     string       `json:"target_value"` // user@mail.com or @domain.com
	MaxUsagePerUser int          `json:"max_usage_per_user"`
	StartDate       time.Time    `json:"start_date" binding:"required"`
	EndDate         time.Time    `json:"end_date" binding:"required"`
	MaxTotalUsage   int          `json:"max_total_usage"`
	IsActive        bool         `json:"is_active"`
}

type PromoRepository interface {
	CreatePromoRule(ctx context.Context, rule *PromoRule) error
	GetActivePromoRules(ctx context.Context) ([]*PromoRule, error)
	ListPromoRules(ctx context.Context) ([]*PromoRule, error)
	UpdatePromoRule(ctx context.Context, rule *PromoRule) error
	DeletePromoRule(ctx context.Context, id uint) error
	GetPromoRuleByID(ctx context.Context, id uint) (*PromoRule, error)

	CreateVoucher(ctx context.Context, voucher *Voucher) error
	ListVouchers(ctx context.Context) ([]*Voucher, error)
	GetVoucherByCode(ctx context.Context, code string) (*Voucher, error)
	GetVoucherByID(ctx context.Context, id uint) (*Voucher, error)
	UpdateVoucher(ctx context.Context, voucher *Voucher) error
	DeleteVoucher(ctx context.Context, id uint) error
	IncrementVoucherUsage(ctx context.Context, id uint) error
	DecrementVoucherUsage(ctx context.Context, id uint) error
	CountActiveVouchers(ctx context.Context) (int64, error)
}

type PromoService interface {
	CreatePromoRule(ctx context.Context, req *PromoRequest) error
	GetActivePromoRules(ctx context.Context) ([]*PromoRule, error)
	ListPromoRules(ctx context.Context) ([]*PromoRule, error)
	UpdatePromoRule(ctx context.Context, id uint, req *PromoRequest) error
	DeletePromoRule(ctx context.Context, id uint) error

	CreateVoucher(ctx context.Context, req *VoucherRequest) error
	ListVouchers(ctx context.Context) ([]*Voucher, error)
	GetVoucherDetails(ctx context.Context, code string) (*Voucher, error)
	UpdateVoucher(ctx context.Context, id uint, req *VoucherRequest) error
	DeleteVoucher(ctx context.Context, id uint) error
	ValidateVoucher(ctx context.Context, code string, cartTotal int64, userEmail string) (*Voucher, int64, error)
}

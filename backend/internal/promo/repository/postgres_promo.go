package repository

import (
	"context"

	"github.com/vibecoding/ecommerce/internal/domain"
	"gorm.io/gorm"
)

type postgresPromoRepository struct {
	db *gorm.DB
}

func NewPostgresPromoRepository(db *gorm.DB) domain.PromoRepository {
	db.AutoMigrate(&domain.PromoRule{}, &domain.Voucher{})
	return &postgresPromoRepository{db: db}
}

// --- Promo Rules ---

func (r *postgresPromoRepository) CreatePromoRule(ctx context.Context, rule *domain.PromoRule) error {
	return r.db.WithContext(ctx).Create(rule).Error
}

func (r *postgresPromoRepository) GetActivePromoRules(ctx context.Context) ([]*domain.PromoRule, error) {
	var rules []*domain.PromoRule
	err := r.db.WithContext(ctx).
		Where("CURRENT_TIMESTAMP BETWEEN start_date AND end_date").
		Find(&rules).Error
	return rules, err
}

func (r *postgresPromoRepository) ListPromoRules(ctx context.Context) ([]*domain.PromoRule, error) {
	var rules []*domain.PromoRule
	err := r.db.WithContext(ctx).Order("created_at desc").Find(&rules).Error
	return rules, err
}

func (r *postgresPromoRepository) GetPromoRuleByID(ctx context.Context, id uint) (*domain.PromoRule, error) {
	var rule domain.PromoRule
	err := r.db.WithContext(ctx).First(&rule, id).Error
	if err != nil {
		return nil, err
	}
	return &rule, nil
}

func (r *postgresPromoRepository) UpdatePromoRule(ctx context.Context, rule *domain.PromoRule) error {
	return r.db.WithContext(ctx).Save(rule).Error
}

func (r *postgresPromoRepository) DeletePromoRule(ctx context.Context, id uint) error {
	return r.db.WithContext(ctx).Delete(&domain.PromoRule{}, id).Error
}

// --- Vouchers ---

func (r *postgresPromoRepository) CreateVoucher(ctx context.Context, voucher *domain.Voucher) error {
	return r.db.WithContext(ctx).Create(voucher).Error
}

func (r *postgresPromoRepository) ListVouchers(ctx context.Context) ([]*domain.Voucher, error) {
	var vouchers []*domain.Voucher
	err := r.db.WithContext(ctx).Order("created_at desc").Find(&vouchers).Error
	return vouchers, err
}

func (r *postgresPromoRepository) GetVoucherByCode(ctx context.Context, code string) (*domain.Voucher, error) {
	var voucher domain.Voucher
	err := r.db.WithContext(ctx).Where("code = ?", code).First(&voucher).Error
	if err != nil {
		return nil, err
	}
	return &voucher, nil
}

func (r *postgresPromoRepository) GetVoucherByID(ctx context.Context, id uint) (*domain.Voucher, error) {
	var voucher domain.Voucher
	err := r.db.WithContext(ctx).First(&voucher, id).Error
	if err != nil {
		return nil, err
	}
	return &voucher, nil
}

func (r *postgresPromoRepository) UpdateVoucher(ctx context.Context, voucher *domain.Voucher) error {
	return r.db.WithContext(ctx).Save(voucher).Error
}

func (r *postgresPromoRepository) DeleteVoucher(ctx context.Context, id uint) error {
	return r.db.WithContext(ctx).Delete(&domain.Voucher{}, id).Error
}

func (r *postgresPromoRepository) IncrementVoucherUsage(ctx context.Context, id uint) error {
	return r.db.WithContext(ctx).Model(&domain.Voucher{}).
		Where("id = ? AND current_usage < max_total_usage", id).
		UpdateColumn("current_usage", gorm.Expr("current_usage + ?", 1)).Error
}

func (r *postgresPromoRepository) DecrementVoucherUsage(ctx context.Context, id uint) error {
	return r.db.WithContext(ctx).Model(&domain.Voucher{}).
		Where("id = ? AND current_usage > 0", id).
		UpdateColumn("current_usage", gorm.Expr("current_usage - ?", 1)).Error
}

func (r *postgresPromoRepository) CountActiveVouchers(ctx context.Context) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&domain.Voucher{}).
		Where("is_active = true AND CURRENT_TIMESTAMP BETWEEN start_date AND end_date").
		Count(&count).Error
	return count, err
}

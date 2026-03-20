package service

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/vibecoding/ecommerce/internal/domain"
)

type promoService struct {
	promoRepo domain.PromoRepository
}

func NewPromoService(promoRepo domain.PromoRepository) domain.PromoService {
	return &promoService{promoRepo: promoRepo}
}

// --- Promo Rules ---

func (s *promoService) CreatePromoRule(ctx context.Context, req *domain.PromoRequest) error {
	rule := &domain.PromoRule{
		Name:          req.Name,
		TargetType:    req.TargetType,
		TargetValue:   req.TargetValue,
		DiscountType:  req.DiscountType,
		DiscountValue: req.DiscountValue,
		StartDate:     req.StartDate,
		EndDate:       req.EndDate,
		StackableWith: req.StackableWith,
	}
	return s.promoRepo.CreatePromoRule(ctx, rule)
}

func (s *promoService) GetActivePromoRules(ctx context.Context) ([]*domain.PromoRule, error) {
	return s.promoRepo.GetActivePromoRules(ctx)
}

func (s *promoService) ListPromoRules(ctx context.Context) ([]*domain.PromoRule, error) {
	return s.promoRepo.ListPromoRules(ctx)
}

func (s *promoService) UpdatePromoRule(ctx context.Context, id uint, req *domain.PromoRequest) error {
	rule, err := s.promoRepo.GetPromoRuleByID(ctx, id)
	if err != nil {
		return err
	}
	rule.Name = req.Name
	rule.TargetType = req.TargetType
	rule.TargetValue = req.TargetValue
	rule.DiscountType = req.DiscountType
	rule.DiscountValue = req.DiscountValue
	rule.StartDate = req.StartDate
	rule.EndDate = req.EndDate
	rule.StackableWith = req.StackableWith
	return s.promoRepo.UpdatePromoRule(ctx, rule)
}

func (s *promoService) DeletePromoRule(ctx context.Context, id uint) error {
	return s.promoRepo.DeletePromoRule(ctx, id)
}

// --- Vouchers ---

func (s *promoService) CreateVoucher(ctx context.Context, req *domain.VoucherRequest) error {
	targetType := req.TargetType
	if targetType == "" {
		targetType = "global"
	}
	// 1. Check uniqueness
	existing, _ := s.promoRepo.GetVoucherByCode(ctx, strings.ToUpper(strings.TrimSpace(req.Code)))
	if existing != nil {
		return fmt.Errorf("voucher code already exists")
	}

	voucher := &domain.Voucher{
		Code:            strings.ToUpper(strings.TrimSpace(req.Code)),
		DiscountType:    req.DiscountType,
		DiscountValue:   req.DiscountValue,
		MinPurchase:     req.MinPurchase,
		MaxDiscount:     req.MaxDiscount,
		TargetType:      targetType,
		TargetValue:     req.TargetValue,
		MaxUsagePerUser: req.MaxUsagePerUser,
		StartDate:       req.StartDate,
		EndDate:         req.EndDate,
		MaxTotalUsage:   req.MaxTotalUsage,
		IsActive:        true,
	}
	return s.promoRepo.CreateVoucher(ctx, voucher)
}

func (s *promoService) ListVouchers(ctx context.Context) ([]*domain.Voucher, error) {
	return s.promoRepo.ListVouchers(ctx)
}

func (s *promoService) GetVoucherDetails(ctx context.Context, code string) (*domain.Voucher, error) {
	return s.promoRepo.GetVoucherByCode(ctx, strings.ToUpper(code))
}

func (s *promoService) UpdateVoucher(ctx context.Context, id uint, req *domain.VoucherRequest) error {
	voucher, err := s.promoRepo.GetVoucherByID(ctx, id)
	if err != nil {
		return err
	}
	targetType := req.TargetType
	if targetType == "" {
		targetType = "global"
	}
	voucher.Code = strings.ToUpper(strings.TrimSpace(req.Code))
	voucher.DiscountType = req.DiscountType
	voucher.DiscountValue = req.DiscountValue
	voucher.MinPurchase = req.MinPurchase
	voucher.MaxDiscount = req.MaxDiscount
	voucher.TargetType = targetType
	voucher.TargetValue = req.TargetValue
	voucher.MaxUsagePerUser = req.MaxUsagePerUser
	voucher.StartDate = req.StartDate
	voucher.EndDate = req.EndDate
	voucher.MaxTotalUsage = req.MaxTotalUsage
	voucher.IsActive = req.IsActive
	return s.promoRepo.UpdateVoucher(ctx, voucher)
}

func (s *promoService) DeleteVoucher(ctx context.Context, id uint) error {
	return s.promoRepo.DeleteVoucher(ctx, id)
}

func (s *promoService) ValidateVoucher(ctx context.Context, code string, cartTotal int64, userEmail string) (*domain.Voucher, int64, error) {
	voucher, err := s.promoRepo.GetVoucherByCode(ctx, strings.ToUpper(code))
	if err != nil {
		return nil, 0, fmt.Errorf("voucher not found")
	}

	if !voucher.IsActive {
		return nil, 0, fmt.Errorf("voucher is currently disabled")
	}

	now := time.Now()
	if now.Before(voucher.StartDate) || now.After(voucher.EndDate) {
		return nil, 0, fmt.Errorf("voucher is expired or not yet active")
	}

	if voucher.MinPurchase > 0 && cartTotal < voucher.MinPurchase {
		return nil, 0, fmt.Errorf("minimum purchase of Rp %d required", voucher.MinPurchase)
	}

	if voucher.MaxTotalUsage > 0 && voucher.CurrentUsage >= voucher.MaxTotalUsage {
		return nil, 0, fmt.Errorf("voucher usage limit reached")
	}

	// Check user targeting
	if voucher.TargetType != "" && voucher.TargetType != "global" {
		if userEmail == "" {
			return nil, 0, fmt.Errorf("this voucher is restricted to specific users")
		}
		switch voucher.TargetType {
		case "email":
			if !strings.EqualFold(userEmail, voucher.TargetValue) {
				return nil, 0, fmt.Errorf("this voucher is not valid for your account")
			}
		case "domain":
			// TargetValue should be like "@company.com"
			targetDomain := voucher.TargetValue
			if !strings.HasPrefix(targetDomain, "@") {
				targetDomain = "@" + targetDomain
			}
			emailParts := strings.Split(userEmail, "@")
			if len(emailParts) < 2 || !strings.EqualFold("@"+emailParts[1], targetDomain) {
				return nil, 0, fmt.Errorf("this voucher is only valid for %s email addresses", voucher.TargetValue)
			}
		}
	}

	var discount int64
	if voucher.DiscountType == domain.DiscountTypePercentage {
		discount = cartTotal * voucher.DiscountValue / 100
		if voucher.MaxDiscount > 0 && discount > voucher.MaxDiscount {
			discount = voucher.MaxDiscount
		}
	} else {
		discount = voucher.DiscountValue
		if discount > cartTotal {
			discount = cartTotal
		}
	}

	return voucher, discount, nil
}

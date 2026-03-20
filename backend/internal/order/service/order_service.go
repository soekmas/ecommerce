package service

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"strings"
	"time"

	"github.com/vibecoding/ecommerce/internal/domain"
	"github.com/vibecoding/ecommerce/pkg/biteship"
	"github.com/vibecoding/ecommerce/pkg/mailer"
	"github.com/vibecoding/ecommerce/pkg/xendit"
)
type orderService struct {
	orderRepo       domain.OrderRepository
	userRepo        domain.UserRepository
	productRepo     domain.ProductRepository
	promoRepo       domain.PromoRepository
	biteship        biteship.Client
	xendit          xendit.Client
	mailer          mailer.Mailer
	notificationSvc domain.NotificationService
}

func NewOrderService(
	orderRepo domain.OrderRepository,
	userRepo domain.UserRepository,
	productRepo domain.ProductRepository,
	promoRepo domain.PromoRepository,
	biteship biteship.Client,
	xendit xendit.Client,
	mailer mailer.Mailer,
	notificationSvc domain.NotificationService,
) domain.OrderService {
	return &orderService{
		orderRepo:       orderRepo,
		userRepo:        userRepo,
		productRepo:     productRepo,
		promoRepo:       promoRepo,
		biteship:        biteship,
		xendit:          xendit,
		mailer:          mailer,
		notificationSvc: notificationSvc,
	}
}

func (s *orderService) CreateCheckout(ctx context.Context, userID uint, req *domain.OrderRequest) (*domain.Order, error) {
	// 1. Get User
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, errors.New("user not found")
	}

	// 2. Validate Items & Compile OrderItems, calculate Subtotal
	var orderItems []domain.OrderItem
	var subtotal int64 = 0

	for _, reqItem := range req.Items {
		product, err := s.productRepo.GetProductByID(ctx, reqItem.ProductID)
		if err != nil {
			return nil, fmt.Errorf("product %d not found", reqItem.ProductID)
		}

		if product.Stock < reqItem.Quantity {
			return nil, fmt.Errorf("insufficient stock for product %s", product.Name)
		}

		// Determine effective price: use SpecialPrice if active and targeted to this user
		effectivePrice := product.BasePrice
		now := time.Now()
		if product.SpecialPrice != nil && *product.SpecialPrice > 0 &&
			product.SpecialPriceStart != nil && product.SpecialPriceEnd != nil &&
			now.After(*product.SpecialPriceStart) && now.Before(*product.SpecialPriceEnd) {

			// Check target
			isTargeted := false
			switch product.SpecialPriceTarget {
			case "global", "":
				isTargeted = true
			case "email":
				isTargeted = (user.Email == product.SpecialPriceTargetValue)
			case "domain":
				isTargeted = strings.HasSuffix(user.Email, "@"+product.SpecialPriceTargetValue)
			}

			if isTargeted {
				effectivePrice = *product.SpecialPrice
			}
		}

		orderItems = append(orderItems, domain.OrderItem{
			ProductID: product.ID,
			Quantity:  reqItem.Quantity,
			Price:     effectivePrice, // Save the actual price paid
		})

		subtotal += (effectivePrice * int64(reqItem.Quantity))
	}

	// 3. Application of Targeted Pricing (Phase 1)
	activeRules, _ := s.promoRepo.GetActivePromoRules(ctx)
	var bestRule *domain.PromoRule
	var bestLayer1Discount int64 = 0

	for _, rule := range activeRules {
		isApplicable := false
		if rule.TargetType == domain.TargetTypeGlobal {
			isApplicable = true
		} else if rule.TargetType == domain.TargetTypeUserRole && string(user.Role) == rule.TargetValue {
			isApplicable = true
		} else if rule.TargetType == domain.TargetTypeDomain && strings.HasSuffix(user.Email, "@"+rule.TargetValue) {
			isApplicable = true
		}

		if isApplicable {
			var potentialDiscount int64
			if rule.DiscountType == domain.DiscountTypeFixedPrice {
				potentialDiscount = rule.DiscountValue
			} else if rule.DiscountType == domain.DiscountTypePercentage {
				potentialDiscount = (subtotal * rule.DiscountValue) / 100
			}

			if potentialDiscount > bestLayer1Discount {
				bestLayer1Discount = potentialDiscount
				tempRule := rule // Make a copy
				bestRule = tempRule
			}
		}
	}

	// Calculate Intermediate Total
	intermediateTotal := subtotal - bestLayer1Discount
	if intermediateTotal < 0 {
		intermediateTotal = 0
	}

	// 4. Application of Voucher (Phase 2), Stackable Check
	var appliedVoucher *domain.Voucher
	var layer2Discount int64 = 0

	if req.VoucherCode != "" {
		voucher, err := s.promoRepo.GetVoucherByCode(ctx, req.VoucherCode)
		if err == nil && voucher != nil {
			// Check if we can apply
			canApply := true
			if bestRule != nil && !bestRule.StackableWith {
				canApply = false // Cannot stack
			}
			if voucher.MinPurchase > 0 && intermediateTotal < voucher.MinPurchase {
				canApply = false // Min purchase not met
			}
			if voucher.MaxTotalUsage > 0 && voucher.CurrentUsage >= voucher.MaxTotalUsage {
				canApply = false // Quota full
			}
			// Check date
			now := time.Now()
			if now.Before(voucher.StartDate) || now.After(voucher.EndDate) {
				canApply = false // Expired or not started
			}

			if canApply {
				if voucher.DiscountType == domain.DiscountTypeFixedPrice {
					layer2Discount = voucher.DiscountValue
				} else if voucher.DiscountType == domain.DiscountTypePercentage {
					layer2Discount = (intermediateTotal * voucher.DiscountValue) / 100
					if voucher.MaxDiscount > 0 && layer2Discount > voucher.MaxDiscount {
						layer2Discount = voucher.MaxDiscount
					}
				}
				appliedVoucher = voucher
			}
		}
	}

	finalDiscountAmount := bestLayer1Discount + layer2Discount

	// 5. Calculate Shipping with Biteship (Mocked internal here for demo if staging fails, but implementing true call)
	// We will fake the exact weight for now, normally we sum up product weights
	ratesReq := &biteship.RatesRequest{
		OriginLatitude:        -6.17511, // Jakarta Monas (Warehouse)
		OriginLongitude:       106.82715,
		DestinationLatitude:   req.Latitude,
		DestinationLongitude:  req.Longitude,
		OriginPostalCode:      "10110",
		DestinationPostalCode: req.PostalCode,
		Couriers:              req.CourierName,
		Items: []biteship.DeliveryItem{
			{Name: "Order items", Value: intermediateTotal, Weight: 1000, Quantity: 1}, // 1kg
		},
	}
	
	ratesResp, err := s.biteship.GetRates(ratesReq)
	var shippingCost int64 = 0 // default fallback
	var confirmedCourierSvc string = req.CourierService

	if err == nil && ratesResp != nil && ratesResp.Success && len(ratesResp.Pricing) > 0 {
		for _, rate := range ratesResp.Pricing {
			if rate.ServiceType == req.CourierService {
				shippingCost = rate.Price
				break
			}
		}
	} else {
		slog.Warn("Biteship failed or returned no rates, using fallback shipping cost", "error", err)
		shippingCost = 15000 // Fallback
	}

	// 6. Build final order
	finalAmount := subtotal - finalDiscountAmount + shippingCost
	if finalAmount < 0 {
		finalAmount = shippingCost // Minimum pay is shipping cost
	}

	orderNum := fmt.Sprintf("INV/%s/%d", time.Now().Format("20060102"), time.Now().UnixNano()%10000)

	order := &domain.Order{
		UserID:          user.ID,
		OrderNumber:     orderNum,
		Status:          domain.OrderStatusPendingPayment,
		TotalAmount:     subtotal,
		DiscountAmount:  finalDiscountAmount,
		ShippingCost:    shippingCost,
		FinalAmount:     finalAmount,
		CourierName:     req.CourierName,
		CourierService:  confirmedCourierSvc,
		ShippingAddress: req.ShippingAddress,
		Latitude:        req.Latitude,
		Longitude:       req.Longitude,
		PostalCode:      req.PostalCode,
		Items:           orderItems,
	}

	if bestRule != nil {
		order.AppliedPromoRuleID = &bestRule.ID
	}
	if appliedVoucher != nil {
		order.AppliedVoucherID = &appliedVoucher.ID
	}

	// 7. Save Order and decrement stock
	err = s.orderRepo.CreateOrder(ctx, order)
	if err != nil {
		return nil, err
	}

	// Decrement Stock
	for _, item := range orderItems {
		_ = s.productRepo.DecrementStock(ctx, item.ProductID, item.Quantity)
	}

	// Increment Voucher Usage
	if appliedVoucher != nil {
		_ = s.promoRepo.IncrementVoucherUsage(ctx, appliedVoucher.ID)
	}

	// 8. Create Xendit Invoice
	invoice, err := s.xendit.CreateInvoice(order.OrderNumber, order.FinalAmount, user.Email, user.Name)
	if err != nil {
		slog.Error("Xendit CreateInvoice failed", "error", err)
	} else {
		order.XenditInvoiceID = invoice.ID
		order.PaymentURL = invoice.InvoiceURL
		_ = s.orderRepo.UpdatePaymentInfo(ctx, order.ID, invoice.ID, invoice.InvoiceURL)
	}

	// 9. Send Notification (Background)
	go func() {
		_ = s.mailer.SendOrderStatusEmail(user.Email, user.Name, order.OrderNumber, string(order.Status))
		_ = s.notificationSvc.CreateNotification(ctx, user.ID, "Order Placed", fmt.Sprintf("Your order %s has been successfully placed. Please complete your payment.", order.OrderNumber))
	}()

	return order, nil
}

func (s *orderService) GetShippingRates(ctx context.Context, req *domain.ShippingRateRequest) ([]biteship.CourierRate, error) {
	ratesReq := &biteship.RatesRequest{
		OriginLatitude:       -6.17511, // Warehouse
		OriginLongitude:      106.82715,
		DestinationLatitude:  req.Latitude,
		DestinationLongitude: req.Longitude,
		OriginPostalCode:     "10110",
		DestinationPostalCode: req.PostalCode,
		Couriers:             "jne,sicepat,jnt,anteraja",
		Items: []biteship.DeliveryItem{
			{Name: "Shipping Inquiry", Value: 100000, Weight: 1000, Quantity: 1},
		},
	}

	resp, err := s.biteship.GetRates(ratesReq)
	if err != nil {
		slog.Error("Biteship GetRates failed, returning mock rates", "error", err)
		return []biteship.CourierRate{
			{CourierName: "JNE", CourierCode: "jne", CourierSvc: "Reguler", ServiceType: "reg", Price: 18000, EstimatedDays: "2-3 hari"},
			{CourierName: "SiCepat", CourierCode: "sicepat", CourierSvc: "Halu", ServiceType: "halu", Price: 12000, EstimatedDays: "3-5 hari"},
			{CourierName: "J&T", CourierCode: "jnt", CourierSvc: "EZ", ServiceType: "ez", Price: 19000, EstimatedDays: "2-4 hari"},
		}, nil
	}
	return resp.Pricing, nil
}

func (s *orderService) ProcessPayment(ctx context.Context, orderID uint) error {
	order, err := s.orderRepo.GetOrderByID(ctx, orderID)
	if err != nil {
		return err
	}

	if order.Status != domain.OrderStatusPendingPayment {
		return errors.New("order is not in pending payment status")
	}

	err = s.orderRepo.UpdateOrderStatus(ctx, orderID, domain.OrderStatusPaid)
	if err == nil {
		go func() {
			if order.User.ID != 0 {
				_ = s.mailer.SendOrderStatusEmail(order.User.Email, order.User.Name, order.OrderNumber, string(domain.OrderStatusPaid))
				_ = s.notificationSvc.CreateNotification(ctx, order.UserID, "Payment Confirmed", fmt.Sprintf("Payment for order %s has been confirmed.", order.OrderNumber))
			}
		}()
	}
	return err
}

func (s *orderService) CancelOrder(ctx context.Context, adminID, orderID uint) error {
	order, err := s.orderRepo.GetOrderByID(ctx, orderID)
	if err != nil {
		return err
	}

	if order.Status == domain.OrderStatusCancelled || order.Status == domain.OrderStatusDelivered || order.Status == domain.OrderStatusShipped {
		return errors.New("cannot cancel order in current status")
	}

	err = s.orderRepo.UpdateOrderStatus(ctx, orderID, domain.OrderStatusCancelled)
	if err != nil {
		return err
	}

	// Revert stock
	for _, item := range order.Items {
		_ = s.productRepo.IncrementStock(ctx, item.ProductID, item.Quantity)
	}

	// Revert voucher usage
	if order.AppliedVoucherID != nil {
		_ = s.promoRepo.DecrementVoucherUsage(ctx, *order.AppliedVoucherID)
	}

	go func() {
		if order.User.ID != 0 {
			_ = s.mailer.SendOrderStatusEmail(order.User.Email, order.User.Name, order.OrderNumber, "cancelled")
			_ = s.notificationSvc.CreateNotification(ctx, order.UserID, "Order Cancelled", fmt.Sprintf("Your order %s has been cancelled by the administrator.", order.OrderNumber))
		}
	}()

	return nil
}

func (s *orderService) MarkAsDelivered(ctx context.Context, adminID, orderID uint) error {
	order, err := s.orderRepo.GetOrderByID(ctx, orderID)
	if err != nil {
		return err
	}

	if order.Status != domain.OrderStatusShipped {
		return errors.New("only shipped orders can be marked as delivered")
	}

	err = s.orderRepo.UpdateOrderStatus(ctx, orderID, domain.OrderStatusDelivered)
	if err == nil {
		go func() {
			_ = s.mailer.SendOrderStatusEmail(order.User.Email, order.User.Name, order.OrderNumber, string(domain.OrderStatusDelivered))
			_ = s.notificationSvc.CreateNotification(ctx, order.UserID, "Order Delivered", fmt.Sprintf("Your order %s has been delivered. Thank you for shopping!", order.OrderNumber))
		}()
	}
	return err
}

func (s *orderService) GetShippingLabel(ctx context.Context, adminID, orderID uint) (string, error) {
	order, err := s.orderRepo.GetOrderByID(ctx, orderID)
	if err != nil {
		return "", err
	}

	if order.BiteshipOrderID == "" {
		return "", errors.New("shipping label not available for this order")
	}

	resp, err := s.biteship.GetOrder(order.BiteshipOrderID)
	if err != nil {
		return "", err
	}

	if resp.Courier.Link == "" {
		return "", errors.New("shipping label link is empty from Biteship")
	}

	return resp.Courier.Link, nil
}

func (s *orderService) HandleXenditCallback(ctx context.Context, xenditID, status string) error {
	order, err := s.orderRepo.GetByXenditInvoiceID(ctx, xenditID)
	if err != nil {
		return err
	}

	// Statuses: PAID, SETTLED, EXPIRED
	if status == "PAID" || status == "SETTLED" {
		if order.Status == domain.OrderStatusPendingPayment {
			return s.ProcessPayment(ctx, order.ID)
		}
	} else if status == "EXPIRED" {
		if order.Status == domain.OrderStatusPendingPayment {
			_ = s.orderRepo.UpdateOrderStatus(ctx, order.ID, domain.OrderStatusCancelled)
			// Notification
			go func() {
				if order.User.ID != 0 {
					_ = s.mailer.SendOrderStatusEmail(order.User.Email, order.User.Name, order.OrderNumber, "cancelled (payment expired)")
					_ = s.notificationSvc.CreateNotification(ctx, order.UserID, "Order Cancelled", fmt.Sprintf("Your order %s has been cancelled because the payment session expired.", order.OrderNumber))
				}
			}()
		}
	}

	return nil
}

func (s *orderService) GenerateAWB(ctx context.Context, adminID, orderID uint) error {
	order, err := s.orderRepo.GetOrderByID(ctx, orderID)
	if err != nil {
		return err
	}

	if order.Status != domain.OrderStatusPaid {
		return errors.New("order must be paid before generating AWB")
	}

	// Call Biteship Create Order
	biteshipReq := &biteship.OrderRequest{
		OriginContactName:       "Go Commerce Admin",
		OriginContactPhone:      "08123456789",
		OriginAddress:           "Warehouse Address 1",
		OriginLatitude:          -6.17511,
		OriginLongitude:         106.82715,
		OriginPostalCode:        "10110",
		DestinationContactName:  order.User.Name,
		DestinationContactPhone: order.User.Phone,
		DestinationAddress:      order.ShippingAddress,
		DestinationLatitude:     order.Latitude,
		DestinationLongitude:    order.Longitude,
		DestinationPostalCode:   order.PostalCode,
		Couriers:                order.CourierName,
		Items: []biteship.DeliveryItem{
			{Name: "Ecommerce Order Items", Value: order.FinalAmount - order.ShippingCost, Weight: 1000, Quantity: 1},
		},
	}

	resp, err := s.biteship.CreateOrder(biteshipReq)
	if err != nil {
		return fmt.Errorf("failed to generate AWB with Biteship: %v", err)
	}

	if !resp.Success {
		return fmt.Errorf("biteship error: %s", resp.Message)
	}

	// Update order with AWB and Biteship Order ID
	err = s.orderRepo.UpdateOrderAWB(ctx, orderID, resp.Courier.TrackingID, resp.ID)
	if err == nil {
		go func() {
			if order.User.ID != 0 {
				_ = s.mailer.SendOrderStatusEmail(order.User.Email, order.User.Name, order.OrderNumber, "shipped (AWB: "+resp.Courier.TrackingID+")")
				_ = s.notificationSvc.CreateNotification(ctx, order.UserID, "Order Shipped", fmt.Sprintf("Your order %s is on its way! AWB: %s", order.OrderNumber, resp.Courier.TrackingID))
			}
		}()
	}
	return err
}

func (s *orderService) GetOrder(ctx context.Context, userID uint, role domain.UserRole, orderID uint) (*domain.Order, error) {
	order, err := s.orderRepo.GetOrderByID(ctx, orderID)
	if err != nil {
		return nil, err
	}

	if role != domain.RoleAdmin && order.UserID != userID {
		return nil, errors.New("unauthorized")
	}

	return order, nil
}

func (s *orderService) ListMyOrders(ctx context.Context, userID uint) ([]*domain.Order, error) {
	return s.orderRepo.ListOrdersByUserID(ctx, userID)
}

func (s *orderService) ListAllOrders(ctx context.Context, adminID uint) ([]*domain.Order, error) {
	admin, err := s.userRepo.GetByID(ctx, adminID)
	if err != nil || admin.Role != domain.RoleAdmin {
		return nil, errors.New("unauthorized")
	}

	return s.orderRepo.ListAllOrders(ctx)
}

func (s *orderService) AutoCancelExpiredOrders(ctx context.Context) error {
	expiryTime := time.Now().Add(-24 * time.Hour)
	orders, err := s.orderRepo.GetExpiredPendingOrders(ctx, expiryTime)
	if err != nil {
		return err
	}

	for _, order := range orders {
		slog.Info("Auto-cancelling expired order", "order_number", order.OrderNumber)
		
		err := s.orderRepo.UpdateOrderStatus(ctx, order.ID, domain.OrderStatusCancelled)
		if err != nil {
			slog.Error("Failed to update status for auto-cancel", "order_id", order.ID, "error", err)
			continue
		}

		// Revert stock
		for _, item := range order.Items {
			_ = s.productRepo.IncrementStock(ctx, item.ProductID, item.Quantity)
		}

		// Revert voucher usage
		if order.AppliedVoucherID != nil {
			_ = s.promoRepo.DecrementVoucherUsage(ctx, *order.AppliedVoucherID)
		}

		// Notify user
		go func(o *domain.Order) {
			if o.User.ID != 0 {
				_ = s.mailer.SendOrderStatusEmail(o.User.Email, o.User.Name, o.OrderNumber, "cancelled (payment expired)")
				_ = s.notificationSvc.CreateNotification(ctx, o.UserID, "Order Cancelled", fmt.Sprintf("Your order %s has been cancelled because the payment session expired.", o.OrderNumber))
			}
		}(order)
	}

	return nil
}

func (s *orderService) GetSalesReport(ctx context.Context, adminID uint, filter *domain.OrderFilter) ([]*domain.Order, int64, error) {
	return s.orderRepo.ListSalesReport(ctx, filter)
}

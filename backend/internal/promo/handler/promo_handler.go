package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/vibecoding/ecommerce/internal/domain"
	"github.com/vibecoding/ecommerce/pkg/errors"
)

type PromoHandler struct {
	promoService domain.PromoService
}

func NewPromoHandler(promoService domain.PromoService) *PromoHandler {
	return &PromoHandler{promoService: promoService}
}

// --- Promo Rules ---

func (h *PromoHandler) CreatePromoRule(c *gin.Context) {
	var req domain.PromoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, errors.BadRequestError("invalid request", err))
		return
	}
	if err := h.promoService.CreatePromoRule(c.Request.Context(), &req); err != nil {
		c.JSON(http.StatusInternalServerError, errors.InternalServerError(err))
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "promo rule created"})
}

func (h *PromoHandler) ListPromoRules(c *gin.Context) {
	rules, err := h.promoService.ListPromoRules(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, errors.InternalServerError(err))
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": rules})
}

func (h *PromoHandler) UpdatePromoRule(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, errors.BadRequestError("invalid id", err))
		return
	}
	var req domain.PromoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, errors.BadRequestError("invalid request", err))
		return
	}
	if err := h.promoService.UpdatePromoRule(c.Request.Context(), uint(id), &req); err != nil {
		c.JSON(http.StatusInternalServerError, errors.InternalServerError(err))
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "promo rule updated"})
}

func (h *PromoHandler) DeletePromoRule(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, errors.BadRequestError("invalid id", err))
		return
	}
	if err := h.promoService.DeletePromoRule(c.Request.Context(), uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, errors.InternalServerError(err))
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "promo rule deleted"})
}

func (h *PromoHandler) GetActivePromos(c *gin.Context) {
	rules, err := h.promoService.GetActivePromoRules(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, errors.InternalServerError(err))
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": rules})
}

// --- Vouchers ---

func (h *PromoHandler) CreateVoucher(c *gin.Context) {
	var req domain.VoucherRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, errors.BadRequestError("invalid request", err))
		return
	}
	if err := h.promoService.CreateVoucher(c.Request.Context(), &req); err != nil {
		c.JSON(http.StatusInternalServerError, errors.InternalServerError(err))
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "voucher created"})
}

func (h *PromoHandler) ListVouchers(c *gin.Context) {
	vouchers, err := h.promoService.ListVouchers(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, errors.InternalServerError(err))
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": vouchers})
}

func (h *PromoHandler) UpdateVoucher(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, errors.BadRequestError("invalid id", err))
		return
	}
	var req domain.VoucherRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, errors.BadRequestError("invalid request", err))
		return
	}
	if err := h.promoService.UpdateVoucher(c.Request.Context(), uint(id), &req); err != nil {
		c.JSON(http.StatusInternalServerError, errors.InternalServerError(err))
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "voucher updated"})
}

func (h *PromoHandler) DeleteVoucher(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, errors.BadRequestError("invalid id", err))
		return
	}
	if err := h.promoService.DeleteVoucher(c.Request.Context(), uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, errors.InternalServerError(err))
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "voucher deleted"})
}

// --- Validation (Public, used at checkout) ---

type ValidateVoucherRequest struct {
	Code      string `json:"code" binding:"required"`
	CartTotal int64  `json:"cart_total" binding:"required"`
	UserEmail string `json:"user_email"` // email of the logged-in user
}

func (h *PromoHandler) ValidateVoucher(c *gin.Context) {
	var req ValidateVoucherRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, errors.BadRequestError("invalid request", err))
		return
	}
	voucher, discount, err := h.promoService.ValidateVoucher(c.Request.Context(), req.Code, req.CartTotal, req.UserEmail)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"voucher":     voucher,
		"discount":    discount,
		"final_total": req.CartTotal - discount,
	})
}

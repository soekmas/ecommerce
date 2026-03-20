package handler

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/vibecoding/ecommerce/internal/domain"
	"github.com/vibecoding/ecommerce/pkg/errors"
	"github.com/vibecoding/ecommerce/pkg/jwt"
)

type OrderHandler struct {
	orderService domain.OrderService
}

func NewOrderHandler(orderService domain.OrderService) *OrderHandler {
	return &OrderHandler{orderService: orderService}
}

func (h *OrderHandler) Checkout(c *gin.Context) {
	payloadRaw, _ := c.Get("authorization_payload")
	claims := payloadRaw.(*jwt.JWTClaim)

	var req domain.OrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, errors.BadRequestError("invalid request", err))
		return
	}

	order, err := h.orderService.CreateCheckout(c.Request.Context(), claims.UserID, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, errors.InternalServerError(err))
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "checkout successful", "data": order})
}

func (h *OrderHandler) GetShippingRates(c *gin.Context) {
	var req domain.ShippingRateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, errors.BadRequestError("invalid request", err))
		return
	}

	rates, err := h.orderService.GetShippingRates(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, errors.InternalServerError(err))
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": rates})
}

func (h *OrderHandler) MyOrders(c *gin.Context) {
	payloadRaw, _ := c.Get("authorization_payload")
	claims := payloadRaw.(*jwt.JWTClaim)

	orders, err := h.orderService.ListMyOrders(c.Request.Context(), claims.UserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, errors.InternalServerError(err))
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": orders})
}

// Admin Handlers
func (h *OrderHandler) AdminListAllOrders(c *gin.Context) {
	payloadRaw, _ := c.Get("authorization_payload")
	claims := payloadRaw.(*jwt.JWTClaim)

	orders, err := h.orderService.ListAllOrders(c.Request.Context(), claims.UserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, errors.InternalServerError(err))
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": orders})
}

func (h *OrderHandler) AdminProcessPayment(c *gin.Context) {
	idStr := c.Param("id")
	orderID, _ := strconv.ParseUint(idStr, 10, 32)

	err := h.orderService.ProcessPayment(c.Request.Context(), uint(orderID))
	if err != nil {
		c.JSON(http.StatusBadRequest, errors.BadRequestError(err.Error(), err))
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "payment processed, order status updated to paid"})
}

func (h *OrderHandler) AdminGenerateAWB(c *gin.Context) {
	idStr := c.Param("id")
	orderID, _ := strconv.ParseUint(idStr, 10, 32)

	payloadRaw, _ := c.Get("authorization_payload")
	claims := payloadRaw.(*jwt.JWTClaim)

	err := h.orderService.GenerateAWB(c.Request.Context(), claims.UserID, uint(orderID))
	if err != nil {
		c.JSON(http.StatusBadRequest, errors.BadRequestError(err.Error(), err))
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "AWB generated and shipped successfully"})
}

func (h *OrderHandler) AdminCancelOrder(c *gin.Context) {
	idStr := c.Param("id")
	orderID, _ := strconv.ParseUint(idStr, 10, 32)

	payloadRaw, _ := c.Get("authorization_payload")
	claims := payloadRaw.(*jwt.JWTClaim)

	err := h.orderService.CancelOrder(c.Request.Context(), claims.UserID, uint(orderID))
	if err != nil {
		c.JSON(http.StatusBadRequest, errors.BadRequestError(err.Error(), err))
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "order cancelled and stock reverted"})
}

func (h *OrderHandler) AdminMarkDelivered(c *gin.Context) {
	idStr := c.Param("id")
	orderID, _ := strconv.ParseUint(idStr, 10, 32)

	payloadRaw, _ := c.Get("authorization_payload")
	claims := payloadRaw.(*jwt.JWTClaim)

	err := h.orderService.MarkAsDelivered(c.Request.Context(), claims.UserID, uint(orderID))
	if err != nil {
		c.JSON(http.StatusBadRequest, errors.BadRequestError(err.Error(), err))
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "order marked as delivered"})
}

func (h *OrderHandler) AdminGetLabel(c *gin.Context) {
	idStr := c.Param("id")
	orderID, _ := strconv.ParseUint(idStr, 10, 32)

	payloadRaw, _ := c.Get("authorization_payload")
	claims := payloadRaw.(*jwt.JWTClaim)

	labelURL, err := h.orderService.GetShippingLabel(c.Request.Context(), claims.UserID, uint(orderID))
	if err != nil {
		c.JSON(http.StatusBadRequest, errors.BadRequestError(err.Error(), err))
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": labelURL})
}

func (h *OrderHandler) XenditWebhook(c *gin.Context) {
	var body map[string]interface{}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusOK, gin.H{"status": "ok"}) // Always return ok to Xendit
		return
	}

	// Xendit Invoice Webhook usually has 'id' (invoice id) and 'status'
	xenditID, _ := body["id"].(string)
	status, _ := body["status"].(string)

	if xenditID != "" && status != "" {
		_ = h.orderService.HandleXenditCallback(c.Request.Context(), xenditID, status)
	}

	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

func (h *OrderHandler) AdminGetSalesReport(c *gin.Context) {
	payloadRaw, _ := c.Get("authorization_payload")
	claims := payloadRaw.(*jwt.JWTClaim)

	var filter domain.OrderFilter

	if startStr := c.Query("start_date"); startStr != "" {
		t, _ := time.Parse(time.RFC3339, startStr)
		if !t.IsZero() {
			filter.StartDate = &t
		}
	}
	if endStr := c.Query("end_date"); endStr != "" {
		t, _ := time.Parse(time.RFC3339, endStr)
		if !t.IsZero() {
			filter.EndDate = &t
		}
	}

	filter.Status = domain.OrderStatus(c.Query("status"))
	filter.Search = c.Query("search")
	filter.Limit, _ = strconv.Atoi(c.DefaultQuery("limit", "10"))
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	filter.Offset = (page - 1) * filter.Limit

	orders, total, err := h.orderService.GetSalesReport(c.Request.Context(), claims.UserID, &filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, errors.InternalServerError(err))
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": orders,
		"meta": gin.H{
			"total": total,
			"page":  page,
			"limit": filter.Limit,
		},
	})
}

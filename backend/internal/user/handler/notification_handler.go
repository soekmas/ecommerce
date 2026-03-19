package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/vibecoding/ecommerce/internal/domain"
	"github.com/vibecoding/ecommerce/pkg/errors"
)

type NotificationHandler struct {
	notificationService domain.NotificationService
}

func NewNotificationHandler(notificationService domain.NotificationService) *NotificationHandler {
	return &NotificationHandler{
		notificationService: notificationService,
	}
}

func (h *NotificationHandler) GetMyNotifications(c *gin.Context) {
	userID := c.MustGet("user_id").(uint)
	
	notifications, err := h.notificationService.GetMyNotifications(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, errors.InternalServerError(err))
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"data": notifications})
}

func (h *NotificationHandler) MarkAsRead(c *gin.Context) {
	userID := c.MustGet("user_id").(uint)
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, errors.BadRequestError("invalid notification id", err))
		return
	}
	
	err = h.notificationService.MarkAsRead(c.Request.Context(), userID, uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, errors.InternalServerError(err))
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"message": "notification marked as read"})
}

func (h *NotificationHandler) MarkAllAsRead(c *gin.Context) {
	userID := c.MustGet("user_id").(uint)
	
	err := h.notificationService.MarkAllAsRead(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, errors.InternalServerError(err))
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"message": "all notifications marked as read"})
}

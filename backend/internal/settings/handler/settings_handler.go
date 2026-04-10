package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/vibecoding/ecommerce/internal/domain"
	"github.com/vibecoding/ecommerce/pkg/errors"
)

type SettingHandler struct {
	service domain.SettingService
}

func NewSettingHandler(service domain.SettingService) *SettingHandler {
	return &SettingHandler{service: service}
}

func (h *SettingHandler) GetSettings(c *gin.Context) {
	settings, err := h.service.GetSettings(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, errors.InternalServerError(err))
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": settings})
}

func (h *SettingHandler) UpdateSettings(c *gin.Context) {
	var req domain.UpdateSettingsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, errors.BadRequestError("invalid request", err))
		return
	}

	if err := h.service.UpdateSettings(c.Request.Context(), req.Settings); err != nil {
		c.JSON(http.StatusInternalServerError, errors.InternalServerError(err))
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "settings updated"})
}

package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/vibecoding/ecommerce/internal/domain"
	"github.com/vibecoding/ecommerce/pkg/errors"
	"github.com/vibecoding/ecommerce/pkg/jwt"
)

type AdminUserHandler struct {
	userService domain.UserService
}

func NewAdminUserHandler(userService domain.UserService) *AdminUserHandler {
	return &AdminUserHandler{userService: userService}
}

func (h *AdminUserHandler) GetPendingUsers(c *gin.Context) {
	// Need to extract admin ID from token
	payload, exists := c.Get("authorization_payload")
	if !exists {
		c.JSON(http.StatusUnauthorized, errors.UnauthorizedError("payload not found", nil))
		return
	}

	claims := payload.(*jwt.JWTClaim)

	users, err := h.userService.GetPendingUsers(c.Request.Context(), claims.UserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, errors.InternalServerError(err))
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": users})
}

func (h *AdminUserHandler) ApproveUser(c *gin.Context) {
	targetIDStr := c.Param("id")
	targetID, err := strconv.ParseUint(targetIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, errors.BadRequestError("invalid user id", err))
		return
	}

	payload, _ := c.Get("authorization_payload")
	claims := payload.(*jwt.JWTClaim)

	err = h.userService.ApproveUser(c.Request.Context(), claims.UserID, uint(targetID))
	if err != nil {
		c.JSON(http.StatusBadRequest, errors.BadRequestError(err.Error(), err))
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "user approved successfully"})
}

func (h *AdminUserHandler) GetDashboardStats(c *gin.Context) {
	payload, _ := c.Get("authorization_payload")
	claims := payload.(*jwt.JWTClaim)

	stats, err := h.userService.GetDashboardStats(c.Request.Context(), claims.UserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, errors.InternalServerError(err))
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": stats})
}

func (h *AdminUserHandler) GetAllUsers(c *gin.Context) {
	payload, exists := c.Get("authorization_payload")
	if !exists {
		c.JSON(http.StatusUnauthorized, errors.UnauthorizedError("payload not found", nil))
		return
	}

	claims := payload.(*jwt.JWTClaim)

	users, err := h.userService.GetAllUsers(c.Request.Context(), claims.UserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, errors.InternalServerError(err))
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": users})
}

func (h *AdminUserHandler) CreateUser(c *gin.Context) {
	var req domain.AdminCreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, errors.BadRequestError("invalid request body", err))
		return
	}

	payload, _ := c.Get("authorization_payload")
	claims := payload.(*jwt.JWTClaim)

	err := h.userService.AdminCreateUser(c.Request.Context(), claims.UserID, &req)
	if err != nil {
		c.JSON(http.StatusBadRequest, errors.BadRequestError(err.Error(), err))
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "user created successfully"})
}

func (h *AdminUserHandler) UpdateUser(c *gin.Context) {
	targetIDStr := c.Param("id")
	targetID, err := strconv.ParseUint(targetIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, errors.BadRequestError("invalid user id", err))
		return
	}

	var req domain.AdminUpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, errors.BadRequestError("invalid request body", err))
		return
	}

	payload, _ := c.Get("authorization_payload")
	claims := payload.(*jwt.JWTClaim)

	err = h.userService.AdminUpdateUser(c.Request.Context(), claims.UserID, uint(targetID), &req)
	if err != nil {
		c.JSON(http.StatusBadRequest, errors.BadRequestError(err.Error(), err))
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "user updated successfully"})
}

func (h *AdminUserHandler) DeleteUser(c *gin.Context) {
	targetIDStr := c.Param("id")
	targetID, err := strconv.ParseUint(targetIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, errors.BadRequestError("invalid user id", err))
		return
	}

	payload, _ := c.Get("authorization_payload")
	claims := payload.(*jwt.JWTClaim)

	err = h.userService.AdminDeleteUser(c.Request.Context(), claims.UserID, uint(targetID))
	if err != nil {
		c.JSON(http.StatusBadRequest, errors.BadRequestError(err.Error(), err))
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "user deleted successfully"})
}

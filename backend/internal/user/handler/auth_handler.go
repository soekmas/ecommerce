package handler

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/redis/go-redis/v9"
	"github.com/vibecoding/ecommerce/internal/domain"
	pkgErrors "github.com/vibecoding/ecommerce/pkg/errors"
	"github.com/vibecoding/ecommerce/pkg/jwt"
)

type AuthHandler struct {
	userService domain.UserService
	redisClient *redis.Client
}

func NewAuthHandler(userService domain.UserService, redisClient *redis.Client) *AuthHandler {
	return &AuthHandler{
		userService: userService,
		redisClient: redisClient,
	}
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req domain.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		slog.Error("Registration validation failed", "error", err)
		
		// Custom user-friendly error messages
		if verr, ok := err.(validator.ValidationErrors); ok {
			for _, f := range verr {
				if f.Field() == "Password" && f.Tag() == "min" {
					c.JSON(http.StatusBadRequest, pkgErrors.BadRequestError("Password must be at least 6 characters long", err))
					return
				}
				if f.Tag() == "email" {
					c.JSON(http.StatusBadRequest, pkgErrors.BadRequestError("Please enter a valid email address", err))
					return
				}
			}
		}

		c.JSON(http.StatusBadRequest, pkgErrors.BadRequestError("invalid request body", err))
		return
	}

	err := h.userService.Register(c.Request.Context(), &req)
	if err != nil {
		if strings.Contains(err.Error(), "email already") {
			c.JSON(http.StatusConflict, pkgErrors.NewAPIError(http.StatusConflict, "Email already signed up", err))
			return
		}
		c.JSON(http.StatusInternalServerError, pkgErrors.InternalServerError(err))
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "user registered successfully. please check your email for verification."})
}

func (h *AuthHandler) VerifyEmail(c *gin.Context) {
	token := c.Query("token")
	if token == "" {
		c.JSON(http.StatusBadRequest, pkgErrors.BadRequestError("token is required", nil))
		return
	}

	err := h.userService.VerifyEmail(c.Request.Context(), token)
	if err != nil {
		c.JSON(http.StatusBadRequest, pkgErrors.BadRequestError(err.Error(), err))
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "email verified successfully. your account is now active as a customer."})
}

func (h *AuthHandler) ResendVerification(c *gin.Context) {
	var req domain.ResendVerificationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, pkgErrors.BadRequestError("invalid request body", err))
		return
	}

	err := h.userService.ResendVerification(c.Request.Context(), req.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, pkgErrors.InternalServerError(err))
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "verification email sent successfully."})
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req domain.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, pkgErrors.BadRequestError("invalid request body", err))
		return
	}

	resp, err := h.userService.Login(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusUnauthorized, pkgErrors.UnauthorizedError(err.Error(), err))
		return
	}

	// Just for nicer response formatting, usually we map this
	c.JSON(http.StatusOK, gin.H{
		"token": resp.Token,
		"user": gin.H{
			"id":    resp.User.ID,
			"name":  resp.User.Name,
			"email": resp.User.Email,
			"role":  resp.User.Role,
		},
	})
}

func (h *AuthHandler) GetProfile(c *gin.Context) {
	payload, _ := c.Get("authorization_payload")
	claims := payload.(*jwt.JWTClaim)
	userID := claims.UserID
	
	user, err := h.userService.GetProfile(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, pkgErrors.InternalServerError(err))
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"data": user})
}

func (h *AuthHandler) UpdateProfile(c *gin.Context) {
	userID := c.MustGet("user_id").(uint)
	
	var req domain.UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, pkgErrors.BadRequestError("invalid request body", err))
		return
	}
	
	err := h.userService.UpdateProfile(c.Request.Context(), userID, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, pkgErrors.InternalServerError(err))
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"message": "profile updated successfully"})
}

func (h *AuthHandler) SearchLocation(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		c.JSON(http.StatusBadRequest, pkgErrors.BadRequestError("query is required", nil))
		return
	}

	// 1. Try Cache (v2 for addressdetails)
	cacheKey := fmt.Sprintf("location_search_v2:%s", strings.ToLower(query))
	if h.redisClient != nil {
		if cached, err := h.redisClient.Get(c.Request.Context(), cacheKey).Result(); err == nil {
			var result interface{}
			json.Unmarshal([]byte(cached), &result)
			c.JSON(http.StatusOK, result)
			return
		}
	}

	// 2. Fetch from Nominatim
	searchURL := fmt.Sprintf("https://nominatim.openstreetmap.org/search?format=json&q=%s&countrycodes=id&limit=5&addressdetails=1", url.QueryEscape(query))
	
	req, _ := http.NewRequest("GET", searchURL, nil)
	// Improved User-Agent contact info
	req.Header.Set("User-Agent", "Go-Commerce-Store-App/1.0 (contact: info@gocommerce.local)")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, pkgErrors.InternalServerError(err))
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode == 429 {
		c.JSON(http.StatusTooManyRequests, pkgErrors.NewAPIError(http.StatusTooManyRequests, "Location service is busy. Please try again in a moment.", nil))
		return
	}

	if resp.StatusCode != http.StatusOK {
		c.JSON(resp.StatusCode, pkgErrors.NewAPIError(resp.StatusCode, "failed to fetch from nominatim", nil))
		return
	}

	var result interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		c.JSON(http.StatusInternalServerError, pkgErrors.InternalServerError(err))
		return
	}

	// 3. Save to Cache (24 hours for location searches)
	if h.redisClient != nil {
		jsonData, _ := json.Marshal(result)
		h.redisClient.Set(c.Request.Context(), cacheKey, jsonData, 24*time.Hour)
	}

	c.JSON(http.StatusOK, result)
}

func (h *AuthHandler) ReverseGeocode(c *gin.Context) {
	lat := c.Query("lat")
	lon := c.Query("lon")
	if lat == "" || lon == "" {
		c.JSON(http.StatusBadRequest, pkgErrors.BadRequestError("lat and lon are required", nil))
		return
	}

	// 1. Try Cache (v2 for addressdetails)
	cacheKey := fmt.Sprintf("reverse_geocode_v2:%s:%s", lat, lon)
	if h.redisClient != nil {
		if cached, err := h.redisClient.Get(c.Request.Context(), cacheKey).Result(); err == nil {
			var result interface{}
			json.Unmarshal([]byte(cached), &result)
			c.JSON(http.StatusOK, result)
			return
		}
	}

	// 2. Fetch from Nominatim
	reverseURL := fmt.Sprintf("https://nominatim.openstreetmap.org/reverse?format=json&lat=%s&lon=%s&zoom=18&addressdetails=1", lat, lon)
	
	req, _ := http.NewRequest("GET", reverseURL, nil)
	req.Header.Set("User-Agent", "Go-Commerce-Store-App/1.0 (contact: info@gocommerce.local)")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, pkgErrors.InternalServerError(err))
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode == 429 {
		c.JSON(http.StatusTooManyRequests, pkgErrors.NewAPIError(http.StatusTooManyRequests, "Location service is busy. Please try again in a moment.", nil))
		return
	}

	var result interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		c.JSON(http.StatusInternalServerError, pkgErrors.InternalServerError(err))
		return
	}

	// 3. Save to Cache
	if h.redisClient != nil {
		jsonData, _ := json.Marshal(result)
		h.redisClient.Set(c.Request.Context(), cacheKey, jsonData, 24*time.Hour)
	}

	c.JSON(http.StatusOK, result)
}

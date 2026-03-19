package middleware

import (
	"log/slog"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/vibecoding/ecommerce/pkg/errors"
	"github.com/vibecoding/ecommerce/pkg/jwt"
)

const (
	authorizationHeaderKey  = "authorization"
	authorizationTypeBearer = "bearer"
	authorizationPayloadKey = "authorization_payload"
)

func AuthMiddleware(tokenMaker jwt.TokenMaker) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		authorizationHeader := ctx.GetHeader(authorizationHeaderKey)

		if len(authorizationHeader) == 0 {
			err := errors.UnauthorizedError("authorization header is not provided", nil)
			ctx.AbortWithStatusJSON(http.StatusUnauthorized, err)
			return
		}

		fields := strings.Fields(authorizationHeader)
		if len(fields) < 2 {
			err := errors.UnauthorizedError("invalid authorization header format", nil)
			ctx.AbortWithStatusJSON(http.StatusUnauthorized, err)
			return
		}

		authorizationType := strings.ToLower(fields[0])
		if authorizationType != authorizationTypeBearer {
			err := errors.UnauthorizedError("unsupported authorization type", nil)
			ctx.AbortWithStatusJSON(http.StatusUnauthorized, err)
			return
		}

		accessToken := fields[1]
		payload, err := tokenMaker.VerifyToken(accessToken)
		if err != nil {
			slog.Warn("Failed to verify token", "error", err)
			apiErr := errors.UnauthorizedError("invalid or expired token", err)
			ctx.AbortWithStatusJSON(http.StatusUnauthorized, apiErr)
			return
		}

		ctx.Set(authorizationPayloadKey, payload)
		ctx.Set("user_id", payload.UserID)
		ctx.Next()
	}
}

func RequireRole(roles ...string) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		payloadRaw, exists := ctx.Get(authorizationPayloadKey)
		if !exists {
			ctx.AbortWithStatusJSON(http.StatusUnauthorized, errors.UnauthorizedError("authorization required", nil))
			return
		}

		payload, ok := payloadRaw.(*jwt.JWTClaim)
		if !ok {
			ctx.AbortWithStatusJSON(http.StatusInternalServerError, errors.InternalServerError(nil))
			return
		}

		hasRole := false
		for _, role := range roles {
			if payload.Role == role {
				hasRole = true
				break
			}
		}

		if !hasRole {
			ctx.AbortWithStatusJSON(http.StatusForbidden, errors.NewAPIError(http.StatusForbidden, "forbidden resource", nil))
			return
		}

		ctx.Next()
	}
}

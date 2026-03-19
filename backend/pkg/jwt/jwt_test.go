package jwt

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/vibecoding/ecommerce/config"
)

func TestJWTMaker(t *testing.T) {
	cfg := &config.Config{
		JWTSecret: "my_super_secret_key_for_testing",
		JWTExpire: 1, // 1 hour
	}

	maker := NewJWTMaker(cfg)
	require.NotNil(t, maker)

	userID := uint(1)
	email := "test@example.com"
	role := "customer"

	t.Run("Generate and Verify Token Successfully", func(t *testing.T) {
		token, err := maker.GenerateToken(userID, email, role)
		require.NoError(t, err)
		require.NotEmpty(t, token)

		claims, err := maker.VerifyToken(token)
		require.NoError(t, err)
		require.NotNil(t, claims)

		assert.Equal(t, userID, claims.UserID)
		assert.Equal(t, email, claims.Email)
		assert.Equal(t, role, claims.Role)
		
		// Token should not be expired yet
		assert.True(t, claims.ExpiresAt.Time.After(time.Now()))
	})

	t.Run("Verify Invalid Token String", func(t *testing.T) {
		claims, err := maker.VerifyToken("invalid.token.string")
		require.Error(t, err)
		require.Nil(t, claims)
	})
}

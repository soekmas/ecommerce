package errors

import (
	"errors"
	"net/http"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestAPIErrorFunctions(t *testing.T) {
	t.Run("InternalServerError", func(t *testing.T) {
		cause := errors.New("database connection failed")
		apiErr := InternalServerError(cause)

		assert.Equal(t, http.StatusInternalServerError, apiErr.StatusCode)
		assert.Equal(t, "Internal server error", apiErr.Message)
		assert.Equal(t, cause, apiErr.Err)
		assert.Contains(t, apiErr.Error(), "database connection failed")
		assert.Contains(t, apiErr.Error(), "Internal server error")
	})

	t.Run("BadRequestError", func(t *testing.T) {
		cause := errors.New("invalid email format")
		apiErr := BadRequestError("Validation failed", cause)

		assert.Equal(t, http.StatusBadRequest, apiErr.StatusCode)
		assert.Equal(t, "Validation failed", apiErr.Message)
		assert.Equal(t, cause, apiErr.Err)
	})

	t.Run("UnauthorizedError", func(t *testing.T) {
		apiErr := UnauthorizedError("Missing token", nil)

		assert.Equal(t, http.StatusUnauthorized, apiErr.StatusCode)
		assert.Equal(t, "Missing token", apiErr.Message)
		assert.Nil(t, apiErr.Err)
		assert.Equal(t, "Missing token", apiErr.Error())
	})
}

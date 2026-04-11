package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// MaxBodySizeMiddleware globally limits the size of the incoming HTTP request payload.
// If the payload exceeds the limit, the connection will be blocked and returns an error without loading the payload into memory.
func MaxBodySizeMiddleware(maxBytes int64) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Ensure that the request body itself is restricted to reading 'maxBytes'.
		// http.MaxBytesReader will return an error on Read() if it attempts to read beyond the limit.
		c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxBytes)
		
		c.Next()
	}
}

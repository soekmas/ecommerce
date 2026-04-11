package middleware

import (
	"github.com/gin-gonic/gin"
)

// SecurityHeadersMiddleware adds essential HTTP security headers to all API responses
func SecurityHeadersMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Prevent Clickjacking
		c.Writer.Header().Set("X-Frame-Options", "DENY")
		// Prevent MIME-sniffing
		c.Writer.Header().Set("X-Content-Type-Options", "nosniff")
		// Enable Cross-Site Scripting (XSS) filter
		c.Writer.Header().Set("X-XSS-Protection", "1; mode=block")
		// Enforce TLS (HTTPS) connections. Note: we use a long max-age.
		c.Writer.Header().Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
		
		c.Next()
	}
}

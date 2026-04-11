package middleware

import (
	"net/http"
	"sync"

	"github.com/gin-gonic/gin"
	"golang.org/x/time/rate"
)

// IPVisitor struct to hold the rate limiter and the last seen time
type IPVisitor struct {
	limiter  *rate.Limiter
}

// Global variable to store rate limiters per IP Address
var (
	visitors      = make(map[string]*IPVisitor)
	authVisitors  = make(map[string]*IPVisitor)
	visitorsMutex sync.Mutex
	authMutex     sync.Mutex
)

// getVisitor is a helper function to retrieve or create a rate limiter for a given IP in the general global pool.
// We use a high capacity token bucket e.g., 100 req/sec.
func getVisitor(ip string) *rate.Limiter {
	visitorsMutex.Lock()
	defer visitorsMutex.Unlock()

	v, exists := visitors[ip]
	if !exists {
		// rate.Limit(100) events per second, with a burst capacity of 150
		limiter := rate.NewLimiter(rate.Limit(100), 150)
		visitors[ip] = &IPVisitor{limiter: limiter}
		return limiter
	}

	return v.limiter
}

// getAuthVisitor is a helper function for authentication endpoints which require stricter controls.
func getAuthVisitor(ip string) *rate.Limiter {
	authMutex.Lock()
	defer authMutex.Unlock()

	v, exists := authVisitors[ip]
	if !exists {
		// Strict limit: 5 req/sec, burst of 10
		limiter := rate.NewLimiter(rate.Limit(5), 10)
		authVisitors[ip] = &IPVisitor{limiter: limiter}
		return limiter
	}

	return v.limiter
}

// RateLimitMiddleware applies a general rate limit to all protected / general routes.
func RateLimitMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		ip := c.ClientIP()
		limiter := getVisitor(ip)

		if !limiter.Allow() {
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"error":   "Too many requests",
				"message": "Kamu telah mengirim terlalu banyak permintaan. Silakan tunggu sejenak.",
			})
			return
		}

		c.Next()
	}
}

// StrictAuthRateLimitMiddleware applies a much tighter rate limit to prevent brute force attacks on /login and /register.
func StrictAuthRateLimitMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		ip := c.ClientIP()
		limiter := getAuthVisitor(ip)

		if !limiter.Allow() {
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"error":   "Too many login attempts",
				"message": "Sistem mendeteksi terlalu banyak percobaan. Silakan coba lagi nanti.",
			})
			return
		}

		c.Next()
	}
}

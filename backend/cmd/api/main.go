package main

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/vibecoding/ecommerce/config"
	"github.com/vibecoding/ecommerce/internal/domain"
	"github.com/vibecoding/ecommerce/internal/middleware"
	"github.com/vibecoding/ecommerce/internal/order/handler"
	orderRepo "github.com/vibecoding/ecommerce/internal/order/repository"
	orderSvc "github.com/vibecoding/ecommerce/internal/order/service"
	productHandlerPkg "github.com/vibecoding/ecommerce/internal/product/handler"
	productRepo "github.com/vibecoding/ecommerce/internal/product/repository"
	productSvc "github.com/vibecoding/ecommerce/internal/product/service"
	promoHandlerPkg "github.com/vibecoding/ecommerce/internal/promo/handler"
	promoRepo "github.com/vibecoding/ecommerce/internal/promo/repository"
	promoSvc "github.com/vibecoding/ecommerce/internal/promo/service"
	userHandler "github.com/vibecoding/ecommerce/internal/user/handler"
	userRepo "github.com/vibecoding/ecommerce/internal/user/repository"
	userSvc "github.com/vibecoding/ecommerce/internal/user/service"
	uploadHandler "github.com/vibecoding/ecommerce/internal/upload/handler"
	"github.com/vibecoding/ecommerce/pkg/biteship"
	"github.com/vibecoding/ecommerce/pkg/cache"
	"github.com/vibecoding/ecommerce/pkg/database"
	"github.com/vibecoding/ecommerce/pkg/jwt"
	"github.com/vibecoding/ecommerce/pkg/logger"
	"github.com/vibecoding/ecommerce/pkg/mailer"
	"github.com/vibecoding/ecommerce/pkg/xendit"
	promoSchedulerPkg "github.com/vibecoding/ecommerce/internal/promo/scheduler"
	orderSchedulerPkg "github.com/vibecoding/ecommerce/internal/order/scheduler"
)

func main() {
	// Load config
	cfg := config.LoadConfig()

	// Setup logger
	logger.NewLogger(cfg)
	slog.Info("Starting go-commerce API...")

	// Setup Database
	db, err := database.NewPostgresDB(cfg)
	if err != nil {
		slog.Error("Failed to connect to postgres", "error", err)
		os.Exit(1)
	}
	slog.Info("Connected to PostgreSQL successfully", "db", db.Name())

	// Setup Redis
	redisClient, err := cache.NewRedisClient(cfg)
	if err != nil {
		slog.Error("Failed to connect to Redis", "error", err)
		os.Exit(1)
	}
	slog.Info("Connected to Redis successfully", "redis", redisClient.Options().Addr)

	// Dependencies
	jwtMaker := jwt.NewJWTMaker(cfg)
	mailerSvc := mailer.NewSMTPMailer(cfg)
	biteshipClient := biteship.NewBiteshipClient(cfg)
	xenditClient := xendit.NewClient(cfg.XenditSecretKey)

	// --- Repositories (Shared) ---
	userRepoImpl := userRepo.NewPostgresUserRepository(db)
	productRepoImpl := productRepo.NewPostgresProductRepository(db)
	promoRepoImpl := promoRepo.NewPostgresPromoRepository(db)
	orderRepoImpl := orderRepo.NewPostgresOrderRepository(db)
	notificationRepoImpl := userRepo.NewPostgresNotificationRepository(db)

	// --- Services & Handlers ---
	
	// User Module
	userService := userSvc.NewUserService(userRepoImpl, productRepoImpl, orderRepoImpl, promoRepoImpl, jwtMaker, mailerSvc)
	authHandler := userHandler.NewAuthHandler(userService, redisClient)
	adminUserHandler := userHandler.NewAdminUserHandler(userService)

	// Product Module
	productService := productSvc.NewProductService(productRepoImpl)
	productHandler := productHandlerPkg.NewProductHandler(productService)

	// Promo Module
	promoService := promoSvc.NewPromoService(promoRepoImpl)
	promoHandler := promoHandlerPkg.NewPromoHandler(promoService)

	// Upload Module
	uploadHdl := uploadHandler.NewUploadHandler()

	// Notification Module
	notificationService := userSvc.NewNotificationService(notificationRepoImpl)
	notificationHandler := userHandler.NewNotificationHandler(notificationService)

	// Order Module
	orderService := orderSvc.NewOrderService(orderRepoImpl, userRepoImpl, productRepoImpl, promoRepoImpl, biteshipClient, xenditClient, mailerSvc, notificationService)
	orderHandler := handler.NewOrderHandler(orderService)

	// --- Schedulers ---
	promoScheduler := promoSchedulerPkg.NewVoucherScheduler(db)
	go promoScheduler.Start(context.Background())

	orderScheduler := orderSchedulerPkg.NewOrderScheduler(orderService)
	go orderScheduler.Start(context.Background())

	// Setup HTTP Framework (Gin)
	if cfg.AppEnv == "production" {
		gin.SetMode(gin.ReleaseMode)
	}
	r := gin.Default()
	r.Use(gin.Recovery())
	r.Use(middleware.CORSMiddleware())

	// Simple health check endpoint
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "up",
			"db":     db.Name(),
			"redis":  redisClient.Options().Addr,
		})
	})

	// Static files
	r.Static("/uploads", "./uploads")

	// API v1 Routes
	v1 := r.Group("/api/v1")
	{
		// Public Routes
		auth := v1.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.GET("/verify", authHandler.VerifyEmail)
			auth.POST("/resend-verification", authHandler.ResendVerification)
			auth.POST("/login", authHandler.Login)
			auth.GET("/location/search", authHandler.SearchLocation)
			auth.GET("/location/reverse", authHandler.ReverseGeocode)
		}

		catalog := v1.Group("/catalog")
		{
			catalog.GET("/categories", productHandler.GetCategories)
			catalog.GET("/products", productHandler.ListProducts)
			catalog.GET("/products/:id", productHandler.GetProductByID)
			catalog.GET("/promos", promoHandler.GetActivePromos)
			catalog.POST("/voucher/validate", promoHandler.ValidateVoucher)
		}

		// Webhooks
		webhooks := v1.Group("/webhooks")
		{
			webhooks.POST("/xendit", orderHandler.XenditWebhook)
		}

		// User Protected Routes
		userGroup := v1.Group("/user").Use(middleware.AuthMiddleware(jwtMaker))
		{
			userGroup.POST("/shipping/rates", orderHandler.GetShippingRates)
			userGroup.POST("/checkout", orderHandler.Checkout)
			userGroup.GET("/orders", orderHandler.MyOrders)
			userGroup.GET("/notifications", notificationHandler.GetMyNotifications)
			userGroup.PUT("/notifications/:id/read", notificationHandler.MarkAsRead)
			userGroup.PUT("/notifications/read-all", notificationHandler.MarkAllAsRead)
			userGroup.GET("/profile", authHandler.GetProfile)
			userGroup.PUT("/profile", authHandler.UpdateProfile)
		}

		// Admin Protected Routes
		adminRole := string(domain.RoleAdmin)
		admin := v1.Group("/admin").Use(middleware.AuthMiddleware(jwtMaker)).Use(middleware.RequireRole(adminRole))
		{
			// Dashboard
			admin.GET("/stats", adminUserHandler.GetDashboardStats)

			// Users Mgt
			admin.GET("/users", adminUserHandler.GetAllUsers)
			admin.POST("/users", adminUserHandler.CreateUser)
			admin.PUT("/users/:id", adminUserHandler.UpdateUser)
			admin.DELETE("/users/:id", adminUserHandler.DeleteUser)
			admin.GET("/users/pending", adminUserHandler.GetPendingUsers)
			admin.POST("/users/:id/approve", adminUserHandler.ApproveUser)

			// Catalog Mgt
			admin.GET("/categories", productHandler.GetCategories)
			admin.POST("/categories", productHandler.CreateCategory)
			admin.PUT("/categories/:id", productHandler.UpdateCategory)
			admin.DELETE("/categories/:id", productHandler.DeleteCategory)
			admin.POST("/products", productHandler.CreateProduct)
			admin.PUT("/products/:id", productHandler.UpdateProduct)
			admin.DELETE("/products/:id", productHandler.DeleteProduct)

			// Uploads
			admin.POST("/upload", uploadHdl.UploadMultiple)

			// Promos & Vouchers Mgt
			admin.POST("/promorules", promoHandler.CreatePromoRule)
			admin.GET("/promorules", promoHandler.ListPromoRules)
			admin.PUT("/promorules/:id", promoHandler.UpdatePromoRule)
			admin.DELETE("/promorules/:id", promoHandler.DeletePromoRule)

			admin.POST("/vouchers", promoHandler.CreateVoucher)
			admin.GET("/vouchers", promoHandler.ListVouchers)
			admin.PUT("/vouchers/:id", promoHandler.UpdateVoucher)
			admin.DELETE("/vouchers/:id", promoHandler.DeleteVoucher)

			// Order Mgt
			admin.GET("/orders", orderHandler.AdminListAllOrders)
			admin.GET("/reports/sales", orderHandler.AdminGetSalesReport)
			admin.POST("/orders/:id/payment", orderHandler.AdminProcessPayment)
 // Mock payment processor
			admin.POST("/orders/:id/awb", orderHandler.AdminGenerateAWB)
			admin.POST("/orders/:id/cancel", orderHandler.AdminCancelOrder)
			admin.POST("/orders/:id/deliver", orderHandler.AdminMarkDelivered)
			admin.GET("/orders/:id/label", orderHandler.AdminGetLabel)
		}
	}

	// Start server gracefully
	srv := &http.Server{
		Addr:    fmt.Sprintf(":%s", cfg.Port),
		Handler: r,
	}

	go func() {
		slog.Info(fmt.Sprintf("Server listening on port %s", cfg.Port))
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("Failed to start server", "error", err)
			os.Exit(1)
		}
	}()

	// Wait for interrupt signal to gracefully shut down the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	slog.Info("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		slog.Error("Server forced to shutdown", "error", err)
	}

	slog.Info("Server exiting")
}

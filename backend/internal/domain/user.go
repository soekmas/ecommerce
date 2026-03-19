package domain

import (
	"context"
	"errors"
	"time"

	"gorm.io/gorm"
)

var (
	ErrEmailAlreadyExists = errors.New("email already signed up")
)

type UserRole string

const (
	RoleGuest   UserRole = "guest"
	RoleWaiting UserRole = "waiting" // Needs email verification
	RolePending UserRole = "pending" // Needs admin approval
	RoleCustomer UserRole = "customer"
	RoleActive  UserRole = "active" // Default for approved/verified users
	RoleAdmin   UserRole = "admin"
)

type User struct {
	ID                  uint           `gorm:"primaryKey" json:"id"`
	Email               string         `gorm:"uniqueIndex;not null" json:"email"`
	Password            string         `gorm:"not null" json:"-"`
	Name                string         `gorm:"not null" json:"name"`
	Role                UserRole       `gorm:"type:varchar(20);default:'waiting'" json:"role"`
	Phone               string         `json:"phone"`
	Token               string         `gorm:"index" json:"-"` // for email verification
	ActivationExpiresAt *time.Time     `json:"activation_expires_at"`
	Province            string         `json:"province"`
	City                string         `json:"city"`
	District            string         `json:"district"`
	PostalCode          string         `json:"postal_code"`
	FullAddress         string         `json:"full_address"`
	Latitude            float64        `json:"latitude"`
	Longitude           float64        `json:"longitude"`
	CreatedAt           time.Time      `json:"created_at"`
	UpdatedAt           time.Time      `json:"updated_at"`
	DeletedAt           gorm.DeletedAt `gorm:"index" json:"-"`
}

type Notification struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `gorm:"index;not null" json:"user_id"`
	Title     string    `gorm:"not null" json:"title"`
	Message   string    `gorm:"not null" json:"message"`
	IsRead    bool      `gorm:"default:false" json:"is_read"`
	CreatedAt time.Time `json:"created_at"`
}

// UserReqResp
type RegisterRequest struct {
	Name       string `json:"name" binding:"required"`
	Email      string `json:"email" binding:"required,email"`
	Password   string `json:"password" binding:"required,min=6"`
	Province   string `json:"province"`
	City       string `json:"city"`
	District   string `json:"district"`
	PostalCode string `json:"postal_code"`
}

type ResendVerificationRequest struct {
	Email string `json:"email" binding:"required,email"`
}

type UpdateProfileRequest struct {
	Name       string `json:"name" binding:"required"`
	Phone      string  `json:"phone" binding:"required,numeric,min=10,max=15"`
	Province    string  `json:"province" binding:"required"`
	City        string  `json:"city" binding:"required"`
	District    string  `json:"district" binding:"required"`
	PostalCode  string  `json:"postal_code" binding:"required"`
	FullAddress string  `json:"full_address" binding:"required"`
	Latitude    float64 `json:"latitude"`
	Longitude   float64 `json:"longitude"`
}

type AdminStats struct {
	PendingUsers  int64 `json:"pending_users"`
	TotalProducts int64 `json:"total_products"`
	TotalOrders   int64 `json:"total_orders"`
	ActivePromos  int64 `json:"active_promos"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type AdminCreateUserRequest struct {
	Name     string   `json:"name" binding:"required"`
	Email    string   `json:"email" binding:"required,email"`
	Password string   `json:"password" binding:"required,min=6"`
	Role     UserRole `json:"role" binding:"required"`
}

type AdminUpdateUserRequest struct {
	Name  string   `json:"name"`
	Phone string   `json:"phone"`
	Role  UserRole `json:"role"`
}

type AuthResponse struct {
	Token string `json:"token"`
	User  *User  `json:"user"`
}

// Repository Interface
type UserRepository interface {
	Create(ctx context.Context, user *User) error
	GetByID(ctx context.Context, id uint) (*User, error)
	GetByEmail(ctx context.Context, email string) (*User, error)
	GetByToken(ctx context.Context, token string) (*User, error)
	Update(ctx context.Context, user *User) error
	ListPending(ctx context.Context) ([]*User, error)
	ListAll(ctx context.Context) ([]*User, error)
	CountByRole(ctx context.Context, role UserRole) (int64, error)
	Delete(ctx context.Context, id uint) error
}

type NotificationRepository interface {
	Create(ctx context.Context, notification *Notification) error
	ListByUserID(ctx context.Context, userID uint) ([]*Notification, error)
	MarkAsRead(ctx context.Context, id uint) error
	MarkAllAsRead(ctx context.Context, userID uint) error
}

// Service Interface
type UserService interface {
	Register(ctx context.Context, req *RegisterRequest) error
	VerifyEmail(ctx context.Context, token string) error
	ResendVerification(ctx context.Context, email string) error
	Login(ctx context.Context, req *LoginRequest) (*AuthResponse, error)
	ApproveUser(ctx context.Context, adminID, targetUserID uint) error
	GetPendingUsers(ctx context.Context, adminID uint) ([]*User, error)
	GetProfile(ctx context.Context, userID uint) (*User, error)
	UpdateProfile(ctx context.Context, userID uint, req *UpdateProfileRequest) error
	GetDashboardStats(ctx context.Context, adminID uint) (*AdminStats, error)
	GetAllUsers(ctx context.Context, adminID uint) ([]*User, error)
	AdminCreateUser(ctx context.Context, adminID uint, req *AdminCreateUserRequest) error
	AdminUpdateUser(ctx context.Context, adminID, targetUserID uint, req *AdminUpdateUserRequest) error
	AdminDeleteUser(ctx context.Context, adminID, targetUserID uint) error
}

type NotificationService interface {
	GetMyNotifications(ctx context.Context, userID uint) ([]*Notification, error)
	MarkAsRead(ctx context.Context, userID, id uint) error
	MarkAllAsRead(ctx context.Context, userID uint) error
	CreateNotification(ctx context.Context, userID uint, title, message string) error
}

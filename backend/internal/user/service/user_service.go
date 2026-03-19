package service

import (
	"context"
	"errors"
	"log/slog"
	"time"

	"github.com/google/uuid"
	"github.com/vibecoding/ecommerce/internal/domain"
	"github.com/vibecoding/ecommerce/pkg/jwt"
	"github.com/vibecoding/ecommerce/pkg/mailer"
	"golang.org/x/crypto/bcrypt"
)

type userService struct {
	userRepo    domain.UserRepository
	productRepo domain.ProductRepository
	orderRepo   domain.OrderRepository
	promoRepo   domain.PromoRepository
	jwtMaker    jwt.TokenMaker
	mailer      mailer.Mailer
}

func NewUserService(
	userRepo domain.UserRepository,
	productRepo domain.ProductRepository,
	orderRepo domain.OrderRepository,
	promoRepo domain.PromoRepository,
	jwtMaker jwt.TokenMaker,
	mailer mailer.Mailer,
) domain.UserService {
	return &userService{
		userRepo:    userRepo,
		productRepo: productRepo,
		orderRepo:   orderRepo,
		promoRepo:   promoRepo,
		jwtMaker:    jwtMaker,
		mailer:      mailer,
	}
}

func (s *userService) Register(ctx context.Context, req *domain.RegisterRequest) error {
	// Check if email exists
	existingUser, _ := s.userRepo.GetByEmail(ctx, req.Email)
	if existingUser != nil {
		return domain.ErrEmailAlreadyExists
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	verificationToken := uuid.New().String()

	activationExpiry := time.Now().Add(24 * time.Hour)
	user := &domain.User{
		Email:               req.Email,
		Name:                req.Name,
		Password:            string(hashedPassword),
		Role:                domain.RoleWaiting,
		Token:               verificationToken,
		ActivationExpiresAt: &activationExpiry,
		Province:            req.Province,
		City:                req.City,
		District:            req.District,
		PostalCode:          req.PostalCode,
	}

	err = s.userRepo.Create(ctx, user)
	if err != nil {
		return err
	}

	// Send Email
	go func() {
		err := s.mailer.SendVerificationEmail(user.Email, user.Name, user.Token)
		if err != nil {
			slog.Error("Failed to send verification email", "email", user.Email, "error", err)
		}
	}()

	return nil
}

func (s *userService) VerifyEmail(ctx context.Context, token string) error {
	user, err := s.userRepo.GetByToken(ctx, token)
	if err != nil {
		return errors.New("invalid or expired verification token")
	}

	if user.Role != domain.RoleWaiting {
		return errors.New("user already verified")
	}

	// Check expiry
	if user.ActivationExpiresAt != nil && time.Now().After(*user.ActivationExpiresAt) {
		return errors.New("the verification link has expired. please request a new one.")
	}

	// For normal users, auto-activate to RoleCustomer
	user.Role = domain.RoleCustomer
	user.Token = "" // Clear token
	user.ActivationExpiresAt = nil
	user.UpdatedAt = time.Now()

	return s.userRepo.Update(ctx, user)
}

func (s *userService) ResendVerification(ctx context.Context, email string) error {
	user, err := s.userRepo.GetByEmail(ctx, email)
	if err != nil {
		return errors.New("user not found")
	}

	if user.Role != domain.RoleWaiting {
		return errors.New("account is already verified or in a different state")
	}

	newToken := uuid.New().String()
	newExpiry := time.Now().Add(24 * time.Hour)

	user.Token = newToken
	user.ActivationExpiresAt = &newExpiry
	user.UpdatedAt = time.Now()

	err = s.userRepo.Update(ctx, user)
	if err != nil {
		return err
	}

	// Send Email
	go func() {
		err := s.mailer.SendVerificationEmail(user.Email, user.Name, user.Token)
		if err != nil {
			slog.Error("Failed to resend verification email", "email", user.Email, "error", err)
		}
	}()

	return nil
}

func (s *userService) Login(ctx context.Context, req *domain.LoginRequest) (*domain.AuthResponse, error) {
	user, err := s.userRepo.GetByEmail(ctx, req.Email)
	if err != nil {
		return nil, errors.New("invalid email or password")
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password))
	if err != nil {
		return nil, errors.New("invalid email or password")
	}

	if user.Role == domain.RoleWaiting {
		return nil, errors.New("please verify your email first")
	}

	// For special roles that might still need admin approval (RolePending)
	if user.Role == domain.RolePending {
		return nil, errors.New("your account is pending admin approval")
	}

	// standard roles (Customer, Admin, Active) can login
	token, err := s.jwtMaker.GenerateToken(user.ID, user.Email, string(user.Role))
	if err != nil {
		return nil, err
	}

	return &domain.AuthResponse{
		Token: token,
		User:  user,
	}, nil
}

func (s *userService) ApproveUser(ctx context.Context, adminID, targetUserID uint) error {
	admin, err := s.userRepo.GetByID(ctx, adminID)
	if err != nil || admin.Role != domain.RoleAdmin {
		return errors.New("unauthorized action")
	}

	targetUser, err := s.userRepo.GetByID(ctx, targetUserID)
	if err != nil {
		return errors.New("user not found")
	}

	if targetUser.Role != domain.RolePending {
		return errors.New("user is not in pending status")
	}

	targetUser.Role = domain.RoleActive
	targetUser.UpdatedAt = time.Now()

	return s.userRepo.Update(ctx, targetUser)
}

func (s *userService) GetPendingUsers(ctx context.Context, adminID uint) ([]*domain.User, error) {
	admin, err := s.userRepo.GetByID(ctx, adminID)
	if err != nil || admin.Role != domain.RoleAdmin {
		return nil, errors.New("unauthorized action")
	}

	return s.userRepo.ListPending(ctx)
}

func (s *userService) GetProfile(ctx context.Context, userID uint) (*domain.User, error) {
	return s.userRepo.GetByID(ctx, userID)
}

func (s *userService) UpdateProfile(ctx context.Context, userID uint, req *domain.UpdateProfileRequest) error {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return err
	}

	user.Name = req.Name
	user.Phone = req.Phone
	user.Province = req.Province
	user.City = req.City
	user.District = req.District
	user.PostalCode = req.PostalCode
	user.FullAddress = req.FullAddress
	user.Latitude = req.Latitude
	user.Longitude = req.Longitude
	user.UpdatedAt = time.Now()

	return s.userRepo.Update(ctx, user)
}

func (s *userService) GetDashboardStats(ctx context.Context, adminID uint) (*domain.AdminStats, error) {
	admin, err := s.userRepo.GetByID(ctx, adminID)
	if err != nil || admin.Role != domain.RoleAdmin {
		return nil, errors.New("unauthorized action")
	}

	pendingUsers, _ := s.userRepo.CountByRole(ctx, domain.RolePending)
	totalProducts, _ := s.productRepo.CountProducts(ctx)
	totalOrders, _ := s.orderRepo.CountOrders(ctx)
	activePromos, _ := s.promoRepo.CountActiveVouchers(ctx)

	return &domain.AdminStats{
		PendingUsers:  pendingUsers,
		TotalProducts: totalProducts,
		TotalOrders:   totalOrders,
		ActivePromos:  activePromos,
	}, nil
}

func (s *userService) GetAllUsers(ctx context.Context, adminID uint) ([]*domain.User, error) {
	admin, err := s.userRepo.GetByID(ctx, adminID)
	if err != nil || admin.Role != domain.RoleAdmin {
		return nil, errors.New("unauthorized action")
	}

	return s.userRepo.ListAll(ctx)
}

func (s *userService) AdminCreateUser(ctx context.Context, adminID uint, req *domain.AdminCreateUserRequest) error {
	admin, err := s.userRepo.GetByID(ctx, adminID)
	if err != nil || admin.Role != domain.RoleAdmin {
		return errors.New("unauthorized action")
	}

	// Check if email exists
	existingUser, _ := s.userRepo.GetByEmail(ctx, req.Email)
	if existingUser != nil {
		return domain.ErrEmailAlreadyExists
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	user := &domain.User{
		Email:    req.Email,
		Name:     req.Name,
		Password: string(hashedPassword),
		Role:     req.Role,
	}

	return s.userRepo.Create(ctx, user)
}

func (s *userService) AdminUpdateUser(ctx context.Context, adminID, targetUserID uint, req *domain.AdminUpdateUserRequest) error {
	admin, err := s.userRepo.GetByID(ctx, adminID)
	if err != nil || admin.Role != domain.RoleAdmin {
		return errors.New("unauthorized action")
	}

	user, err := s.userRepo.GetByID(ctx, targetUserID)
	if err != nil {
		return errors.New("user not found")
	}

	if req.Name != "" {
		user.Name = req.Name
	}
	if req.Phone != "" {
		user.Phone = req.Phone
	}
	if req.Role != "" {
		user.Role = req.Role
	}
	user.UpdatedAt = time.Now()

	return s.userRepo.Update(ctx, user)
}

func (s *userService) AdminDeleteUser(ctx context.Context, adminID, targetUserID uint) error {
	admin, err := s.userRepo.GetByID(ctx, adminID)
	if err != nil || admin.Role != domain.RoleAdmin {
		return errors.New("unauthorized action")
	}

	// Prevent self-deletion
	if adminID == targetUserID {
		return errors.New("you cannot delete your own admin account")
	}

	return s.userRepo.Delete(ctx, targetUserID)
}

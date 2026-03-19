package service

import (
	"context"
	"github.com/vibecoding/ecommerce/internal/domain"
)

type notificationService struct {
	notificationRepo domain.NotificationRepository
}

func NewNotificationService(notificationRepo domain.NotificationRepository) domain.NotificationService {
	return &notificationService{
		notificationRepo: notificationRepo,
	}
}

func (s *notificationService) GetMyNotifications(ctx context.Context, userID uint) ([]*domain.Notification, error) {
	return s.notificationRepo.ListByUserID(ctx, userID)
}

func (s *notificationService) MarkAsRead(ctx context.Context, userID, id uint) error {
	// Security check: ensure the notification belongs to the user
	notifications, err := s.notificationRepo.ListByUserID(ctx, userID)
	if err != nil {
		return err
	}
	
	belongs := false
	for _, n := range notifications {
		if n.ID == id {
			belongs = true
			break
		}
	}
	
	if !belongs {
		return nil // or error if preferred
	}

	return s.notificationRepo.MarkAsRead(ctx, id)
}

func (s *notificationService) MarkAllAsRead(ctx context.Context, userID uint) error {
	return s.notificationRepo.MarkAllAsRead(ctx, userID)
}

func (s *notificationService) CreateNotification(ctx context.Context, userID uint, title, message string) error {
	notification := &domain.Notification{
		UserID:  userID,
		Title:   title,
		Message: message,
	}
	return s.notificationRepo.Create(ctx, notification)
}

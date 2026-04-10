package service

import (
	"context"

	"github.com/vibecoding/ecommerce/internal/domain"
)

type settingService struct {
	repo domain.SettingRepository
}

func NewSettingService(repo domain.SettingRepository) domain.SettingService {
	return &settingService{repo: repo}
}

func (s *settingService) GetSettings(ctx context.Context) (domain.SettingsResponse, error) {
	settings, err := s.repo.GetAll(ctx)
	if err != nil {
		return nil, err
	}

	res := make(domain.SettingsResponse)
	for _, setting := range settings {
		res[setting.Key] = setting.Value
	}
	return res, nil
}

func (s *settingService) UpdateSettings(ctx context.Context, settings map[string]string) error {
	for key, value := range settings {
		setting := &domain.Setting{
			Key:   key,
			Value: value,
		}
		if err := s.repo.Upsert(ctx, setting); err != nil {
			return err
		}
	}
	return nil
}

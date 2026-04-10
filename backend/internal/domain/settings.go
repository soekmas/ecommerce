package domain

import (
	"context"
	"time"
)

type Setting struct {
	Key       string    `gorm:"primaryKey" json:"key"`
	Value     string    `json:"value"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type SettingsResponse map[string]string

type UpdateSettingsRequest struct {
	Settings map[string]string `json:"settings" binding:"required"`
}

type SettingRepository interface {
	GetByKey(ctx context.Context, key string) (*Setting, error)
	GetAll(ctx context.Context) ([]*Setting, error)
	Upsert(ctx context.Context, setting *Setting) error
}

type SettingService interface {
	GetSettings(ctx context.Context) (SettingsResponse, error)
	UpdateSettings(ctx context.Context, settings map[string]string) error
}

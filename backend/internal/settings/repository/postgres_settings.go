package repository

import (
	"context"

	"github.com/vibecoding/ecommerce/internal/domain"
	"gorm.io/gorm"
)

type postgresSettingRepository struct {
	db *gorm.DB
}

func NewPostgresSettingRepository(db *gorm.DB) domain.SettingRepository {
	db.AutoMigrate(&domain.Setting{})
	return &postgresSettingRepository{db: db}
}

func (r *postgresSettingRepository) GetByKey(ctx context.Context, key string) (*domain.Setting, error) {
	var setting domain.Setting
	err := r.db.WithContext(ctx).Where("key = ?", key).First(&setting).Error
	if err != nil {
		return nil, err
	}
	return &setting, nil
}

func (r *postgresSettingRepository) GetAll(ctx context.Context) ([]*domain.Setting, error) {
	var settings []*domain.Setting
	err := r.db.WithContext(ctx).Find(&settings).Error
	return settings, err
}

func (r *postgresSettingRepository) Upsert(ctx context.Context, setting *domain.Setting) error {
	return r.db.WithContext(ctx).Save(setting).Error
}

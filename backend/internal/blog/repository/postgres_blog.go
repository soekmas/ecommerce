package repository

import (
	"context"

	"github.com/vibecoding/ecommerce/internal/domain"
	pkgErrors "github.com/vibecoding/ecommerce/pkg/errors"
	"gorm.io/gorm"
)

type postgresBlogRepository struct {
	db *gorm.DB
}

func NewPostgresBlogRepository(db *gorm.DB) domain.BlogRepository {
	db.AutoMigrate(&domain.Blog{})
	return &postgresBlogRepository{db: db}
}

func (r *postgresBlogRepository) Create(ctx context.Context, blog *domain.Blog) error {
	return r.db.WithContext(ctx).Create(blog).Error
}

func (r *postgresBlogRepository) GetByID(ctx context.Context, id uint) (*domain.Blog, error) {
	var blog domain.Blog
	err := r.db.WithContext(ctx).First(&blog, id).Error
	if err != nil {
		return nil, pkgErrors.NotFoundError("blog not found", err)
	}
	return &blog, nil
}

func (r *postgresBlogRepository) GetBySlug(ctx context.Context, slug string) (*domain.Blog, error) {
	var blog domain.Blog
	err := r.db.WithContext(ctx).Where("slug = ?", slug).First(&blog).Error
	if err != nil {
		return nil, pkgErrors.NotFoundError("blog not found", err)
	}
	return &blog, nil
}

func (r *postgresBlogRepository) List(ctx context.Context, limit, offset int) ([]*domain.Blog, error) {
	var blogs []*domain.Blog
	q := r.db.WithContext(ctx).Order("created_at desc")
	if limit > 0 {
		q = q.Limit(limit).Offset(offset)
	}
	err := q.Find(&blogs).Error
	return blogs, err
}

func (r *postgresBlogRepository) ListActive(ctx context.Context, limit int) ([]*domain.Blog, error) {
	var blogs []*domain.Blog
	q := r.db.WithContext(ctx).Where("is_active = ?", true).Order("created_at desc")
	if limit > 0 {
		q = q.Limit(limit)
	}
	err := q.Find(&blogs).Error
	return blogs, err
}

func (r *postgresBlogRepository) Update(ctx context.Context, blog *domain.Blog) error {
	return r.db.WithContext(ctx).Save(blog).Error
}

func (r *postgresBlogRepository) Delete(ctx context.Context, id uint) error {
	return r.db.WithContext(ctx).Delete(&domain.Blog{}, id).Error
}

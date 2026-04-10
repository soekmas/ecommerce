package domain

import (
	"context"
	"time"
)

type Blog struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	Title     string    `json:"title" gorm:"not null"`
	Slug      string    `json:"slug" gorm:"not null;uniqueIndex"`
	Excerpt   string    `json:"excerpt"`
	Content   string    `json:"content" gorm:"type:text"`
	ImageURL  string    `json:"image_url"`
	IsActive  bool      `json:"is_active" gorm:"default:true"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type BlogRequest struct {
	Title    string `json:"title" binding:"required"`
	Slug     string `json:"slug"`
	Excerpt  string `json:"excerpt"`
	Content  string `json:"content" binding:"required"`
	ImageURL string `json:"image_url"`
	IsActive bool   `json:"is_active"`
}

type BlogRepository interface {
	Create(ctx context.Context, blog *Blog) error
	GetByID(ctx context.Context, id uint) (*Blog, error)
	GetBySlug(ctx context.Context, slug string) (*Blog, error)
	List(ctx context.Context, limit, offset int) ([]*Blog, error)
	ListActive(ctx context.Context, limit int) ([]*Blog, error)
	Update(ctx context.Context, blog *Blog) error
	Delete(ctx context.Context, id uint) error
}

type BlogService interface {
	CreateBlog(ctx context.Context, req *BlogRequest) (*Blog, error)
	GetBlogByID(ctx context.Context, id uint) (*Blog, error)
	GetBlogBySlug(ctx context.Context, slug string) (*Blog, error)
	ListBlogs(ctx context.Context, limit, offset int) ([]*Blog, error)
	ListActiveBlogs(ctx context.Context, limit int) ([]*Blog, error)
	UpdateBlog(ctx context.Context, id uint, req *BlogRequest) (*Blog, error)
	DeleteBlog(ctx context.Context, id uint) error
}

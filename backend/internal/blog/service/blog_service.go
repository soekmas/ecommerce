package service

import (
	"context"
	"strings"

	"github.com/vibecoding/ecommerce/internal/domain"
)

type blogService struct {
	repo domain.BlogRepository
}

func NewBlogService(repo domain.BlogRepository) domain.BlogService {
	return &blogService{repo: repo}
}

func generateSlug(title string) string {
	slug := strings.ToLower(title)
	slug = strings.ReplaceAll(slug, " ", "-")
	return slug
}

func (s *blogService) CreateBlog(ctx context.Context, req *domain.BlogRequest) (*domain.Blog, error) {
	slug := req.Slug
	if slug == "" {
		slug = generateSlug(req.Title)
	}

	blog := &domain.Blog{
		Title:    req.Title,
		Slug:     slug,
		Excerpt:  req.Excerpt,
		Content:  req.Content,
		ImageURL: req.ImageURL,
		IsActive: req.IsActive,
	}

	if err := s.repo.Create(ctx, blog); err != nil {
		return nil, err
	}

	return blog, nil
}

func (s *blogService) GetBlogByID(ctx context.Context, id uint) (*domain.Blog, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *blogService) GetBlogBySlug(ctx context.Context, slug string) (*domain.Blog, error) {
	return s.repo.GetBySlug(ctx, slug)
}

func (s *blogService) ListBlogs(ctx context.Context, limit, offset int) ([]*domain.Blog, error) {
	return s.repo.List(ctx, limit, offset)
}

func (s *blogService) ListActiveBlogs(ctx context.Context, limit int) ([]*domain.Blog, error) {
	return s.repo.ListActive(ctx, limit)
}

func (s *blogService) UpdateBlog(ctx context.Context, id uint, req *domain.BlogRequest) (*domain.Blog, error) {
	blog, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	blog.Title = req.Title
	if req.Slug != "" {
		blog.Slug = req.Slug
	}
	blog.Excerpt = req.Excerpt
	blog.Content = req.Content
	blog.ImageURL = req.ImageURL
	blog.IsActive = req.IsActive

	if err := s.repo.Update(ctx, blog); err != nil {
		return nil, err
	}

	return blog, nil
}

func (s *blogService) DeleteBlog(ctx context.Context, id uint) error {
	return s.repo.Delete(ctx, id)
}

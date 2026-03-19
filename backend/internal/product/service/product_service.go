package service

import (
	"context"
	"strings"

	"github.com/gosimple/slug"
	"github.com/vibecoding/ecommerce/internal/domain"
)

type productService struct {
	productRepo domain.ProductRepository
}

func NewProductService(productRepo domain.ProductRepository) domain.ProductService {
	return &productService{productRepo: productRepo}
}

func (s *productService) CreateCategory(ctx context.Context, req *domain.CategoryRequest) error {
	categorySlug := req.Slug
	if categorySlug == "" {
		categorySlug = slug.Make(req.Name)
	}

	category := &domain.Category{
		Name:     strings.TrimSpace(req.Name),
		Slug:     categorySlug,
		IsActive: req.IsActive,
	}
	return s.productRepo.CreateCategory(ctx, category)
}

func (s *productService) GetCategories(ctx context.Context) ([]*domain.Category, error) {
	return s.productRepo.GetCategories(ctx)
}

func (s *productService) UpdateCategory(ctx context.Context, id uint, req *domain.CategoryRequest) error {
	categorySlug := req.Slug
	if categorySlug == "" {
		categorySlug = slug.Make(req.Name)
	}

	updatedCategory := &domain.Category{
		ID:       id,
		Name:     strings.TrimSpace(req.Name),
		Slug:     categorySlug,
		IsActive: req.IsActive,
	}
	return s.productRepo.UpdateCategory(ctx, updatedCategory)
}

func (s *productService) DeleteCategory(ctx context.Context, id uint) error {
	return s.productRepo.DeleteCategory(ctx, id)
}

func (s *productService) CreateProduct(ctx context.Context, req *domain.ProductRequest) error {
	// Check duplicate SKU
	if _, err := s.productRepo.GetProductBySKU(ctx, req.SKU); err == nil {
		return domain.ErrDuplicateSKU
	}

	productSlug := req.Slug
	if productSlug == "" {
		productSlug = slug.Make(req.Name)
	}

	// Check duplicate Slug
	if _, err := s.productRepo.GetProductBySlug(ctx, productSlug); err == nil {
		return domain.ErrDuplicateSlug
	}

	product := &domain.Product{
		CategoryID:              req.CategoryID,
		Name:                    strings.TrimSpace(req.Name),
		SKU:                     strings.TrimSpace(req.SKU),
		Slug:                    productSlug,
		Description:             req.Description,
		BasePrice:               req.BasePrice,
		SpecialPrice:            req.SpecialPrice,
		SpecialPriceStart:       req.SpecialPriceStart,
		SpecialPriceEnd:         req.SpecialPriceEnd,
		SpecialPriceTarget:      req.SpecialPriceTarget,
		SpecialPriceTargetValue: req.SpecialPriceTargetValue,
		Stock:                   req.Stock,
		Specifications:          domain.JSONMap(req.Specifications),
		ImageURLs:               domain.JSONArray(req.ImageURLs),
		IsActive:                req.IsActive,
	}
	return s.productRepo.CreateProduct(ctx, product)
}

func (s *productService) GetProductByID(ctx context.Context, id uint) (*domain.Product, error) {
	return s.productRepo.GetProductByID(ctx, id)
}

func (s *productService) ListProducts(ctx context.Context, filter domain.ProductFilter) ([]*domain.Product, error) {
	return s.productRepo.ListProducts(ctx, filter)
}

func (s *productService) UpdateProduct(ctx context.Context, id uint, req *domain.ProductRequest) error {
	product, err := s.productRepo.GetProductByID(ctx, id)
	if err != nil {
		return err
	}

	// Check duplicate SKU if changed
	if req.SKU != product.SKU {
		if _, err := s.productRepo.GetProductBySKU(ctx, req.SKU); err == nil {
			return domain.ErrDuplicateSKU
		}
	}

	productSlug := req.Slug
	if productSlug == "" {
		productSlug = slug.Make(req.Name)
	}

	// Check duplicate Slug if changed
	if productSlug != product.Slug {
		if _, err := s.productRepo.GetProductBySlug(ctx, productSlug); err == nil {
			return domain.ErrDuplicateSlug
		}
	}

	product.CategoryID = req.CategoryID
	product.Name = req.Name
	product.SKU = req.SKU
	product.Slug = productSlug
	product.Description = req.Description
	product.BasePrice = req.BasePrice
	product.SpecialPrice = req.SpecialPrice
	product.SpecialPriceStart = req.SpecialPriceStart
	product.SpecialPriceEnd = req.SpecialPriceEnd
	product.SpecialPriceTarget = req.SpecialPriceTarget
	product.SpecialPriceTargetValue = req.SpecialPriceTargetValue
	product.Stock = req.Stock
	product.Specifications = domain.JSONMap(req.Specifications)
	product.ImageURLs = domain.JSONArray(req.ImageURLs)
	product.IsActive = req.IsActive

	return s.productRepo.UpdateProduct(ctx, product)
}

func (s *productService) DeleteProduct(ctx context.Context, id uint) error {
	return s.productRepo.DeleteProduct(ctx, id)
}

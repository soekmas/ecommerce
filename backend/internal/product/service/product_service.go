package service

import (
	"context"
	"encoding/csv"
	"fmt"
	"io"
	"strconv"
	"strings"
	"time"

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
		SpecialPriceMaxQty:      req.SpecialPriceMaxQty,
		Stock:                   req.Stock,
		Weight:                  req.Weight,
		Specifications:          domain.JSONMap(req.Specifications),
		ImageURLs:               domain.JSONArray(req.ImageURLs),
		IsActive:                req.IsActive,
	}
	return s.productRepo.CreateProduct(ctx, product)
}

func (s *productService) GetProductByID(ctx context.Context, id uint) (*domain.Product, error) {
	return s.productRepo.GetProductByID(ctx, id)
}

func (s *productService) GetProductBySlug(ctx context.Context, slug string) (*domain.Product, error) {
	return s.productRepo.GetProductBySlug(ctx, slug)
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
	product.SpecialPriceMaxQty = req.SpecialPriceMaxQty
	product.Stock = req.Stock
	product.Weight = req.Weight
	product.Specifications = domain.JSONMap(req.Specifications)
	product.ImageURLs = domain.JSONArray(req.ImageURLs)
	product.IsActive = req.IsActive

	return s.productRepo.UpdateProduct(ctx, product)
}

func (s *productService) DeleteProduct(ctx context.Context, id uint) error {
	return s.productRepo.DeleteProduct(ctx, id)
}

func (s *productService) ImportPromos(ctx context.Context, file io.Reader) (int, error) {
	reader := csv.NewReader(file)
	// Skip header
	if _, err := reader.Read(); err != nil {
		return 0, fmt.Errorf("failed to read csv header: %v", err)
	}

	records, err := reader.ReadAll()
	if err != nil {
		return 0, fmt.Errorf("failed to parse csv: %v", err)
	}

	successCount := 0
	for _, record := range records {
		if len(record) < 7 {
			continue // invalid row
		}
		
		sku := strings.TrimSpace(record[0])
		specialPriceStr := strings.TrimSpace(record[1])
		startDateStr := strings.TrimSpace(record[2])
		endDateStr := strings.TrimSpace(record[3])
		targetType := strings.TrimSpace(record[4])
		targetValue := strings.TrimSpace(record[5])
		maxQtyStr := strings.TrimSpace(record[6])

		if sku == "" {
			continue
		}

		product, err := s.productRepo.GetProductBySKU(ctx, sku)
		if err != nil {
			continue // Skip if product SKU not found
		}

		if specialPriceStr == "" {
			// Clear promo
			product.SpecialPrice = nil
			product.SpecialPriceStart = nil
			product.SpecialPriceEnd = nil
			product.SpecialPriceTarget = "global"
			product.SpecialPriceTargetValue = ""
			product.SpecialPriceMaxQty = nil
		} else {
			// Set promo
			if sp, err := strconv.ParseInt(specialPriceStr, 10, 64); err == nil {
				product.SpecialPrice = &sp
			} else {
				continue // Skip if special price is not valid int
			}

			// Parse dates with basic 2006-01-02 check
			layout := "2006-01-02"
			if st, err := time.Parse(layout, startDateStr); err == nil {
				product.SpecialPriceStart = &st
			}
			if ed, err := time.Parse(layout, endDateStr); err == nil {
				// push to the end of the day 23:59:59
				endOfDay := time.Date(ed.Year(), ed.Month(), ed.Day(), 23, 59, 59, 0, ed.Location())
				product.SpecialPriceEnd = &endOfDay
			}

			if targetType == "" {
				targetType = "global"
			}
			product.SpecialPriceTarget = targetType
			product.SpecialPriceTargetValue = targetValue

			if maxQty, err := strconv.Atoi(maxQtyStr); err == nil && maxQty > 0 {
				product.SpecialPriceMaxQty = &maxQty
			} else {
				product.SpecialPriceMaxQty = nil
			}
		}

		// Update product
		if err := s.productRepo.UpdateProduct(ctx, product); err == nil {
			successCount++
		}
	}

	return successCount, nil
}

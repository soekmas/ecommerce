package repository

import (
	"context"

	"github.com/vibecoding/ecommerce/internal/domain"
	"gorm.io/gorm"
)

type postgresProductRepository struct {
	db *gorm.DB
}

func NewPostgresProductRepository(db *gorm.DB) domain.ProductRepository {
	db.AutoMigrate(&domain.Category{}, &domain.Product{})
	return &postgresProductRepository{db: db}
}

func (r *postgresProductRepository) CreateCategory(ctx context.Context, category *domain.Category) error {
	return r.db.WithContext(ctx).Create(category).Error
}

func (r *postgresProductRepository) GetCategories(ctx context.Context) ([]*domain.Category, error) {
	var categories []*domain.Category
	err := r.db.WithContext(ctx).Find(&categories).Error
	return categories, err
}

func (r *postgresProductRepository) UpdateCategory(ctx context.Context, category *domain.Category) error {
	return r.db.WithContext(ctx).Save(category).Error
}

func (r *postgresProductRepository) DeleteCategory(ctx context.Context, id uint) error {
	return r.db.WithContext(ctx).Delete(&domain.Category{}, id).Error
}

func (r *postgresProductRepository) CreateProduct(ctx context.Context, product *domain.Product) error {
	return r.db.WithContext(ctx).Create(product).Error
}

func (r *postgresProductRepository) GetProductByID(ctx context.Context, id uint) (*domain.Product, error) {
	var product domain.Product
	err := r.db.WithContext(ctx).Preload("Category").First(&product, id).Error
	if err != nil {
		return nil, err
	}
	return &product, nil
}

func (r *postgresProductRepository) GetProductBySKU(ctx context.Context, sku string) (*domain.Product, error) {
	var product domain.Product
	err := r.db.WithContext(ctx).Where("sku = ?", sku).First(&product).Error
	if err != nil {
		return nil, err
	}
	return &product, nil
}

func (r *postgresProductRepository) GetProductBySlug(ctx context.Context, slug string) (*domain.Product, error) {
	var product domain.Product
	err := r.db.WithContext(ctx).Where("slug = ?", slug).First(&product).Error
	if err != nil {
		return nil, err
	}
	return &product, nil
}

func (r *postgresProductRepository) ListProducts(ctx context.Context, filter domain.ProductFilter) ([]*domain.Product, error) {
	var products []*domain.Product
	query := r.db.WithContext(ctx).Preload("Category")

	if filter.CategoryID > 0 {
		query = query.Where("category_id = ?", filter.CategoryID)
	}

	if filter.Search != "" {
		searchTerm := "%" + filter.Search + "%"
		query = query.Where("name ILIKE ? OR description ILIKE ? OR sku ILIKE ?", searchTerm, searchTerm, searchTerm)
	}

	if filter.MinPrice > 0 {
		query = query.Where("base_price >= ?", filter.MinPrice)
	}

	if filter.MaxPrice > 0 {
		query = query.Where("base_price <= ?", filter.MaxPrice)
	}

	// Dynamic sorting
	if filter.SortBy != "" {
		column := filter.SortBy
		if column == "price" {
			column = "base_price"
		}
		if filter.Order == "" {
			filter.Order = "asc"
		}
		query = query.Order(column + " " + filter.Order)
	} else {
		query = query.Order("created_at desc") // Default sorting
	}

	err := query.Find(&products).Error
	return products, err
}

func (r *postgresProductRepository) UpdateProduct(ctx context.Context, product *domain.Product) error {
	return r.db.WithContext(ctx).Model(product).Select("*").Save(product).Error
}

func (r *postgresProductRepository) DeleteProduct(ctx context.Context, id uint) error {
	return r.db.WithContext(ctx).Delete(&domain.Product{}, id).Error
}

func (r *postgresProductRepository) DecrementStock(ctx context.Context, productID uint, quantity int) error {
	// Atomic decrement
	return r.db.WithContext(ctx).Model(&domain.Product{}).
		Where("id = ? AND stock >= ?", productID, quantity).
		UpdateColumn("stock", gorm.Expr("stock - ?", quantity)).Error
}

func (r *postgresProductRepository) CountProducts(ctx context.Context) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&domain.Product{}).Count(&count).Error
	return count, err
}

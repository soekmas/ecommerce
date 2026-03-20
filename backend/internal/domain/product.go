package domain

import (
	"context"
	"database/sql/driver"
	"encoding/json"
	"errors"
	"time"

	"gorm.io/gorm"
)

var (
	ErrDuplicateSKU  = errors.New("SKU already exists")
	ErrDuplicateSlug = errors.New("slug already exists")
)

type JSONMap map[string]string

func (j JSONMap) Value() (driver.Value, error) {
	return json.Marshal(j)
}

func (j *JSONMap) Scan(value interface{}) error {
	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("type assertion to []byte failed")
	}
	return json.Unmarshal(bytes, &j)
}

type JSONArray []string

func (j JSONArray) Value() (driver.Value, error) {
	return json.Marshal(j)
}

func (j *JSONArray) Scan(value interface{}) error {
	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("type assertion to []byte failed")
	}
	return json.Unmarshal(bytes, &j)
}

type Category struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	Name      string         `gorm:"uniqueIndex;not null" json:"name"`
	Slug      string         `gorm:"uniqueIndex;not null" json:"slug"`
	IsActive  bool           `gorm:"default:true" json:"is_active"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

type Product struct {
	ID                       uint           `gorm:"primaryKey" json:"id"`
	CategoryID               uint           `gorm:"index;not null" json:"category_id"`
	Category                 Category       `gorm:"foreignKey:CategoryID" json:"category"`
	Name                     string         `gorm:"not null" json:"name"`
	SKU                      string         `gorm:"uniqueIndex;not null" json:"sku"`
	Slug                     string         `gorm:"uniqueIndex;not null" json:"slug"`
	Description              string         `json:"description"`
	BasePrice                int64          `gorm:"not null" json:"base_price"`
	SpecialPrice             *int64         `gorm:"default:null" json:"special_price"`
	SpecialPriceStart        *time.Time     `gorm:"default:null" json:"special_price_start"`
	SpecialPriceEnd          *time.Time     `gorm:"default:null" json:"special_price_end"`
	SpecialPriceTarget       string         `gorm:"type:varchar(20);default:'global'" json:"special_price_target"`       // global | email | domain
	SpecialPriceTargetValue  string         `gorm:"default:''" json:"special_price_target_value"`                         // user@mail.com | @company.com
	Stock                    int            `gorm:"not null;default:0" json:"stock"`
	Specifications           JSONMap        `gorm:"type:jsonb" json:"specifications"`
	ImageURLs                JSONArray      `gorm:"type:jsonb" json:"image_urls"`
	IsActive                 bool           `gorm:"default:true" json:"is_active"`
	CreatedAt                time.Time      `json:"created_at"`
	UpdatedAt                time.Time      `json:"updated_at"`
	DeletedAt                gorm.DeletedAt `gorm:"index" json:"-"`
}

// Request/Response DTOs
type CategoryRequest struct {
	Name     string `json:"name" binding:"required"`
	Slug     string `json:"slug"`
	IsActive bool   `json:"is_active"`
}

type ProductRequest struct {
	CategoryID              uint              `json:"category_id" binding:"required"`
	Name                    string            `json:"name" binding:"required"`
	SKU                     string            `json:"sku" binding:"required"`
	Slug                    string            `json:"slug"`
	Description             string            `json:"description"`
	BasePrice               int64             `json:"base_price" binding:"required,min=0"`
	SpecialPrice            *int64            `json:"special_price"`
	SpecialPriceStart       *time.Time        `json:"special_price_start"`
	SpecialPriceEnd         *time.Time        `json:"special_price_end"`
	SpecialPriceTarget      string            `json:"special_price_target"`       // global | email | domain
	SpecialPriceTargetValue string            `json:"special_price_target_value"` // user@mail.com | @company.com
	Stock                   int               `json:"stock" binding:"required,min=0"`
	Specifications          map[string]string `json:"specifications"`
	ImageURLs               []string          `json:"image_urls"`
	IsActive                bool              `json:"is_active"`
}

type ProductFilter struct {
	CategoryID uint   `json:"category_id"`
	Search     string `json:"search"`
	MinPrice   int64  `json:"min_price"`
	MaxPrice   int64  `json:"max_price"`
	SortBy     string `json:"sort_by"`
	Order      string `json:"order"` // asc | desc
	Limit      int    `json:"limit"`
	Offset     int    `json:"offset"`
}

// Interfaces
type ProductRepository interface {
	CreateCategory(ctx context.Context, category *Category) error
	GetCategories(ctx context.Context) ([]*Category, error)
	UpdateCategory(ctx context.Context, category *Category) error
	DeleteCategory(ctx context.Context, id uint) error

	CreateProduct(ctx context.Context, product *Product) error
	GetProductByID(ctx context.Context, id uint) (*Product, error)
	GetProductBySKU(ctx context.Context, sku string) (*Product, error)
	GetProductBySlug(ctx context.Context, slug string) (*Product, error)
	ListProducts(ctx context.Context, filter ProductFilter) ([]*Product, error)
	UpdateProduct(ctx context.Context, product *Product) error
	DeleteProduct(ctx context.Context, id uint) error

	// For Flash Sales and Checkout
	DecrementStock(ctx context.Context, productID uint, quantity int) error
	IncrementStock(ctx context.Context, productID uint, quantity int) error
	CountProducts(ctx context.Context) (int64, error)
}

type ProductService interface {
	CreateCategory(ctx context.Context, req *CategoryRequest) error
	GetCategories(ctx context.Context) ([]*Category, error)
	UpdateCategory(ctx context.Context, id uint, req *CategoryRequest) error
	DeleteCategory(ctx context.Context, id uint) error

	CreateProduct(ctx context.Context, req *ProductRequest) error
	GetProductByID(ctx context.Context, id uint) (*Product, error)
	ListProducts(ctx context.Context, filter ProductFilter) ([]*Product, error)
	UpdateProduct(ctx context.Context, id uint, req *ProductRequest) error
	DeleteProduct(ctx context.Context, id uint) error
}

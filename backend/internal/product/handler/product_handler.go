package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/vibecoding/ecommerce/internal/domain"
	"github.com/vibecoding/ecommerce/pkg/errors"
)

type ProductHandler struct {
	productService domain.ProductService
}

func NewProductHandler(productService domain.ProductService) *ProductHandler {
	return &ProductHandler{productService: productService}
}

func (h *ProductHandler) CreateCategory(c *gin.Context) {
	var req domain.CategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, errors.BadRequestError("invalid request", err))
		return
	}

	if err := h.productService.CreateCategory(c.Request.Context(), &req); err != nil {
		c.JSON(http.StatusInternalServerError, errors.InternalServerError(err))
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "category created"})
}

func (h *ProductHandler) UpdateCategory(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, errors.BadRequestError("invalid category id", err))
		return
	}

	var req domain.CategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, errors.BadRequestError("invalid request", err))
		return
	}

	if err := h.productService.UpdateCategory(c.Request.Context(), uint(id), &req); err != nil {
		c.JSON(http.StatusInternalServerError, errors.InternalServerError(err))
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "category updated"})
}

func (h *ProductHandler) DeleteCategory(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, errors.BadRequestError("invalid category id", err))
		return
	}

	if err := h.productService.DeleteCategory(c.Request.Context(), uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, errors.InternalServerError(err))
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "category deleted"})
}

func (h *ProductHandler) GetCategories(c *gin.Context) {
	categories, err := h.productService.GetCategories(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, errors.InternalServerError(err))
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": categories})
}

func (h *ProductHandler) CreateProduct(c *gin.Context) {
	var req domain.ProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, errors.BadRequestError("invalid request", err))
		return
	}

	if err := h.productService.CreateProduct(c.Request.Context(), &req); err != nil {
		if err == domain.ErrDuplicateSKU || err == domain.ErrDuplicateSlug {
			c.JSON(http.StatusBadRequest, errors.BadRequestError(err.Error(), err))
			return
		}
		c.JSON(http.StatusInternalServerError, errors.InternalServerError(err))
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "product created"})
}

func (h *ProductHandler) ListProducts(c *gin.Context) {
	filter := domain.ProductFilter{
		Search: c.Query("search"),
		SortBy: c.Query("sort"),
		Order:  c.Query("order"),
	}

	catIDStr := c.Query("category_id")
	if catIDStr != "" {
		id, err := strconv.ParseUint(catIDStr, 10, 32)
		if err == nil {
			filter.CategoryID = uint(id)
		}
	}

	minPriceStr := c.Query("min_price")
	if minPriceStr != "" {
		price, err := strconv.ParseInt(minPriceStr, 10, 64)
		if err == nil {
			filter.MinPrice = price
		}
	}

	maxPriceStr := c.Query("max_price")
	if maxPriceStr != "" {
		price, err := strconv.ParseInt(maxPriceStr, 10, 64)
		if err == nil {
			filter.MaxPrice = price
		}
	}

	limitStr := c.Query("limit")
	if limitStr != "" {
		limit, err := strconv.Atoi(limitStr)
		if err == nil {
			filter.Limit = limit
		}
	}

	pageStr := c.Query("page")
	if pageStr != "" {
		page, err := strconv.Atoi(pageStr)
		if err == nil && page > 0 {
			if filter.Limit == 0 {
				filter.Limit = 10 // Default limit if not specified
			}
			filter.Offset = (page - 1) * filter.Limit
		}
	}

	products, err := h.productService.ListProducts(c.Request.Context(), filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, errors.InternalServerError(err))
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": products})
}

func (h *ProductHandler) GetProductByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, errors.BadRequestError("invalid product id", err))
		return
	}

	product, err := h.productService.GetProductByID(c.Request.Context(), uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, errors.NotFoundError("product not found", err))
		return
	}

	// Fetch related products (same category, excluding current)
	allRelated, _ := h.productService.ListProducts(c.Request.Context(), domain.ProductFilter{CategoryID: product.CategoryID})
	related := make([]*domain.Product, 0)
	for _, p := range allRelated {
		if p.ID != product.ID && len(related) < 4 {
			related = append(related, p)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"data":    product,
		"related": related,
	})
}

func (h *ProductHandler) UpdateProduct(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, errors.BadRequestError("invalid product id", err))
		return
	}

	var req domain.ProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, errors.BadRequestError("invalid request", err))
		return
	}

	if err := h.productService.UpdateProduct(c.Request.Context(), uint(id), &req); err != nil {
		if err == domain.ErrDuplicateSKU || err == domain.ErrDuplicateSlug {
			c.JSON(http.StatusBadRequest, errors.BadRequestError(err.Error(), err))
			return
		}
		c.JSON(http.StatusInternalServerError, errors.InternalServerError(err))
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "product updated"})
}

func (h *ProductHandler) DeleteProduct(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, errors.BadRequestError("invalid product id", err))
		return
	}

	if err := h.productService.DeleteProduct(c.Request.Context(), uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, errors.InternalServerError(err))
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "product deleted"})
}

package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/vibecoding/ecommerce/internal/domain"
	pkgErrors "github.com/vibecoding/ecommerce/pkg/errors"
)

type BlogHandler struct {
	service domain.BlogService
}

func NewBlogHandler(service domain.BlogService) *BlogHandler {
	return &BlogHandler{service: service}
}

func (h *BlogHandler) Create(c *gin.Context) {
	var req domain.BlogRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, pkgErrors.BadRequestError("invalid request", err))
		return
	}

	blog, err := h.service.CreateBlog(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, pkgErrors.InternalServerError(err))
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": blog})
}

func (h *BlogHandler) GetByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, pkgErrors.BadRequestError("invalid blog id", err))
		return
	}

	blog, err := h.service.GetBlogByID(c.Request.Context(), uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, pkgErrors.NotFoundError("blog not found", err))
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": blog})
}

func (h *BlogHandler) GetBySlug(c *gin.Context) {
	slug := c.Param("slug")

	blog, err := h.service.GetBlogBySlug(c.Request.Context(), slug)
	if err != nil {
		c.JSON(http.StatusNotFound, pkgErrors.NotFoundError("blog not found", err))
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": blog})
}

func (h *BlogHandler) ListPublic(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	blogs, err := h.service.ListActiveBlogs(c.Request.Context(), limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, pkgErrors.InternalServerError(err))
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": blogs})
}

func (h *BlogHandler) ListAll(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	blogs, err := h.service.ListBlogs(c.Request.Context(), limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, pkgErrors.InternalServerError(err))
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": blogs})
}

func (h *BlogHandler) Update(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, pkgErrors.BadRequestError("invalid blog id", err))
		return
	}

	var req domain.BlogRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, pkgErrors.BadRequestError("invalid request", err))
		return
	}

	blog, err := h.service.UpdateBlog(c.Request.Context(), uint(id), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, pkgErrors.InternalServerError(err))
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": blog})
}

func (h *BlogHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, pkgErrors.BadRequestError("invalid blog id", err))
		return
	}

	if err := h.service.DeleteBlog(c.Request.Context(), uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, pkgErrors.InternalServerError(err))
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "blog deleted successfully"})
}


package handler

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/disintegration/imaging"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/vibecoding/ecommerce/pkg/errors"
)

type UploadHandler struct{}

func NewUploadHandler() *UploadHandler {
	return &UploadHandler{}
}

func (h *UploadHandler) UploadMultiple(c *gin.Context) {
	form, err := c.MultipartForm()
	if err != nil {
		c.JSON(http.StatusBadRequest, errors.BadRequestError("failed to parse multipart form", err))
		return
	}

	files := form.File["images"]
	if len(files) == 0 {
		c.JSON(http.StatusBadRequest, errors.BadRequestError("no images found in request", nil))
		return
	}

	var urls []string
	uploadedFiles := 0

	for _, file := range files {
		// 1. Validation: Only PNG/JPG/JPEG
		ext := strings.ToLower(filepath.Ext(file.Filename))
		if ext != ".png" && ext != ".jpg" && ext != ".jpeg" {
			c.JSON(http.StatusBadRequest, errors.BadRequestError(fmt.Sprintf("file %s has invalid extension. only png, jpg, jpeg allowed", file.Filename), nil))
			return
		}

		// Generate unique filename
		newFilename := fmt.Sprintf("%d-%s%s", time.Now().UnixNano(), uuid.New().String(), ext)
		dst := filepath.Join("uploads", newFilename)

		// 2. Check Size and Compress if > 3MB
		if file.Size > 3*1024*1024 {
			// Save temporarily to process
			tempPath := filepath.Join("uploads", "temp-"+newFilename)
			if err := c.SaveUploadedFile(file, tempPath); err != nil {
				c.JSON(http.StatusInternalServerError, errors.InternalServerError(err))
				return
			}
			defer os.Remove(tempPath) // Clean up temp file

			// Open image
			src, err := imaging.Open(tempPath)
			if err != nil {
				c.JSON(http.StatusBadRequest, errors.BadRequestError("failed to open image for compression", err))
				return
			}

			// Compress: Resize to max width 2000 while maintaining aspect ratio
			// and save with high quality JPEG compression
			dstImg := imaging.Resize(src, 2000, 0, imaging.Lanczos)
			
			// Save as JPEG even if it was PNG if we want maximum compression, 
			// but better stick to original extension for consistency or force JPG for size.
			// Let's stick to original extension but use imaging.Save
			if err := imaging.Save(dstImg, dst); err != nil {
				c.JSON(http.StatusInternalServerError, errors.InternalServerError(err))
				return
			}
		} else {
			// Save directly if < 3MB
			if err := c.SaveUploadedFile(file, dst); err != nil {
				c.JSON(http.StatusInternalServerError, errors.InternalServerError(err))
				return
			}
		}

		urls = append(urls, fmt.Sprintf("/uploads/%s", newFilename))
		uploadedFiles++
	}

	c.JSON(http.StatusOK, gin.H{
		"message": fmt.Sprintf("%d images uploaded successfully", uploadedFiles),
		"data":    urls,
	})
}

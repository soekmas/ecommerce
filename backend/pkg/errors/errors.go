package errors

import (
	"fmt"
	"net/http"
)

type APIError struct {
	StatusCode int    `json:"-"`
	Message    string `json:"message"`
	Err        error  `json:"-"`
}

func (e *APIError) Error() string {
	if e.Err != nil {
		return fmt.Sprintf("%s: %v", e.Message, e.Err)
	}
	return e.Message
}

func NewAPIError(statusCode int, message string, err error) *APIError {
	return &APIError{
		StatusCode: statusCode,
		Message:    message,
		Err:        err,
	}
}

func InternalServerError(err error) *APIError {
	return NewAPIError(http.StatusInternalServerError, "Internal server error", err)
}

func BadRequestError(message string, err error) *APIError {
	return NewAPIError(http.StatusBadRequest, message, err)
}

func UnauthorizedError(message string, err error) *APIError {
	return NewAPIError(http.StatusUnauthorized, message, err)
}

func NotFoundError(message string, err error) *APIError {
	return NewAPIError(http.StatusNotFound, message, err)
}

package logger

import (
	"log/slog"
	"os"

	"github.com/vibecoding/ecommerce/config"
)

func NewLogger(cfg *config.Config) *slog.Logger {
	var handler slog.Handler

	if cfg.AppEnv == "production" {
		handler = slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo})
	} else {
		handler = slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelDebug})
	}

	logger := slog.New(handler)
	slog.SetDefault(logger)

	return logger
}

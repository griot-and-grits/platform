package main

import (
	"context"
	"log/slog"
	"os"
	"os/signal"
	"syscall"

	"github.com/griotandgrits/platform/apps/api/internal/config"
	"github.com/griotandgrits/platform/apps/api/internal/wire"
)

func main() {
	// Load configuration from environment.
	cfg, err := config.Load()
	if err != nil {
		slog.Error("failed to load config", "error", err)
		os.Exit(1)
	}

	// Set up structured logger.
	var logger *slog.Logger
	if cfg.IsDevelopment() {
		logger = slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelDebug}))
	} else {
		logger = slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))
	}

	ctx := context.Background()

	// Wire dependencies and start server.
	srv, cleanup, err := wire.Initialize(ctx, cfg, logger)
	if err != nil {
		logger.Error("failed to initialize", "error", err)
		os.Exit(1)
	}
	defer cleanup()

	// Start server in background.
	errCh := make(chan error, 1)
	go func() {
		errCh <- srv.Start()
	}()

	// Wait for interrupt signal or server error.
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	select {
	case sig := <-quit:
		logger.Info("received shutdown signal", "signal", sig)
	case err := <-errCh:
		logger.Error("server error", "error", err)
	}

	// Graceful shutdown.
	shutdownCtx, cancel := context.WithTimeout(context.Background(), cfg.Server.ShutdownTimeout)
	defer cancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		logger.Error("shutdown error", "error", err)
		os.Exit(1)
	}
	logger.Info("server stopped gracefully")
}

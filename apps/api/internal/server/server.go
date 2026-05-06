package server

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"

	"github.com/griotandgrits/platform/apps/api/internal/config"
)

type Server struct {
	httpServer *http.Server
	logger     *slog.Logger
}

func New(handler http.Handler, cfg config.ServerConfig, logger *slog.Logger) *Server {
	return &Server{
		httpServer: &http.Server{
			Addr:              fmt.Sprintf(":%d", cfg.Port),
			Handler:           handler,
			ReadTimeout:       cfg.ReadTimeout,
			ReadHeaderTimeout: cfg.ReadHeaderTimeout,
			WriteTimeout:      cfg.WriteTimeout,
			IdleTimeout:       cfg.IdleTimeout,
			MaxHeaderBytes:    cfg.MaxHeaderBytes,
		},
		logger: logger,
	}
}

func (s *Server) Start() error {
	s.logger.Info("server starting", "addr", s.httpServer.Addr)
	if err := s.httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		return fmt.Errorf("server listen: %w", err)
	}
	return nil
}

func (s *Server) Shutdown(ctx context.Context) error {
	s.logger.Info("server shutting down")
	return s.httpServer.Shutdown(ctx)
}

package wire

import (
	"context"
	"fmt"
	"log/slog"

	"github.com/griotandgrits/platform/apps/api/internal/adapter/mongo"
	"github.com/griotandgrits/platform/apps/api/internal/adapter/pipeline"
	"github.com/griotandgrits/platform/apps/api/internal/adapter/storage"
	"github.com/griotandgrits/platform/apps/api/internal/config"
	"github.com/griotandgrits/platform/apps/api/internal/handler"
	"github.com/griotandgrits/platform/apps/api/internal/server"
	"github.com/griotandgrits/platform/apps/api/internal/service"
)

// Initialize wires all dependencies and returns a ready-to-start server.
// The returned cleanup function closes connections.
func Initialize(ctx context.Context, cfg *config.Config, logger *slog.Logger) (*server.Server, func(), error) {
	// MongoDB
	mongoClient, err := mongo.Connect(ctx, cfg.Database)
	if err != nil {
		return nil, nil, fmt.Errorf("mongodb: %w", err)
	}
	db := mongoClient.Database(cfg.Database.Name)

	if err := mongo.EnsureIndexes(ctx, db, logger); err != nil {
		return nil, nil, fmt.Errorf("indexes: %w", err)
	}

	// MinIO
	objectStore, err := storage.NewMinIOStore(cfg.Storage)
	if err != nil {
		return nil, nil, fmt.Errorf("minio: %w", err)
	}

	// Redis pipeline dispatcher
	dispatcher, err := pipeline.NewRedisDispatcher(cfg.Pipeline.RedisURL)
	if err != nil {
		return nil, nil, fmt.Errorf("redis dispatcher: %w", err)
	}

	// Repos
	artifactRepo := mongo.NewArtifactRepo(db)
	_ = mongo.NewCollectionRepo(db) // wired for Phase 4

	// Services
	fixitySvc := service.NewFixityService()
	preservationSvc := service.NewPreservationService(artifactRepo)
	storageLocSvc := service.NewStorageLocationService(artifactRepo)
	ingestionSvc := service.NewIngestionService(
		artifactRepo,
		objectStore,
		fixitySvc,
		preservationSvc,
		storageLocSvc,
		cfg,
		dispatcher,
	)
	pipelineHandlerSvc := service.NewPipelineHandlerService(
		artifactRepo,
		preservationSvc,
		storageLocSvc,
		logger,
	)

	// Handlers
	artifactHandler := handler.NewArtifactHandler(ingestionSvc, artifactRepo)
	preservationHandler := handler.NewPreservationHandler(preservationSvc)
	collectionHandler := handler.NewCollectionHandler()
	healthHandler := handler.NewHealthHandler(cfg)
	pipelineCallbackHandler := handler.NewPipelineCallbackHandler(pipelineHandlerSvc, cfg.Pipeline.CallbackSecret)

	// Router
	router := handler.NewRouter(
		artifactHandler,
		preservationHandler,
		collectionHandler,
		healthHandler,
		pipelineCallbackHandler,
		cfg.CORS.AllowedOrigins,
		logger,
	)

	// Server
	srv := server.New(
		router,
		cfg.Server.Port,
		cfg.Server.ReadTimeout,
		cfg.Server.WriteTimeout,
		logger,
	)

	cleanup := func() {
		_ = dispatcher.Close()
		if err := mongoClient.Disconnect(ctx); err != nil {
			logger.Error("mongo disconnect", "error", err)
		}
	}

	return srv, cleanup, nil
}

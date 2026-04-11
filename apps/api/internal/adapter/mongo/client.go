package mongo

import (
	"context"
	"fmt"
	"log/slog"

	"github.com/griotandgrits/platform/apps/api/internal/config"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

// Connect establishes a connection to MongoDB and returns the client.
func Connect(ctx context.Context, cfg config.DatabaseConfig) (*mongo.Client, error) {
	opts := options.Client().
		ApplyURI(cfg.URI).
		SetMaxPoolSize(cfg.MaxPoolSize).
		SetMinPoolSize(cfg.MinPoolSize)

	client, err := mongo.Connect(opts)
	if err != nil {
		return nil, fmt.Errorf("mongo connect: %w", err)
	}

	if err := client.Ping(ctx, nil); err != nil {
		return nil, fmt.Errorf("mongo ping: %w", err)
	}

	return client, nil
}

// EnsureIndexes creates required indexes on the artifacts and collections collections.
func EnsureIndexes(ctx context.Context, db *mongo.Database, logger *slog.Logger) error {
	artifacts := db.Collection("artifacts")

	artifactIndexes := []mongo.IndexModel{
		{Keys: bson.D{{Key: "status", Value: 1}}},
		{Keys: bson.D{{Key: "created_at", Value: -1}}},
		{Keys: bson.D{{Key: "storage_locations.checksum_sha256", Value: 1}}},
		{
			Keys: bson.D{
				{Key: "title", Value: "text"},
				{Key: "description", Value: "text"},
			},
		},
	}

	if _, err := artifacts.Indexes().CreateMany(ctx, artifactIndexes); err != nil {
		return fmt.Errorf("create artifact indexes: %w", err)
	}

	collections := db.Collection("collections")

	collectionIndexes := []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "collection_id", Value: 1}},
			Options: options.Index().SetUnique(true),
		},
		{
			Keys:    bson.D{{Key: "slug", Value: 1}},
			Options: options.Index().SetUnique(true),
		},
		{Keys: bson.D{{Key: "status", Value: 1}}},
		{Keys: bson.D{{Key: "created_at", Value: -1}}},
	}

	if _, err := collections.Indexes().CreateMany(ctx, collectionIndexes); err != nil {
		return fmt.Errorf("create collection indexes: %w", err)
	}

	logger.Info("MongoDB indexes ensured")
	return nil
}

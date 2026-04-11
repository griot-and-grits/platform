package pipeline

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/griotandgrits/platform/apps/api/internal/domain"
	"github.com/griotandgrits/platform/apps/api/internal/port"
	"github.com/redis/go-redis/v9"
)

const defaultQueueKey = "gng:pipeline:jobs"

// RedisDispatcher implements port.PipelineDispatcher using Redis LPUSH.
type RedisDispatcher struct {
	client   *redis.Client
	queueKey string
}

var _ port.PipelineDispatcher = (*RedisDispatcher)(nil)

// NewRedisDispatcher creates a dispatcher from a Redis URL.
func NewRedisDispatcher(redisURL string) (*RedisDispatcher, error) {
	opts, err := redis.ParseURL(redisURL)
	if err != nil {
		return nil, fmt.Errorf("parse redis url: %w", err)
	}
	client := redis.NewClient(opts)
	return &RedisDispatcher{
		client:   client,
		queueKey: defaultQueueKey,
	}, nil
}

func (d *RedisDispatcher) Dispatch(ctx context.Context, job domain.PipelineJob) error {
	data, err := json.Marshal(job)
	if err != nil {
		return fmt.Errorf("marshal pipeline job: %w", err)
	}
	if err := d.client.LPush(ctx, d.queueKey, data).Err(); err != nil {
		return fmt.Errorf("lpush pipeline job: %w", err)
	}
	return nil
}

// Close closes the Redis connection.
func (d *RedisDispatcher) Close() error {
	return d.client.Close()
}

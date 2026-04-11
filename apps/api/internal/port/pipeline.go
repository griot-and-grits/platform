package port

import (
	"context"

	"github.com/griotandgrits/platform/apps/api/internal/domain"
)

// PipelineDispatcher pushes jobs to the pipeline queue.
type PipelineDispatcher interface {
	Dispatch(ctx context.Context, job domain.PipelineJob) error
}

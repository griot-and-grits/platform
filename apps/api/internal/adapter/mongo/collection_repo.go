package mongo

import (
	"context"
	"fmt"
	"time"

	"github.com/griotandgrits/platform/apps/api/internal/domain"
	"github.com/griotandgrits/platform/apps/api/internal/port"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

type collectionDoc struct {
	ID               bson.ObjectID    `bson:"_id,omitempty"`
	CollectionID     string           `bson:"collection_id"`
	Title            string           `bson:"title"`
	Description      string           `bson:"description,omitempty"`
	Slug             string           `bson:"slug"`
	Status           string           `bson:"status"`
	CreatedAt        time.Time        `bson:"created_at"`
	SealedAt         *time.Time       `bson:"sealed_at,omitempty"`
	ArtifactIDs      []string         `bson:"artifact_ids,omitempty"`
	Verification     *verificationDoc `bson:"verification,omitempty"`
	GlobusPath       string           `bson:"globus_path,omitempty"`
	GlobusEndpointID string           `bson:"globus_endpoint_id,omitempty"`
}

type verificationDoc struct {
	Status      string     `bson:"status"`
	Detail      string     `bson:"detail,omitempty"`
	CompletedAt *time.Time `bson:"completed_at,omitempty"`
}

// CollectionRepo implements port.CollectionRepo with MongoDB.
type CollectionRepo struct {
	coll *mongo.Collection
}

var _ port.CollectionRepo = (*CollectionRepo)(nil)

func NewCollectionRepo(db *mongo.Database) *CollectionRepo {
	return &CollectionRepo{coll: db.Collection("collections")}
}

func (r *CollectionRepo) Insert(ctx context.Context, c *domain.Collection) (string, error) {
	doc := toCollectionDoc(c)
	doc.ID = bson.NewObjectID()
	if doc.CreatedAt.IsZero() {
		doc.CreatedAt = time.Now().UTC()
	}

	_, err := r.coll.InsertOne(ctx, doc)
	if err != nil {
		return "", fmt.Errorf("insert collection: %w", err)
	}
	return doc.CollectionID, nil
}

func (r *CollectionRepo) FindByID(ctx context.Context, collectionID string) (*domain.Collection, error) {
	var doc collectionDoc
	err := r.coll.FindOne(ctx, bson.M{"collection_id": collectionID}).Decode(&doc)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, fmt.Errorf("find collection %s: %w", collectionID, err)
	}
	return toCollectionDomain(&doc), nil
}

func (r *CollectionRepo) FindBySlug(ctx context.Context, slug string) (*domain.Collection, error) {
	var doc collectionDoc
	err := r.coll.FindOne(ctx, bson.M{"slug": slug}).Decode(&doc)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, fmt.Errorf("find collection by slug %s: %w", slug, err)
	}
	return toCollectionDomain(&doc), nil
}

func (r *CollectionRepo) List(ctx context.Context, filter port.CollectionFilter) ([]domain.Collection, int, error) {
	query := bson.M{}
	if filter.Status != nil {
		query["status"] = string(*filter.Status)
	}

	limit := filter.Limit
	if limit <= 0 {
		limit = 50
	}
	skip := filter.Skip
	if skip < 0 {
		skip = 0
	}

	total, err := r.coll.CountDocuments(ctx, query)
	if err != nil {
		return nil, 0, fmt.Errorf("count collections: %w", err)
	}

	opts := options.Find().
		SetSort(bson.D{{Key: "created_at", Value: -1}}).
		SetLimit(int64(limit)).
		SetSkip(int64(skip))

	cursor, err := r.coll.Find(ctx, query, opts)
	if err != nil {
		return nil, 0, fmt.Errorf("list collections: %w", err)
	}
	defer cursor.Close(ctx)

	var items []domain.Collection
	for cursor.Next(ctx) {
		var doc collectionDoc
		if err := cursor.Decode(&doc); err != nil {
			return nil, 0, fmt.Errorf("decode collection: %w", err)
		}
		items = append(items, *toCollectionDomain(&doc))
	}
	if items == nil {
		items = []domain.Collection{}
	}

	return items, int(total), nil
}

func (r *CollectionRepo) Update(ctx context.Context, collectionID string, fields map[string]any) error {
	_, err := r.coll.UpdateOne(ctx, bson.M{"collection_id": collectionID}, bson.M{"$set": fields})
	if err != nil {
		return fmt.Errorf("update collection %s: %w", collectionID, err)
	}
	return nil
}

func toCollectionDoc(c *domain.Collection) collectionDoc {
	doc := collectionDoc{
		CollectionID:     c.CollectionID,
		Title:            c.Title,
		Description:      c.Description,
		Slug:             c.Slug,
		Status:           string(c.Status),
		CreatedAt:        c.CreatedAt,
		SealedAt:         c.SealedAt,
		ArtifactIDs:      c.ArtifactIDs,
		GlobusPath:       c.UploadPath,
		GlobusEndpointID: c.GlobusEndpointID,
	}
	if c.Verification != nil {
		doc.Verification = &verificationDoc{
			Status:      c.Verification.Status,
			Detail:      c.Verification.Detail,
			CompletedAt: c.Verification.CompletedAt,
		}
	}
	return doc
}

func toCollectionDomain(doc *collectionDoc) *domain.Collection {
	c := &domain.Collection{
		CollectionID:     doc.CollectionID,
		Title:            doc.Title,
		Description:      doc.Description,
		Slug:             doc.Slug,
		Status:           domain.CollectionStatus(doc.Status),
		CreatedAt:        doc.CreatedAt,
		SealedAt:         doc.SealedAt,
		ArtifactIDs:      doc.ArtifactIDs,
		UploadPath:       doc.GlobusPath,
		GlobusEndpointID: doc.GlobusEndpointID,
	}
	if doc.Verification != nil {
		c.Verification = &domain.Verification{
			Status:      doc.Verification.Status,
			Detail:      doc.Verification.Detail,
			CompletedAt: doc.Verification.CompletedAt,
		}
	}
	return c
}

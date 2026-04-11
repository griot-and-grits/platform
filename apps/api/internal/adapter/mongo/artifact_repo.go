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

// artifactDoc is the BSON representation of an artifact in MongoDB.
type artifactDoc struct {
	ID                 bson.ObjectID          `bson:"_id,omitempty"`
	Title              string                 `bson:"title"`
	Description        string                 `bson:"description,omitempty"`
	Creator            string                 `bson:"creator,omitempty"`
	CreationDate       string                 `bson:"creation_date,omitempty"`
	Type               string                 `bson:"type,omitempty"`
	Format             string                 `bson:"format,omitempty"`
	Language           []string               `bson:"language,omitempty"`
	Subject            []string               `bson:"subject,omitempty"`
	Rights             string                 `bson:"rights,omitempty"`
	Status             string                 `bson:"status"`
	OriginalFilename   string                 `bson:"original_filename"`
	FileExtension      string                 `bson:"file_extension"`
	MIMEType           string                 `bson:"mime_type,omitempty"`
	SizeBytes          *int64                 `bson:"size_bytes,omitempty"`
	UploadedAt         *time.Time             `bson:"uploaded_at,omitempty"`
	StorageLocations   []storageLocationDoc   `bson:"storage_locations,omitempty"`
	PreservationEvents []preservationEventDoc `bson:"preservation_events,omitempty"`
	Fixity             *fixityDoc             `bson:"fixity,omitempty"`
	ProcessingMetadata map[string]any         `bson:"processing_metadata,omitempty"`
	HotStorageRetained *bool                  `bson:"hot_storage_retained,omitempty"`
	Version            int                    `bson:"version"`
	CreatedAt          time.Time              `bson:"created_at"`
	UpdatedAt          time.Time              `bson:"updated_at"`
}

type storageLocationDoc struct {
	StorageType    string     `bson:"storage_type"`
	Path           string     `bson:"path"`
	Bucket         string     `bson:"bucket,omitempty"`
	Endpoint       string     `bson:"endpoint,omitempty"`
	ChecksumMD5    string     `bson:"checksum_md5"`
	ChecksumSHA256 string     `bson:"checksum_sha256"`
	SizeBytes      int64      `bson:"size_bytes"`
	CreatedAt      time.Time  `bson:"created_at"` // BSON uses created_at; domain/JSON uses stored_at
	VerifiedAt     *time.Time `bson:"verified_at,omitempty"`
}

type preservationEventDoc struct {
	EventType     string    `bson:"event_type"`
	Timestamp     time.Time `bson:"timestamp"`
	Agent         string    `bson:"agent"`
	Outcome       string    `bson:"outcome"`
	Detail        string    `bson:"detail,omitempty"`
	RelatedObject string    `bson:"related_object,omitempty"`
}

type fixityDoc struct {
	ChecksumMD5    string     `bson:"checksum_md5"`
	ChecksumSHA256 string     `bson:"checksum_sha256"`
	Algorithms     []string   `bson:"algorithm"`
	CalculatedAt   time.Time  `bson:"calculated_at"`
	VerifiedAt     *time.Time `bson:"verified_at,omitempty"`
}

// ArtifactRepo implements port.ArtifactRepo with MongoDB.
type ArtifactRepo struct {
	coll *mongo.Collection
}

var _ port.ArtifactRepo = (*ArtifactRepo)(nil)

func NewArtifactRepo(db *mongo.Database) *ArtifactRepo {
	return &ArtifactRepo{coll: db.Collection("artifacts")}
}

func (r *ArtifactRepo) Insert(ctx context.Context, a *domain.Artifact) (string, error) {
	now := time.Now().UTC()
	doc := toArtifactDoc(a)
	doc.ID = bson.NewObjectID()
	doc.CreatedAt = now
	doc.UpdatedAt = now

	_, err := r.coll.InsertOne(ctx, doc)
	if err != nil {
		return "", fmt.Errorf("insert artifact: %w", err)
	}
	return doc.ID.Hex(), nil
}

func (r *ArtifactRepo) FindByID(ctx context.Context, id string) (*domain.Artifact, error) {
	oid, err := bson.ObjectIDFromHex(id)
	if err != nil {
		return nil, fmt.Errorf("invalid artifact id %q: %w", id, err)
	}

	var doc artifactDoc
	err = r.coll.FindOne(ctx, bson.M{"_id": oid}).Decode(&doc)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, fmt.Errorf("find artifact %s: %w", id, err)
	}
	return toArtifactDomain(&doc), nil
}

func (r *ArtifactRepo) List(ctx context.Context, filter port.ArtifactFilter) ([]domain.ArtifactListItem, int, error) {
	query := bson.M{}
	if filter.Status != nil {
		query["status"] = string(*filter.Status)
	}
	if filter.Type != "" {
		query["type"] = filter.Type
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
		return nil, 0, fmt.Errorf("count artifacts: %w", err)
	}

	projection := bson.M{
		"_id":         1,
		"title":       1,
		"status":      1,
		"type":        1,
		"size_bytes":  1,
		"uploaded_at": 1,
	}

	opts := options.Find().
		SetProjection(projection).
		SetSort(bson.D{{Key: "created_at", Value: -1}}).
		SetLimit(int64(limit)).
		SetSkip(int64(skip))

	cursor, err := r.coll.Find(ctx, query, opts)
	if err != nil {
		return nil, 0, fmt.Errorf("list artifacts: %w", err)
	}
	defer cursor.Close(ctx)

	var items []domain.ArtifactListItem
	for cursor.Next(ctx) {
		var doc artifactDoc
		if err := cursor.Decode(&doc); err != nil {
			return nil, 0, fmt.Errorf("decode artifact list item: %w", err)
		}
		items = append(items, domain.ArtifactListItem{
			ArtifactID: doc.ID.Hex(),
			Title:      doc.Title,
			Status:     domain.ArtifactStatus(doc.Status),
			Type:       doc.Type,
			SizeBytes:  doc.SizeBytes,
			UploadedAt: doc.UploadedAt,
		})
	}
	if items == nil {
		items = []domain.ArtifactListItem{}
	}

	return items, int(total), nil
}

func (r *ArtifactRepo) UpdateStatus(ctx context.Context, id string, status domain.ArtifactStatus) error {
	oid, err := bson.ObjectIDFromHex(id)
	if err != nil {
		return fmt.Errorf("invalid artifact id: %w", err)
	}
	_, err = r.coll.UpdateByID(ctx, oid, bson.M{
		"$set": bson.M{
			"status":     string(status),
			"updated_at": time.Now().UTC(),
		},
	})
	if err != nil {
		return fmt.Errorf("update artifact status: %w", err)
	}
	return nil
}

func (r *ArtifactRepo) AddStorageLocation(ctx context.Context, id string, loc domain.StorageLocation) error {
	oid, err := bson.ObjectIDFromHex(id)
	if err != nil {
		return fmt.Errorf("invalid artifact id: %w", err)
	}
	doc := storageLocationDoc{
		StorageType:    string(loc.StorageType),
		Path:           loc.Path,
		Bucket:         loc.Bucket,
		Endpoint:       loc.Endpoint,
		ChecksumMD5:    loc.ChecksumMD5,
		ChecksumSHA256: loc.ChecksumSHA256,
		SizeBytes:      loc.SizeBytes,
		CreatedAt:      loc.StoredAt,
		VerifiedAt:     loc.VerifiedAt,
	}
	_, err = r.coll.UpdateByID(ctx, oid, bson.M{
		"$push": bson.M{"storage_locations": doc},
		"$set":  bson.M{"updated_at": time.Now().UTC()},
	})
	if err != nil {
		return fmt.Errorf("add storage location: %w", err)
	}
	return nil
}

func (r *ArtifactRepo) AddPreservationEvent(ctx context.Context, id string, event domain.PreservationEvent) error {
	oid, err := bson.ObjectIDFromHex(id)
	if err != nil {
		return fmt.Errorf("invalid artifact id: %w", err)
	}
	doc := preservationEventDoc{
		EventType:     string(event.EventType),
		Timestamp:     event.Timestamp,
		Agent:         event.Agent,
		Outcome:       string(event.Outcome),
		Detail:        event.Detail,
		RelatedObject: event.RelatedObject,
	}
	_, err = r.coll.UpdateByID(ctx, oid, bson.M{
		"$push": bson.M{"preservation_events": doc},
		"$set":  bson.M{"updated_at": time.Now().UTC()},
	})
	if err != nil {
		return fmt.Errorf("add preservation event: %w", err)
	}
	return nil
}

func (r *ArtifactRepo) UpdateFields(ctx context.Context, id string, fields map[string]any) error {
	oid, err := bson.ObjectIDFromHex(id)
	if err != nil {
		return fmt.Errorf("invalid artifact id: %w", err)
	}
	fields["updated_at"] = time.Now().UTC()
	_, err = r.coll.UpdateByID(ctx, oid, bson.M{"$set": fields})
	if err != nil {
		return fmt.Errorf("update artifact fields: %w", err)
	}
	return nil
}

// toArtifactDoc converts a domain Artifact to a BSON document.
func toArtifactDoc(a *domain.Artifact) artifactDoc {
	doc := artifactDoc{
		Title:              a.Title,
		Description:        a.Description,
		Creator:            a.Creator,
		CreationDate:       a.CreationDate,
		Type:               a.Type,
		Format:             a.Format,
		Language:           a.Language,
		Subject:            a.Subject,
		Rights:             a.Rights,
		Status:             string(a.Status),
		OriginalFilename:   a.OriginalFilename,
		FileExtension:      a.FileExtension,
		MIMEType:           a.MIMEType,
		SizeBytes:          a.SizeBytes,
		UploadedAt:         a.UploadedAt,
		ProcessingMetadata: a.ProcessingMetadata,
		HotStorageRetained: a.HotStorageRetained,
		Version:            a.Version,
	}

	if a.Fixity != nil {
		doc.Fixity = &fixityDoc{
			ChecksumMD5:    a.Fixity.ChecksumMD5,
			ChecksumSHA256: a.Fixity.ChecksumSHA256,
			Algorithms:     a.Fixity.Algorithms,
			CalculatedAt:   a.Fixity.CalculatedAt,
			VerifiedAt:     a.Fixity.VerifiedAt,
		}
	}

	for _, loc := range a.StorageLocations {
		doc.StorageLocations = append(doc.StorageLocations, storageLocationDoc{
			StorageType:    string(loc.StorageType),
			Path:           loc.Path,
			Bucket:         loc.Bucket,
			Endpoint:       loc.Endpoint,
			ChecksumMD5:    loc.ChecksumMD5,
			ChecksumSHA256: loc.ChecksumSHA256,
			SizeBytes:      loc.SizeBytes,
			CreatedAt:      loc.StoredAt,
			VerifiedAt:     loc.VerifiedAt,
		})
	}

	for _, ev := range a.PreservationEvents {
		doc.PreservationEvents = append(doc.PreservationEvents, preservationEventDoc{
			EventType:     string(ev.EventType),
			Timestamp:     ev.Timestamp,
			Agent:         ev.Agent,
			Outcome:       string(ev.Outcome),
			Detail:        ev.Detail,
			RelatedObject: ev.RelatedObject,
		})
	}

	return doc
}

// toArtifactDomain converts a BSON document to a domain Artifact.
func toArtifactDomain(doc *artifactDoc) *domain.Artifact {
	a := &domain.Artifact{
		ArtifactID:         doc.ID.Hex(),
		Title:              doc.Title,
		Description:        doc.Description,
		Creator:            doc.Creator,
		CreationDate:       doc.CreationDate,
		Type:               doc.Type,
		Format:             doc.Format,
		Language:           doc.Language,
		Subject:            doc.Subject,
		Rights:             doc.Rights,
		Status:             domain.ArtifactStatus(doc.Status),
		OriginalFilename:   doc.OriginalFilename,
		FileExtension:      doc.FileExtension,
		MIMEType:           doc.MIMEType,
		SizeBytes:          doc.SizeBytes,
		UploadedAt:         doc.UploadedAt,
		ProcessingMetadata: doc.ProcessingMetadata,
		HotStorageRetained: doc.HotStorageRetained,
		Version:            doc.Version,
		CreatedAt:          doc.CreatedAt,
		UpdatedAt:          doc.UpdatedAt,
	}

	if doc.Fixity != nil {
		a.Fixity = &domain.FixityInfo{
			ChecksumMD5:    doc.Fixity.ChecksumMD5,
			ChecksumSHA256: doc.Fixity.ChecksumSHA256,
			Algorithms:     doc.Fixity.Algorithms,
			CalculatedAt:   doc.Fixity.CalculatedAt,
			VerifiedAt:     doc.Fixity.VerifiedAt,
		}
	}

	for _, loc := range doc.StorageLocations {
		a.StorageLocations = append(a.StorageLocations, domain.StorageLocation{
			StorageType:    domain.StorageType(loc.StorageType),
			Path:           loc.Path,
			Bucket:         loc.Bucket,
			Endpoint:       loc.Endpoint,
			ChecksumMD5:    loc.ChecksumMD5,
			ChecksumSHA256: loc.ChecksumSHA256,
			SizeBytes:      loc.SizeBytes,
			StoredAt:       loc.CreatedAt,
			VerifiedAt:     loc.VerifiedAt,
		})
	}

	for _, ev := range doc.PreservationEvents {
		a.PreservationEvents = append(a.PreservationEvents, domain.PreservationEvent{
			EventType:     domain.PreservationEventType(ev.EventType),
			Timestamp:     ev.Timestamp,
			Agent:         ev.Agent,
			Outcome:       domain.PreservationEventOutcome(ev.Outcome),
			Detail:        ev.Detail,
			RelatedObject: ev.RelatedObject,
		})
	}

	return a
}

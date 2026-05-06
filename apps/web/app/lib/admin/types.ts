export enum ArtifactStatus {
    UPLOADING = 'uploading',
    PROCESSING = 'processing',
    READY = 'ready',
    FAILED = 'failed',
    ARCHIVED = 'archived',
}

export enum StorageType {
    HOT = 'hot',
    ARCHIVE = 'archive',
}

export enum PreservationEventType {
    INGESTION = 'ingestion',
    FIXITY_CHECK = 'fixity_check',
    REPLICATION = 'replication',
    MIGRATION = 'migration',
    VALIDATION = 'validation',
    NORMALIZATION = 'normalization',
    DELETION = 'deletion',
}

export enum PreservationEventOutcome {
    SUCCESS = 'success',
    FAILURE = 'failure',
    WARNING = 'warning',
}

export enum CollectionStatus {
    DRAFT = 'draft',
    AWAITING_UPLOAD = 'awaiting_upload',
    UPLOAD_IN_PROGRESS = 'upload_in_progress',
    VERIFYING = 'verifying',
    SEALED = 'sealed',
    ERROR = 'error',
}

export interface FixityInfo {
    checksum_md5: string;
    checksum_sha256: string;
    algorithm: string;
    calculated_at: string;
    verified_at?: string;
}

export interface StorageLocation {
    storage_type: StorageType;
    path: string;
    checksum_md5: string;
    checksum_sha256: string;
    size_bytes: number;
    stored_at: string;
    verified_at?: string;
}

export interface PreservationEvent {
    event_type: PreservationEventType;
    timestamp: string;
    agent: string;
    outcome: PreservationEventOutcome;
    detail?: string;
}

export interface Artifact {
    artifact_id: string;
    title: string;
    description?: string;
    creator?: string;
    creation_date?: string;
    type?: string;
    format?: string;
    language?: string[];
    subject?: string[];
    rights?: string;
    status: ArtifactStatus;
    original_filename: string;
    file_extension: string;
    mime_type?: string;
    size_bytes?: number;
    uploaded_at?: string;
    storage_locations?: StorageLocation[];
    preservation_events?: PreservationEvent[];
    fixity?: FixityInfo;
    processing_metadata?: Record<string, unknown>;
    hot_storage_retained?: boolean;
}

export interface ArtifactListItem {
    artifact_id: string;
    title: string;
    status: ArtifactStatus;
    type?: string;
    size_bytes?: number;
    uploaded_at?: string;
}

export interface ArtifactListResponse {
    artifacts: ArtifactListItem[];
    total: number;
}

export interface ArtifactStatusResponse {
    artifact_id: string;
    status: ArtifactStatus;
    detail?: string;
    updated_at?: string;
}

export interface IngestionMetadata {
    title: string;
    description?: string;
    creator?: string;
    creation_date?: string;
    type?: string;
    format?: string;
    language?: string[];
    subject?: string[];
    rights?: string;
}

export interface IngestionResponse {
    artifact_id: string;
    status: ArtifactStatus;
    message?: string;
    upload_path?: string;
}

export interface CollectionDraftRequest {
    title: string;
    description?: string;
    slug?: string;
    expected_artifact_count?: number;
    tags?: string[];
}

export interface CollectionDraftResponse {
    collection_id: string;
    upload_path: string;
    raw_upload_path: string;
    globus_endpoint_id: string;
    globus_link: string;
    status: CollectionStatus;
    created_at: string;
}

export interface Collection {
    collection_id: string;
    title: string;
    description?: string;
    slug: string;
    status: CollectionStatus;
    created_at: string;
    sealed_at?: string;
    artifact_ids?: string[];
    verification?: {
        status: 'pending' | 'success' | 'failed';
        detail?: string;
        completed_at?: string;
    };
    upload_path?: string;
    globus_endpoint_id?: string;
}

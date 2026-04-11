import { apiClient } from '../api-client';
import type { AxiosProgressEvent } from 'axios';
import type {
    Artifact,
    ArtifactListResponse,
    ArtifactStatus,
    ArtifactStatusResponse,
    IngestionMetadata,
    IngestionResponse,
} from '../types';

type IngestOptions = {
    onUploadProgress?: (progressEvent: AxiosProgressEvent) => void;
    timeoutMs?: number;
};

export const artifactsApi = {
    async ingest(
        file: File,
        metadata: IngestionMetadata,
        options?: IngestOptions,
    ): Promise<IngestionResponse> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('metadata', JSON.stringify(metadata));

        const response = await apiClient.post('/artifacts/ingest', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            timeout: options?.timeoutMs ?? 300_000,
            onUploadProgress: options?.onUploadProgress,
        });

        return response.data;
    },

    async getStatus(artifactId: string): Promise<ArtifactStatusResponse> {
        const response = await apiClient.get(`/artifacts/${artifactId}/status`);
        return response.data;
    },

    async getById(artifactId: string): Promise<Artifact> {
        const response = await apiClient.get(`/artifacts/${artifactId}`);
        return response.data;
    },

    async list(params?: {
        status?: ArtifactStatus;
        type?: string;
        limit?: number;
        skip?: number;
    }): Promise<ArtifactListResponse> {
        const response = await apiClient.get('/artifacts', { params });
        return response.data;
    },
};

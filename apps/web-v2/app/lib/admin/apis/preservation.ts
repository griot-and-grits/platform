import { apiClient } from '../api-client';
import type { FixityInfo, PreservationEvent, StorageLocation } from '../types';

export const preservationApi = {
    async getEvents(artifactId: string): Promise<PreservationEvent[]> {
        const response = await apiClient.get(`/preservation/artifacts/${artifactId}/events`);
        return response.data.events ?? [];
    },

    async getStorageLocations(artifactId: string): Promise<StorageLocation[]> {
        const response = await apiClient.get(
            `/preservation/artifacts/${artifactId}/storage-locations`,
        );
        return response.data.storage_locations ?? [];
    },

    async getFixity(artifactId: string): Promise<FixityInfo | null> {
        const response = await apiClient.get(`/preservation/artifacts/${artifactId}/fixity`);
        return response.data.fixity ?? null;
    },

    async replicate(artifactId: string) {
        const response = await apiClient.post(`/preservation/artifacts/${artifactId}/replicate`);
        return response.data;
    },
};

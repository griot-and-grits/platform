import { apiClient } from '../api-client';
import type {
    CollectionDraftRequest,
    CollectionDraftResponse,
    CollectionStatus,
    Collection,
} from '../types';

export const collectionsApi = {
    async createDraft(request: CollectionDraftRequest): Promise<CollectionDraftResponse> {
        const response = await apiClient.post('/collections/draft', request);
        return response.data;
    },

    async finalize(collectionId: string): Promise<Collection> {
        const response = await apiClient.post(`/collections/${collectionId}/finalize`);
        return response.data;
    },

    async getById(collectionId: string): Promise<Collection> {
        const response = await apiClient.get(`/collections/${collectionId}`);
        return response.data;
    },

    async list(params?: {
        status?: CollectionStatus;
        limit?: number;
        skip?: number;
    }): Promise<{ collections: Collection[]; count: number; total: number }> {
        const response = await apiClient.get('/collections', { params });
        return response.data;
    },
};

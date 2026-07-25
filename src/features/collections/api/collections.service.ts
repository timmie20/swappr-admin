import apiClient from '@/lib/api/client';
import {
  Collection,
  CollectionFilterParams,
  CollectionsResponse,
  CreateCollectionDto,
  UpdateCollectionDto
} from '../types/collection.types';

/**
 * Collections API Service
 * All API calls related to collections
 */
export const collectionsApi = {
  /**
   * Get all collections (paginated)
   */
  getAll: async (
    filters?: CollectionFilterParams
  ): Promise<CollectionsResponse> => {
    const { data } = await apiClient.get<CollectionsResponse>('/collections', {
      params: filters
    });
    return data;
  },

  /**
   * Create a new collection
   */
  create: async (payload: CreateCollectionDto): Promise<Collection> => {
    const { data } = await apiClient.post<Collection>('/collections', payload);
    return data;
  },

  /**
   * Update an existing collection
   */
  update: async (
    id: string,
    payload: UpdateCollectionDto
  ): Promise<Collection> => {
    const { data } = await apiClient.patch<Collection>(
      `/collections/${id}/update`,
      payload
    );
    return data;
  }
};

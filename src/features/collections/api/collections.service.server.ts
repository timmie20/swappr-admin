import { serverFetch } from '@/lib/api/server';
import {
  CollectionFilterParams,
  CollectionsResponse
} from '../types/collection.types';

export const collectionsApiServer = {
  /**
   * Get all collections (paginated)
   */
  getAll: async (
    filters?: CollectionFilterParams
  ): Promise<CollectionsResponse> => {
    return serverFetch<CollectionsResponse>('/collections', {
      params: filters
    });
  }
};

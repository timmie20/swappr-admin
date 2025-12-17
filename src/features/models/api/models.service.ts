import apiClient from '@/lib/api-client';
import { getClientAuthHeaders } from '@/lib/auth-headers';
import {
  CreateModelDto,
  Model,
  ModelsResponse,
  UpdateModelDto
} from '../types/models.types';
import { DefaultFilters } from '@/types/services';
import { CreateVariationParams } from '../hooks/use-create-variation';

export const modelsApi = {
  /**
   * Models Api service
   * All apis relatesd to models
   */

  getAll: async (
    filters: DefaultFilters | undefined,
    getToken: () => Promise<string | null>
  ) => {
    const headers = await getClientAuthHeaders(getToken);
    const { data } = await apiClient.get<ModelsResponse>('/models', {
      headers,
      params: filters
    });
    return data;
  },

  /**
   * Get a single brand by ID
   */
  getById: async (
    id: string,
    getToken: () => Promise<string | null>
  ): Promise<Model> => {
    const headers = await getClientAuthHeaders(getToken);
    const { data } = await apiClient.get<{ model: Model }>(`/models/${id}`, {
      headers
    });
    return data.model;
  },

  /**
   * Create a model
   */

  create: async (
    payload: CreateModelDto,
    getToken: () => Promise<string | null>
  ) => {
    const headers = await getClientAuthHeaders(getToken);
    const { data } = await apiClient.post<Model>(`/models/create`, payload, {
      headers
    });
    return data;
  },

  /**
   * Update an existing model
   */
  update: async (
    id: string,
    payload: UpdateModelDto,
    getToken: () => Promise<string | null>
  ): Promise<Model> => {
    const headers = await getClientAuthHeaders(getToken);
    const { data } = await apiClient.patch<Model>(
      `/models/${id}/update`,
      payload,
      {
        headers
      }
    );
    return data;
  },

  /**
   * Create a new variation for a model
   */
  createVariation: async (
    payload: CreateVariationParams,
    getToken: () => Promise<string | null>
  ) => {
    const headers = await getClientAuthHeaders(getToken);
    const { data } = await apiClient.post(`/variations/add`, payload, {
      headers
    });
    return data;
  },

  /**
   * Update an existing variation
   */
  updateVariation: async (
    variationId: string,
    payload: { storage_capacity: number; price: number; note?: string },
    getToken: () => Promise<string | null>
  ) => {
    const headers = await getClientAuthHeaders(getToken);
    const { data } = await apiClient.patch(
      `variations/${variationId}/update`,
      payload,
      { headers }
    );
    return data;
  },

  /**
   * Delete a variation
   */
  deleteVariation: async (
    variationId: string,
    getToken: () => Promise<string | null>
  ) => {
    const headers = await getClientAuthHeaders(getToken);
    await apiClient.delete(`variations/${variationId}/remove`, {
      headers
    });
  }
};

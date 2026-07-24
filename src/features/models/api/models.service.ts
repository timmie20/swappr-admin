import apiClient from '@/lib/api/client';
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

  getAll: async (filters?: DefaultFilters) => {
    const { data } = await apiClient.get<ModelsResponse>('/models', {
      params: filters
    });
    return data;
  },

  /**
   * Get a single brand by ID
   */
  getById: async (id: string): Promise<Model> => {
    const { data } = await apiClient.get<{ model: Model }>(`/models/${id}`);
    return data.model;
  },

  /**
   * Create a model
   */

  create: async (payload: CreateModelDto) => {
    const { data } = await apiClient.post<Model>(`/models/create`, payload);
    return data;
  },

  /**
   * Update an existing model
   */
  update: async (id: string, payload: UpdateModelDto): Promise<Model> => {
    const { data } = await apiClient.patch<{ model: Model }>(
      `/models/${id}/update`,
      payload
    );
    return data.model;
  },

  /**
   * Delete a variation
   */
  deleteModel: async (modelId: string) => {
    await apiClient.delete(`models/${modelId}/remove`);
  },

  /**
   * Create a new variation for a model
   */
  createVariation: async (payload: CreateVariationParams) => {
    const { data } = await apiClient.post(`/variations/add`, payload);
    return data;
  },

  /**
   * Update an existing variation
   */
  updateVariation: async (
    variationId: string,
    payload: { storage_capacity: number; price: number; note?: string }
  ) => {
    const { data } = await apiClient.patch(
      `variations/${variationId}/update`,
      payload
    );
    return data;
  },

  /**
   * Delete a variation
   */
  deleteVariation: async (variationId: string) => {
    await apiClient.delete(`variations/${variationId}/remove`);
  }
};

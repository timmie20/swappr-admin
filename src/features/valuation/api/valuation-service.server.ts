import apiClient from '@/lib/api-client';
import { QuestionsForModelResponse } from './valuation-service';
import { getAuthHeaders } from '@/lib/auth-headers.server';

/**
 * Valuation API Service - Server Side
 * For use in Server Components and Server Actions
 */
export const valuationApiServer = {
  /**
   * Get all questions with options for a specific model (Server-side)
   * Used to determine trade-in value assessment
   */
  getQuestionsForModel: async (
    modelId: string
  ): Promise<QuestionsForModelResponse> => {
    const headers = await getAuthHeaders();
    const { data } = await apiClient.get<QuestionsForModelResponse>(
      '/questions/for-model',
      {
        headers,
        params: { model_id: modelId }
      }
    );
    return data;
  }
};

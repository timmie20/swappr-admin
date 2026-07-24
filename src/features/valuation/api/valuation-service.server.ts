import { serverFetch } from '@/lib/api/server';
import { QuestionsForModelResponse } from './valuation-service';

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
    return serverFetch<QuestionsForModelResponse>('/questions/for-model', {
      params: { model_id: modelId }
    });
  }
};

import apiClient from '@/lib/api-client';
import { getClientAuthHeaders } from '@/lib/auth-headers';

/**
 * Option type for valuation questions
 */
export type ValuationOption = {
  id: string;
  text: string;
  value: number | null;
  type: string | null;
};

/**
 * Question type for valuation
 */
export type ValuationQuestion = {
  id: string;
  text: string;
  slug: string;
  brand_id: string | null;
  options: ValuationOption[];
};

/**
 * Response type for questions by model
 */
export type QuestionsForModelResponse = {
  model: { id: string; model_name: string };
  questions: ValuationQuestion[];
};

/**
 * Valuation API Service
 */
export const valuationApi = {
  /**
   * Get all questions with options for a specific model
   * Used to determine trade-in value assessment
   */
  getQuestionsForModel: async (
    modelId: string,
    getToken: () => Promise<string | null>
  ): Promise<QuestionsForModelResponse> => {
    const headers = await getClientAuthHeaders(getToken);
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

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
  model: { id: string; model_name: string; brand_id?: string };
  questions: ValuationQuestion[];
};

/**
 * Item for bulk assign valuation
 */
export type BulkAssignItem = {
  questionId: string;
  optionId: string;
  adjustmentType: 'add' | 'deduct';
  amount: number;
};

/**
 * Request payload for bulk assign
 */
export type BulkAssignRequest = {
  items: BulkAssignItem[];
};

/**
 * Response type for bulk assign
 */
export type BulkAssignResponse = {
  message: string;
  updated: number;
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
  },

  /**
   * Bulk assign valuation parameters to model
   * Sets adjustment type and amount for multiple options
   */
  bulkAssignValuation: async (
    modelId: string,
    brandId: string,
    payload: BulkAssignRequest,
    getToken: () => Promise<string | null>
  ): Promise<BulkAssignResponse> => {
    const headers = await getClientAuthHeaders(getToken);
    const { data } = await apiClient.post<BulkAssignResponse>(
      '/option-value/bulk-assign',
      payload,
      {
        headers,
        params: {
          model_id: modelId,
          brand_id: brandId
        }
      }
    );
    return data;
  }
};

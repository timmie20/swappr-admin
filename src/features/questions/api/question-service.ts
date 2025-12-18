import apiClient from '@/lib/api-client';
import { getClientAuthHeaders } from '@/lib/auth-headers';
import {
  Question,
  QuestionFilters,
  QuestionResponse,
  CreateQuestionDto
} from '../types/question.types';

/**
 * Brands API Service
 * All API calls related to questions
 */
export const questionApi = {
  /**
   * Get all brands with optional filters
   */
  getAll: async (
    filters: QuestionFilters | undefined,
    getToken: () => Promise<string | null>
  ): Promise<QuestionResponse> => {
    const headers = await getClientAuthHeaders(getToken);
    const { data } = await apiClient.get<QuestionResponse>('/questions', {
      headers,
      params: filters
    });
    return data;
  },

  /**
   * Get a single question by ID
   */
  getById: async (
    id: string,
    getToken: () => Promise<string | null>
  ): Promise<Question> => {
    const headers = await getClientAuthHeaders(getToken);
    const { data } = await apiClient.get<Question>(`/questions/${id}`, {
      headers
    });
    return data;
  },

  /**
   * Create a new question
   */
  create: async (
    payload: CreateQuestionDto,
    getToken: () => Promise<string | null>
  ): Promise<{ question: Question }> => {
    const headers = await getClientAuthHeaders(getToken);
    const { data } = await apiClient.post<{ question: Question }>(
      '/questions/create',
      payload,
      {
        headers
      }
    );
    return data;
  },

  /**
   * Update an existing question
   */
  update: async (
    id: string,
    payload: Partial<CreateQuestionDto>,
    getToken: () => Promise<string | null>
  ): Promise<{ question: Question }> => {
    const headers = await getClientAuthHeaders(getToken);
    const { data } = await apiClient.patch<{ question: Question }>(
      `/questions/${id}/update`,
      payload,
      {
        headers
      }
    );
    return data;
  },

  /**
   * Delete a question
   */
  delete: async (
    id: string,
    getToken: () => Promise<string | null>
  ): Promise<void> => {
    const headers = await getClientAuthHeaders(getToken);
    await apiClient.delete(`/questions/${id}/remove`, { headers });
  }
};

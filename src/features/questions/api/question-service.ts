import apiClient from '@/lib/api/client';
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
  getAll: async (filters?: QuestionFilters): Promise<QuestionResponse> => {
    const { data } = await apiClient.get<QuestionResponse>('/questions', {
      params: filters
    });
    return data;
  },

  /**
   * Get a single question by ID
   */
  getById: async (id: string): Promise<Question> => {
    const { data } = await apiClient.get<Question>(`/questions/${id}`);
    return data;
  },

  /**
   * Create a new question
   */
  create: async (
    payload: CreateQuestionDto
  ): Promise<{ question: Question }> => {
    const { data } = await apiClient.post<{ question: Question }>(
      '/questions/create',
      payload
    );
    return data;
  },

  /**
   * Update an existing question
   */
  update: async (
    id: string,
    payload: Partial<CreateQuestionDto>
  ): Promise<{ question: Question }> => {
    const { data } = await apiClient.patch<{ question: Question }>(
      `/questions/${id}/update`,
      payload
    );
    return data;
  },

  /**
   * Delete a question
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/questions/${id}/delete`);
  },

  /**
   * Create option(s) for a question
   */
  createOption: async (
    questionId: string,
    payload: { text?: string; options?: string[] },
    mode: 'single' | 'multiple'
  ): Promise<any> => {
    if (mode === 'single') {
      const singlePayload = {
        question_id: questionId,
        text: payload.text
      };
      const { data } = await apiClient.post(`/options/add`, singlePayload);
      return data;
    } else {
      const bulkPayload = {
        question_id: questionId,
        options: payload.options
      };
      const { data } = await apiClient.post(`/options/add-bulk`, bulkPayload);
      return data;
    }
  },

  /**
   * Update an option
   */
  updateOption: async (
    optionId: string,
    payload: { text: string }
  ): Promise<any> => {
    const { data } = await apiClient.patch(
      `/options/${optionId}/update`,
      payload
    );
    return data;
  },

  /**
   * Delete an option
   */
  deleteOption: async (optionId: string): Promise<void> => {
    await apiClient.delete(`/options/${optionId}/delete`);
  }
};

import apiClient from '@/lib/api-client';
import { getAuthHeaders } from '@/lib/auth-headers.server';
import {
  Question,
  QuestionFilters,
  QuestionResponse
} from '../types/question.types';

export const questionApiServer = {
  /**
   * Question Api service for server fetching
   * All apis related to Question
   */

  /**
   * Get all question with optional filters
   * @param filters - Optional pagination and search filters
   * @returns Promise<QuestionResponse>
   */
  getAll: async (filters?: QuestionFilters): Promise<QuestionResponse> => {
    const auth = await getAuthHeaders();

    const { data } = await apiClient.get<QuestionResponse>('/questions', {
      headers: auth,
      params: filters
    });
    return data;
  },

  getQuestionId: async (id: string) => {
    const auth = await getAuthHeaders();
    const { data } = await apiClient.get<Question>(`/questions/${id}`, {
      headers: auth
    });
    return data;
  }
};

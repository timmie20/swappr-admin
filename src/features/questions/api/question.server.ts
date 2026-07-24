import { serverFetch } from '@/lib/api/server';
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
    return serverFetch<QuestionResponse>('/questions', { params: filters });
  },

  getQuestionId: async (id: string) => {
    return serverFetch<Question>(`/questions/${id}`);
  }
};

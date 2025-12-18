import { Brand } from '@/features/brands';

export interface Question {
  id: string;
  slug: string;
  text: string;
  type: string;
  note?: string;
  brand?: Brand | null;
  created_at: string;
  updated_at: string;
}

export interface QuestionResponse {
  questions: Question[];
}

export interface QuestionFilters {}

export interface CreateQuestionDto {
  text: string;
  slug: string;
  type: string;
  note?: string;
  brand_id?: string;
}

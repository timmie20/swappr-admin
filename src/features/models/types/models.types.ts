import { Question } from '@/types';

export interface Model {
  id: string;
  model_name: string;
  desc: string;
  variations?: Variation[];
  valuationElements?: Question[]; // Questions for valuation
  brand?: {
    id: string;
    brand_name: string;
  };
  created_at: string;
  updated_at: string;
}

export interface Variation {
  id: string;
  storage_capacity: number;
  price?: number;
  note?: string;
  created_at: string;
  updated_at: string;
}

export interface ModelsResponse {
  models: Model[];
  total: number;
  page: number;
  limit: number;
}

export interface ModelFilters {
  search?: string;
  brandId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export type CreateModelDto = {
  brand_id: string;
  model_name: string;
  desc: string;
  variations: {
    storage_capacity: number;
    price: number;
  }[];
};

export type UpdateModelDto = Partial<CreateModelDto>;

export interface Model {
  id: string;
  model_name: string;
  desc: string;
  variations?: Variation[];
  brand?: {
    id: string;
    brand_name: string;
  };
  created_at: string;
  updated_at: string;
}

export interface Variation {
  id: string;
  storage_capacity: string;
  price?: number;
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

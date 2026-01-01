export interface Brand {
  id: string;
  brand_name: string;
  description?: string;
  logo?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateBrandDto {
  brand_name: string;
  description?: string;
}

export interface BrandFilters {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface BrandsResponse {
  brands: Brand[];
  total: number;
  page: number;
  limit: number;
}

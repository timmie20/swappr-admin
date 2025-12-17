export interface Brand {
  id: string;
  brand_name: string;
  description?: string;
  logo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBrandDto {
  name: string;
  description?: string;
  logo?: string;
}

export interface UpdateBrandDto extends Partial<CreateBrandDto> {}

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

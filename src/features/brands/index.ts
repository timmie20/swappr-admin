// Types
export type {
  Brand,
  CreateBrandDto,
  UpdateBrandDto,
  BrandFilters,
  BrandsResponse
} from './types/brand.types';

// Hooks
export {
  useBrands,
  useBrand,
  useCreateBrand,
  useUpdateBrand,
  useDeleteBrand
} from './hooks';

// API Service (if needed for server components)
export { brandsApi } from './api/brands.service';

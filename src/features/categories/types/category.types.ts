export interface SubCategory {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  display_order?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  type: string;
  is_active: boolean;
  is_primary: boolean;
  display_order: number;
  supports_variants: boolean;
  supports_carrier_status: boolean;
  supports_specifications: boolean;
  supports_stock_tracking: boolean;
  supports_swapping: boolean;
  created_at: string;
  updated_at: string;
  sub_categories: SubCategory[];
}

export interface CategoriesResponse {
  message: string;
  categories: Category[];
}

export type UpdateCategoryStatusDto = Partial<{
  is_active: boolean;
  is_primary: boolean;
  supports_variants: boolean;
  supports_carrier_status: boolean;
  supports_specifications: boolean;
  supports_stock_tracking: boolean;
  supports_swapping: boolean;
}>;

export const CATEGORY_CAPABILITY_FIELDS = [
  'supports_variants',
  'supports_carrier_status',
  'supports_specifications',
  'supports_stock_tracking',
  'supports_swapping'
] as const satisfies readonly (keyof UpdateCategoryStatusDto)[];

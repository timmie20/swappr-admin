export enum ProductPlatform {
  IOS = 'IOS',
  ANDROID = 'ANDROID',
  WINDOWS = 'WINDOWS',
  MACOS = 'MACOS',
  ACCESSORY = 'ACCESSORY',
  WATCHOS = 'WATCHOS',
  WEAROS = 'WEAROS',
  OTHER = 'OTHER'
}

export enum ProductCondition {
  NEW = 'NEW',
  UK = 'UK_USED',
  ECOFRIENDLY = 'ECOFRIENDLY'
}

export interface CollectionFilters {
  platform?: ProductPlatform[];
  brand_ids?: string[];
  category_ids?: string[];
  subcategory_ids?: string[];
  series?: string[];
  condition?: ProductCondition[];
  min_price?: number;
  max_price?: number;
  is_swappable?: boolean;
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  badge: string;
  description?: string;
  image?: string;
  is_active: boolean;
  sort_order: number;
  filters: CollectionFilters;
  created_at: string;
  updated_at: string;
}

export interface CollectionsResponse {
  message: string;
  collections: Collection[];
  total: number;
  page: number;
  limit: number;
}

export interface CollectionFilterParams {
  is_active?: boolean;
  page?: number;
  limit?: number;
}

export type CreateCollectionDto = {
  name: string;
  slug: string;
  badge: string;
  description?: string;
  image?: string;
  is_active?: boolean;
  sort_order?: number;
  filters?: CollectionFilters;
};

export type UpdateCollectionDto = Partial<CreateCollectionDto>;

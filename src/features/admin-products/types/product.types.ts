// GET /admin/products and /admin/products/:productId. Contract: swappr-backend
// plan/vendor-tiers/FRONTEND_HANDOFF.md, "Admin products". Read-only views of
// every listing (drafts, archived, inactive stores). Money is whole kobo.

import type {
  Page,
  VendorBadge,
  VendorTier
} from '@/features/admin-vendors/types/vendor.types';

export type { Page };

export type ProductCondition = 'NEW' | 'UK_USED' | 'ECOFRIENDLY';
export type ProductPlatform =
  | 'IOS'
  | 'ANDROID'
  | 'WINDOWS'
  | 'MACOS'
  | 'ACCESSORY'
  | 'WATCHOS'
  | 'WEAROS'
  | 'OTHER';
export type ProductMode = 'sale' | 'sale_swap';
/** Stock status */
export type ProductStockStatus = 'selling' | 'out_of_stock';
/** Omitted = published + unpublished (archived hidden) */
export type ProductState = 'published' | 'unpublished' | 'archived' | 'all';
export type ProductSort =
  | 'created_at'
  | 'updated_at'
  | 'name'
  | 'base_price'
  | 'total_stock';
export type HiddenReason = 'archived' | 'unpublished' | 'store_not_active';

export interface AdminProductRow {
  id: string;
  name: string;
  slug: string;
  /** The first image */
  image: string | null;
  base_price_kobo: number | null;
  condition: ProductCondition | null;
  platform: ProductPlatform | null;
  series: string | null;
  carrier_status: string | null;
  mode: ProductMode | null;
  status: ProductStockStatus | null;
  total_stock: number;
  variant_count: number;
  is_swappable: boolean;
  is_published: boolean;
  archived_at: string | null;
  /** Published, not archived, and the store is active */
  on_storefront: boolean;
  created_at: string;
  updated_at: string;
  vendor: {
    id: string;
    slug: string | null;
    trading_name: string | null;
    business_name: string | null;
    logo_url: string | null;
    store_active: boolean;
  };
  category: { id: string; name: string; slug: string };
  subcategory: { id: string; name: string; slug: string } | null;
  brand: { id: string; brand_name: string } | null;
}

export interface AdminProductVariant {
  id: string;
  sku: string | null;
  color: string | null;
  storage: string | null;
  price_kobo: number | null;
  stock_quantity: number;
  reserved_stock: number;
  created_at: string;
}

export interface AdminProductDetail
  extends Omit<
    AdminProductRow,
    'image' | 'variant_count' | 'vendor' | 'category'
  > {
  description: string | null;
  images: string[];
  specifications: Record<string, unknown> | null;
  category: AdminProductRow['category'] & { type: string | null };
  vendor: AdminProductRow['vendor'] & {
    tier: VendorTier;
    badges: VendorBadge[];
    is_inspection_verified: boolean;
    suspended_at: string | null;
    archived_at: string | null;
  };
  /** Empty when it's on the storefront */
  hidden_reasons: HiddenReason[];
  /** Ordered by storage, then colour */
  variants: AdminProductVariant[];
  /** Counts only (no money), so every admin role sees them */
  activity: {
    orders: {
      total: number;
      awaiting_payment: number;
      needs_action: number;
      awaiting_delivery_confirmation: number;
      completed: number;
      cancelled: number;
    };
    /** Delivered and not refunded */
    units_sold: number;
    last_ordered_at: string | null;
    in_carts: number;
  };
}

export interface QueryAdminProductsParams {
  search?: string;
  vendor_id?: string;
  category_id?: string;
  subcategory_id?: string;
  brand_id?: string;
  condition?: ProductCondition;
  platform?: ProductPlatform;
  mode?: ProductMode;
  status?: ProductStockStatus;
  state?: ProductState;
  on_storefront?: boolean;
  is_swappable?: boolean;
  min_price_kobo?: number;
  max_price_kobo?: number;
  /** Total stock at most this: 0 sold out, 3 low stock */
  max_stock?: number;
  /** Created between, ISO */
  from?: string;
  to?: string;
  sort_by?: ProductSort;
  sort_order?: 'ASC' | 'DESC';
  page?: number;
  /** At most 100 */
  limit?: number;
}

/** Admin actions on a listing; each needs a reason (1–500, trimmed) */
export type ProductAction =
  | 'publish'
  | 'unpublish'
  | 'archive'
  | 'restore'
  | 'delete';

export const CONDITION_LABEL: Record<ProductCondition, string> = {
  NEW: 'New',
  UK_USED: 'UK used',
  ECOFRIENDLY: 'Eco-friendly'
};

export const PLATFORM_LABEL: Record<ProductPlatform, string> = {
  IOS: 'iOS',
  ANDROID: 'Android',
  WINDOWS: 'Windows',
  MACOS: 'macOS',
  ACCESSORY: 'Accessory',
  WATCHOS: 'watchOS',
  WEAROS: 'Wear OS',
  OTHER: 'Other'
};

export const MODE_LABEL: Record<ProductMode, string> = {
  sale: 'Sale',
  sale_swap: 'Sale or swap'
};

export const HIDDEN_REASON_LABEL: Record<HiddenReason, string> = {
  archived: 'Archived',
  unpublished: 'Not published (draft)',
  store_not_active: 'The store isn’t active'
};

export const HIDDEN_REASON_HELP: Record<HiddenReason, string> = {
  archived: 'The listing was archived. Archived listings never show.',
  unpublished:
    'The listing is a draft. It shows once it’s published (by the vendor or an admin).',
  store_not_active:
    'The vendor’s store is off the storefront (Tier 0: suspended, archived or not fully verified). Their listings come back when the store is active again.'
};

export const productVendorName = (v: {
  trading_name: string | null;
  business_name: string | null;
}) => v.trading_name || v.business_name || 'Unnamed vendor';

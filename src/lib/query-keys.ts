/**
 * Query Key Factories for consistent cache management
 *
 * Benefits:
 * - Type-safe query keys
 * - Centralized key management
 * - Easy cache invalidation
 * - Prevents key collisions
 *
 * Usage:
 * - queries.brands.all() => ['brands']
 * - queries.brands.list(filters) => ['brands', 'list', { ...filters }]
 * - queries.brands.detail(id) => ['brands', 'detail', id]
 */

export const queryKeys = {
  // Brands
  brands: {
    all: () => ['brands'] as const,
    lists: () => [...queryKeys.brands.all(), 'list'] as const,
    list: (filters?: unknown) =>
      [...queryKeys.brands.lists(), filters] as const,
    details: () => [...queryKeys.brands.all(), 'detail'] as const,
    detail: (id: string | number) =>
      [...queryKeys.brands.details(), id] as const
  },

  // Models
  models: {
    all: () => ['models'] as const,
    lists: () => [...queryKeys.models.all(), 'list'] as const,
    list: (filters?: unknown) =>
      [...queryKeys.models.lists(), filters] as const,
    details: () => [...queryKeys.models.all(), 'detail'] as const,
    detail: (id: string | number) =>
      [...queryKeys.models.details(), id] as const,
    byBrand: (brandId: string | number) =>
      [...queryKeys.models.all(), 'brand', brandId] as const
  },

  // Products
  products: {
    all: () => ['products'] as const,
    lists: () => [...queryKeys.products.all(), 'list'] as const,
    list: (filters?: unknown) =>
      [...queryKeys.products.lists(), filters] as const,
    details: () => [...queryKeys.products.all(), 'detail'] as const,
    detail: (id: string | number) =>
      [...queryKeys.products.details(), id] as const
  },

  // Users
  users: {
    all: () => ['users'] as const,
    lists: () => [...queryKeys.users.all(), 'list'] as const,
    list: (filters?: unknown) => [...queryKeys.users.lists(), filters] as const,
    details: () => [...queryKeys.users.all(), 'detail'] as const,
    detail: (id: string | number) =>
      [...queryKeys.users.details(), id] as const,
    profile: () => [...queryKeys.users.all(), 'profile'] as const
  },

  // Categories (if needed)
  categories: {
    all: () => ['categories'] as const,
    lists: () => [...queryKeys.categories.all(), 'list'] as const,
    list: (filters?: unknown) =>
      [...queryKeys.categories.lists(), filters] as const,
    details: () => [...queryKeys.categories.all(), 'detail'] as const,
    detail: (id: string | number) =>
      [...queryKeys.categories.details(), id] as const
  }
} as const;

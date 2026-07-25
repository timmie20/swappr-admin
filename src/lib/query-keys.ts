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
  },

  // Collections
  collections: {
    all: () => ['collections'] as const,
    lists: () => [...queryKeys.collections.all(), 'list'] as const,
    list: (filters?: unknown) =>
      [...queryKeys.collections.lists(), filters] as const,
    details: () => [...queryKeys.collections.all(), 'detail'] as const,
    detail: (id: string | number) =>
      [...queryKeys.collections.details(), id] as const
  },

  // Questions
  questions: {
    all: () => ['questions'] as const,
    lists: () => [...queryKeys.questions.all(), 'list'] as const,
    list: (filters?: unknown) =>
      [...queryKeys.questions.lists(), filters] as const,
    details: () => [...queryKeys.questions.all(), 'detail'] as const,
    detail: (id: string | number) =>
      [...queryKeys.questions.details(), id] as const
  },

  // Valuation
  valuation: {
    all: () => ['valuation'] as const,
    forModel: (modelId: string) =>
      [...queryKeys.valuation.all(), 'for-model', modelId] as const
  }
} as const;

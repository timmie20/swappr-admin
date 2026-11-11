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

  // Payouts
  payouts: {
    all: () => ['payouts'] as const,
    lists: () => [...queryKeys.payouts.all(), 'list'] as const,
    list: (filters?: unknown) =>
      [...queryKeys.payouts.lists(), filters] as const,
    details: () => [...queryKeys.payouts.all(), 'detail'] as const,
    detail: (id: string) => [...queryKeys.payouts.details(), id] as const
  },

  // Orders
  orders: {
    all: () => ['orders'] as const,
    lists: () => [...queryKeys.orders.all(), 'list'] as const,
    list: (filters?: unknown) =>
      [...queryKeys.orders.lists(), filters] as const,
    details: () => [...queryKeys.orders.all(), 'detail'] as const,
    detail: (orderNumber: string) =>
      [...queryKeys.orders.details(), orderNumber] as const
  },

  // Delivery reviews
  deliveryReviews: {
    all: () => ['delivery-reviews'] as const,
    lists: () => [...queryKeys.deliveryReviews.all(), 'list'] as const,
    list: (filters?: unknown) =>
      [...queryKeys.deliveryReviews.lists(), filters] as const
  },

  // Ledger
  ledger: {
    all: () => ['ledger'] as const,
    summary: () => [...queryKeys.ledger.all(), 'summary'] as const,
    reconciliation: () =>
      [...queryKeys.ledger.all(), 'reconciliation'] as const,
    transactions: (filters?: unknown) =>
      [...queryKeys.ledger.all(), 'transactions', filters] as const,
    paystackSettlements: () =>
      [...queryKeys.ledger.all(), 'paystack-settlements'] as const,
    syncIssues: (filters?: unknown) =>
      [...queryKeys.ledger.all(), 'sync-issues', filters] as const
  },

  // Admin Overview dashboard (one key per section)
  adminOverview: {
    all: () => ['admin-overview'] as const,
    users: () => [...queryKeys.adminOverview.all(), 'users'] as const,
    vendors: () => [...queryKeys.adminOverview.all(), 'vendors'] as const,
    marketplace: () =>
      [...queryKeys.adminOverview.all(), 'marketplace'] as const,
    finance: () => [...queryKeys.adminOverview.all(), 'finance'] as const,
    payouts: () => [...queryKeys.adminOverview.all(), 'payouts'] as const,
    series: (metric: string, range: string) =>
      [...queryKeys.adminOverview.all(), 'series', metric, range] as const,
    orderStatusBreakdown: () =>
      [...queryKeys.adminOverview.all(), 'order-status-breakdown'] as const,
    recentOrders: (limit: number) =>
      [...queryKeys.adminOverview.all(), 'recent-orders', limit] as const
  },

  // Admin vendor accounts
  adminVendors: {
    all: () => ['admin-vendors'] as const,
    list: (params?: unknown) =>
      [...queryKeys.adminVendors.all(), 'list', params] as const,
    detail: (vendorId: string) =>
      [...queryKeys.adminVendors.all(), 'detail', vendorId] as const,
    orders: (vendorId: string, params?: unknown) =>
      [...queryKeys.adminVendors.detail(vendorId), 'orders', params] as const,
    requests: (vendorId: string, params?: unknown) =>
      [...queryKeys.adminVendors.detail(vendorId), 'requests', params] as const,
    transactions: (vendorId: string, params?: unknown) =>
      [
        ...queryKeys.adminVendors.detail(vendorId),
        'transactions',
        params
      ] as const,
    history: (vendorId: string, params?: unknown) =>
      [...queryKeys.adminVendors.detail(vendorId), 'history', params] as const
  },

  // Audit log (admin actions + vendor standing)
  adminAudit: {
    all: () => ['admin-audit'] as const,
    list: (params?: unknown) =>
      [...queryKeys.adminAudit.all(), 'list', params] as const,
    catalogue: () => [...queryKeys.adminAudit.all(), 'catalogue'] as const
  },

  // Admin product views (every listing, any state)
  adminProducts: {
    all: () => ['admin-products'] as const,
    list: (params?: unknown) =>
      [...queryKeys.adminProducts.all(), 'list', params] as const,
    detail: (productId: string) =>
      [...queryKeys.adminProducts.all(), 'detail', productId] as const
  },

  // Two-step sign-in (the signed-in admin's own status)
  mfa: {
    all: () => ['mfa'] as const,
    status: () => [...queryKeys.mfa.all(), 'status'] as const
  },

  // Admin accounts (superadmin)
  admins: {
    all: () => ['admins'] as const,
    list: () => [...queryKeys.admins.all(), 'list'] as const
  },

  // Platform fee settings (superadmin)
  platformFee: {
    all: () => ['platform-fee'] as const,
    settings: () => [...queryKeys.platformFee.all(), 'settings'] as const,
    preview: (amountKobo: number) =>
      [...queryKeys.platformFee.all(), 'preview', amountKobo] as const
  },

  // Admin customer accounts
  adminCustomers: {
    all: () => ['admin-customers'] as const,
    list: (params?: unknown) =>
      [...queryKeys.adminCustomers.all(), 'list', params] as const,
    detail: (customerId: string) =>
      [...queryKeys.adminCustomers.all(), 'detail', customerId] as const
  },

  // Valuation
  valuation: {
    all: () => ['valuation'] as const,
    forModel: (modelId: string) =>
      [...queryKeys.valuation.all(), 'for-model', modelId] as const
  }
} as const;

# React Query Setup Complete ✅

## What was configured:

### 1. Core Setup
- ✅ **QueryClient** configured with optimal defaults (`src/lib/query-client.ts`)
- ✅ **QueryClientProvider** added to app providers (`src/components/layout/providers.tsx`)
- ✅ **React Query DevTools** installed and configured (dev only)

### 2. API Infrastructure
- ✅ **Axios client** with interceptors (`src/lib/api-client.ts`)
  - Base URL from env: `NEXT_BASE_URL=http://localhost:8000`
  - Global error handling
  - 30s timeout
  
- ✅ **Auth headers helper** (`src/lib/auth-headers.ts`)
  - Client-side: `getClientAuthHeaders(getToken)`
  - Server-side: `getAuthHeaders()`

- ✅ **Query key factory** (`src/lib/query-keys.ts`)
  - Centralized cache key management
  - Type-safe keys
  - Easy invalidation

### 3. Example Feature: Brands
Complete working example in `src/features/brands/`:

```
brands/
├── api/
│   └── brands.service.ts      # API service layer
├── hooks/
│   ├── use-brands.ts          # Query hooks (GET)
│   ├── use-create-brand.ts    # Create mutation
│   ├── use-update-brand.ts    # Update mutation (with optimistic updates)
│   ├── use-delete-brand.ts    # Delete mutation
│   └── index.ts               # Barrel export
├── types/
│   └── brand.types.ts         # TypeScript types
└── index.ts                   # Main export
```

## How to use:

### In a component:

```tsx
'use client';

import { useBrands, useCreateBrand } from '@/features/brands';

export function BrandsPage() {
  const { data, isLoading, error } = useBrands({ search: 'apple' });
  const createBrand = useCreateBrand();

  if (isLoading) return <Skeleton />;
  if (error) return <div>Error: {error.message}</div>;

  const handleCreate = (values) => {
    createBrand.mutate(values, {
      onSuccess: () => {
        // Handle success
      }
    });
  };

  return (
    <div>
      {data?.data.map((brand) => (
        <div key={brand.id}>{brand.name}</div>
      ))}
    </div>
  );
}
```

## Next Steps:

To add a new feature (e.g., Models), replicate the brands structure:

1. Create `features/models/types/model.types.ts`
2. Create `features/models/api/models.service.ts`
3. Create hooks in `features/models/hooks/`
4. Add query keys to `src/lib/query-keys.ts` (already added)
5. Use in components

## Documentation

Full guide: `docs/REACT_QUERY_SETUP.md`

## Key Principles

✅ No API calls in components  
✅ One hook per query/mutation  
✅ Use query key factory  
✅ Handle loading/error/success states  
✅ Invalidate related queries after mutations  
✅ Type everything

Happy coding! 🚀

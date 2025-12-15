# React Query Setup & Patterns

This project uses **React Query (TanStack Query)** for server state management.

## 📁 File Structure

```
src/
├── lib/
│   ├── query-client.ts      # QueryClient configuration
│   ├── api-client.ts         # Axios instance with interceptors
│   ├── auth-headers.ts       # Auth token helpers
│   └── query-keys.ts         # Query key factories
├── features/
│   └── [feature]/
│       ├── api/              # API service functions
│       ├── hooks/            # React Query hooks
│       ├── types/            # TypeScript types
│       └── components/       # UI components
```

## 🔧 Configuration

### QueryClient (`src/lib/query-client.ts`)

- **staleTime**: 5 minutes
- **gcTime**: 10 minutes
- **retry**: 1 attempt for queries, 0 for mutations
- **refetchOnWindowFocus**: Only in production

### API Client (`src/lib/api-client.ts`)

- Base URL: `process.env.NEXT_BASE_URL`
- Timeout: 30 seconds
- Automatic error handling
- Request/response interceptors

## 📝 Patterns & Best Practices

### 1. Query Keys

Use the centralized query key factory from `src/lib/query-keys.ts`:

```typescript
import { queryKeys } from '@/lib/query-keys';

// ✅ Good
const queryKey = queryKeys.brands.list({ status: 'active' });

// ❌ Bad - don't create keys inline
const queryKey = ['brands', 'list', { status: 'active' }];
```

### 2. Service Layer

Create API service functions in `features/[feature]/api/`:

```typescript
// features/brands/api/brands.service.ts
import apiClient from '@/lib/api-client';
import { getClientAuthHeaders } from '@/lib/auth-headers';

export const brandsApi = {
  getAll: async (getToken: () => Promise<string | null>) => {
    const headers = await getClientAuthHeaders(getToken);
    const { data } = await apiClient.get('/brands', { headers });
    return data;
  },

  getById: async (id: string, getToken: () => Promise<string | null>) => {
    const headers = await getClientAuthHeaders(getToken);
    const { data } = await apiClient.get(`/brands/${id}`, { headers });
    return data;
  },

  create: async (
    payload: CreateBrandDto,
    getToken: () => Promise<string | null>
  ) => {
    const headers = await getClientAuthHeaders(getToken);
    const { data } = await apiClient.post('/brands', payload, { headers });
    return data;
  }
};
```

### 3. Query Hooks

Create custom hooks in `features/[feature]/hooks/`:

```typescript
// features/brands/hooks/use-brands.ts
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { queryKeys } from '@/lib/query-keys';
import { brandsApi } from '../api/brands.service';

export function useBrands(filters?: Record<string, unknown>) {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: queryKeys.brands.list(filters),
    queryFn: () => brandsApi.getAll(getToken),
    enabled: !!getToken // Only run if authenticated
  });
}

export function useBrand(id: string) {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: queryKeys.brands.detail(id),
    queryFn: () => brandsApi.getById(id, getToken),
    enabled: !!id && !!getToken
  });
}
```

### 4. Mutation Hooks

```typescript
// features/brands/hooks/use-create-brand.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/query-keys';
import { brandsApi } from '../api/brands.service';

export function useCreateBrand() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateBrandDto) =>
      brandsApi.create(payload, getToken),
    onSuccess: () => {
      // Invalidate and refetch brands list
      queryClient.invalidateQueries({ queryKey: queryKeys.brands.lists() });
      toast.success('Brand created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create brand');
      console.error(error);
    }
  });
}
```

### 5. Using Hooks in Components

```typescript
// features/brands/components/brands-list.tsx
'use client';

import { useBrands } from '../hooks/use-brands';
import { Skeleton } from '@/components/ui/skeleton';

export function BrandsList() {
  const { data: brands, isLoading, isError, error } = useBrands();

  if (isLoading) {
    return <Skeleton className="h-40 w-full" />;
  }

  if (isError) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div>
      {brands?.map((brand) => (
        <div key={brand.id}>{brand.name}</div>
      ))}
    </div>
  );
}
```

### 6. Optimistic Updates

```typescript
export function useUpdateBrand() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateBrandDto }) =>
      brandsApi.update(id, payload, getToken),

    onMutate: async ({ id, payload }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.brands.detail(id)
      });

      // Snapshot previous value
      const previousBrand = queryClient.getQueryData(
        queryKeys.brands.detail(id)
      );

      // Optimistically update
      queryClient.setQueryData(queryKeys.brands.detail(id), (old: any) => ({
        ...old,
        ...payload
      }));

      return { previousBrand };
    },

    onError: (err, { id }, context) => {
      // Rollback on error
      queryClient.setQueryData(
        queryKeys.brands.detail(id),
        context?.previousBrand
      );
      toast.error('Failed to update brand');
    },

    onSuccess: (data, { id }) => {
      // Update cache with server response
      queryClient.setQueryData(queryKeys.brands.detail(id), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.brands.lists() });
      toast.success('Brand updated successfully');
    }
  });
}
```

## 🎯 Key Principles

1. **No API calls in components** - Always use hooks
2. **One hook per query/mutation** - Keep them focused and reusable
3. **Use query keys factory** - Centralized cache key management
4. **Handle all states** - loading, error, success, empty
5. **Invalidate smartly** - Only invalidate related queries
6. **Type everything** - Request/response types for all APIs

## 🛠️ DevTools

React Query DevTools are enabled in development. Press the React Query icon in the bottom-left corner to inspect:

- Active queries
- Query cache
- Mutations
- Query invalidations

## 🔐 Authentication

All API requests automatically include the Clerk Bearer token via `getClientAuthHeaders`:

```typescript
const headers = await getClientAuthHeaders(getToken);
```

The `getToken` function comes from Clerk's `useAuth()` hook.

## 📚 Resources

- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Query Keys Guide](https://tkdodo.eu/blog/effective-react-query-keys)
- [Practical React Query](https://tkdodo.eu/blog/practical-react-query)

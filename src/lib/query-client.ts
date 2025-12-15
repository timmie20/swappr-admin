import { QueryClient, DefaultOptions } from '@tanstack/react-query';

const queryConfig: DefaultOptions = {
  queries: {
    // Throw errors instead of returning them in data
    throwOnError: false,
    // Refetch on window focus in production for fresh data
    refetchOnWindowFocus: process.env.NODE_ENV === 'production',
    // Retry failed requests
    retry: 1,
    // Cache time: 5 minutes
    staleTime: 5 * 60 * 1000,
    // Garbage collection: 10 minutes
    gcTime: 10 * 60 * 1000
  },
  mutations: {
    // Don't retry mutations by default
    retry: false,
    // Throw errors for easier error boundary handling
    throwOnError: false
  }
};

export const queryClient = new QueryClient({
  defaultOptions: queryConfig
});

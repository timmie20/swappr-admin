import { auth } from '@clerk/nextjs/server';

/**
 * Get authorization headers with Clerk token for server-side API requests
 * Use this in Server Components and Server Actions ONLY
 *
 * @example
 * ```ts
 * // In a Server Component or Server Action
 * const headers = await getAuthHeaders();
 * const response = await fetch('/api/brands', { headers });
 * ```
 */
export async function getAuthHeaders() {
  const authObj = await auth();

  // Get JWT template name from environment variable
  const template = process.env.NEXT_PUBLIC_CLERK_JWT_TEMPLATE;

  // Request token with the specified JWT template
  const token = await authObj.getToken({ template });

  if (!token) {
    throw new Error('Unauthorized - No auth token available');
  }

  return {
    Authorization: `Bearer ${token}`
  };
}

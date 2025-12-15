/**
 * Get authorization headers with Clerk token for client-side API requests
 * Use this in Client Components with useAuth hook
 * @param getToken - The getToken function from useAuth() hook
 */
export async function getClientAuthHeaders(
  getToken: (options?: { template?: string }) => Promise<string | null>
) {
  // Get JWT template name from environment variable
  const template = process.env.NEXT_PUBLIC_CLERK_JWT_TEMPLATE;

  // Request token with the specified JWT template
  const token = await getToken({ template });

  if (!token) {
    throw new Error('Unauthorized - No auth token available');
  }

  return {
    Authorization: `Bearer ${token}`
  };
}

import { redirect } from 'next/navigation';
import { cache } from 'react';
import type { AdminProfile, AdminSession } from '@/types/auth';
import { serverFetch } from '../api/server';

export const getServerAdminProfile = cache(async (): Promise<AdminProfile> => {
  return serverFetch<AdminProfile>('/admins/me', { revalidate: 0 });
});

export const getServerSession = cache(
  async (): Promise<AdminSession | null> => {
    try {
      const admin = await getServerAdminProfile();

      return {
        id: admin.id,
        email: admin.email,
        firstName: admin.first_name,
        lastName: admin.last_name,
        avatarUrl: admin.avatar_url,
        role: admin.role
      };
    } catch {
      return null;
    }
  }
);

/**
 * Use in Server Components that require authentication.
 * Redirects to /auth/sign-in if no valid session exists.
 */
export async function requireSession(): Promise<AdminSession> {
  const session = await getServerSession();
  if (!session) redirect('/auth/sign-in');
  return session;
}

import { SuperadminRequired } from '@/components/superadmin-required';
import { isSuperadmin } from '@/lib/auth/roles';
import { requireSession } from '@/lib/auth/session';

/**
 * Renders its children only for superadmins. The API enforces the same rule
 * (403 for everyone else); this just avoids showing a screen that can only
 * fail.
 */
export default async function SuperadminGate({
  children
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  if (!isSuperadmin(session.role)) return <SuperadminRequired />;
  return <>{children}</>;
}

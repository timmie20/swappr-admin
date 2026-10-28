import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getApiError, isForbidden } from '@/lib/api/errors';
import { IconAlertTriangle, IconLock } from '@tabler/icons-react';

export function SuperadminRequired() {
  return (
    <Alert>
      <IconLock />
      <AlertTitle>Superadmin access required</AlertTitle>
      <AlertDescription>
        Finance and delivery-review screens are limited to superadmins. Ask a
        superadmin if you need something done here.
      </AlertDescription>
    </Alert>
  );
}

/** Error state for a failed query: a 403 gets the superadmin message. */
export function QueryErrorState({
  error,
  title = 'Could not load this page'
}: {
  error: unknown;
  title?: string;
}) {
  if (isForbidden(error)) return <SuperadminRequired />;
  return (
    <Alert variant='destructive'>
      <IconAlertTriangle />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{getApiError(error).message}</AlertDescription>
    </Alert>
  );
}

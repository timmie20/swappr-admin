import { Metadata } from 'next';
import { Clock } from 'lucide-react';
import { formatRetryAfter } from '@/lib/api/rate-limit';
import { ReloadButton } from './reload-button';

export const metadata: Metadata = {
  title: 'Too many requests'
};

// Shown in place of a page when the session couldn't be refreshed because of
// a 429 (see middleware). The session is fine, so this never signs out.
// Fixed copy: the query string is for the wait time only, never for text.
export default async function TooManyRequests({
  searchParams
}: {
  searchParams: Promise<{ retry_after?: string }>;
}) {
  const { retry_after } = await searchParams;
  const seconds = Number(retry_after);
  const wait = formatRetryAfter(
    retry_after && Number.isFinite(seconds) ? Math.ceil(seconds) : null
  );

  return (
    <div className='flex min-h-screen flex-col items-center justify-center px-6 text-center'>
      <div className='bg-muted mb-4 flex h-12 w-12 items-center justify-center rounded-full'>
        <Clock className='text-muted-foreground h-5 w-5' />
      </div>
      <h1 className='mb-1 text-base font-semibold'>Too many requests</h1>
      <p className='text-muted-foreground mb-5 max-w-sm text-sm'>
        We&apos;re getting a lot of requests from your connection. You&apos;re
        still signed in. Try again {wait}.
      </p>
      <ReloadButton />
    </div>
  );
}

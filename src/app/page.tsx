import { getServerSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';

export default async function Page() {
  const session = await getServerSession();

  if (!session) {
    return redirect('/auth/sign-in');
  } else {
    redirect('/dashboard/overview');
  }
}

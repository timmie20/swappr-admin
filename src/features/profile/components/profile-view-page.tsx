import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getServerSession } from '@/lib/auth/session';

export default async function ProfileViewPage() {
  const session = await getServerSession();

  if (!session) return null;

  const fullName =
    [session.firstName, session.lastName].filter(Boolean).join(' ') ||
    session.email;

  return (
    <div className='flex w-full flex-col p-4'>
      <Card className='max-w-lg'>
        <CardHeader>
          <CardTitle className='text-left text-2xl font-bold'>
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent className='flex items-center gap-4'>
          <Avatar className='h-16 w-16'>
            <AvatarImage src={session.avatarUrl} alt={fullName} />
            <AvatarFallback className='text-lg'>
              {fullName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className='space-y-1'>
            <p className='text-lg font-medium'>{fullName}</p>
            <p className='text-muted-foreground text-sm'>{session.email}</p>
            <Badge variant='secondary' className='capitalize'>
              {session.role}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

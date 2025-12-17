import React from 'react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Skeleton } from '../ui/skeleton';

export default function BrandDetailsSkeleton() {
  return (
    <Card className='mx-auto w-full'>
      <CardHeader>
        <Skeleton className='h-8 w-48' />
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          <div className='space-y-2'>
            <Skeleton className='h-4 w-24' /> {/* Label */}
            <Skeleton className='h-10 w-full' /> {/* Input */}
          </div>
          <div className='space-y-2'>
            <Skeleton className='h-4 w-24' /> {/* Label */}
            <Skeleton className='h-10 w-full' /> {/* Input */}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

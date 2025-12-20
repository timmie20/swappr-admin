import React from 'react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Skeleton } from '../ui/skeleton';

export default function ValuationManagementSkeleton() {
  return (
    <div className='space-y-6'>
      {/* Header Skeleton */}
      <div className='space-y-2'>
        <Skeleton className='h-8 w-64' /> {/* Title */}
        <Skeleton className='h-4 w-96' /> {/* Description */}
      </div>

      {/* Separator */}
      <Skeleton className='h-px w-full' />

      {/* Valuation Questions Grid Skeleton */}
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {/* Question Card 1 */}
        <Card className='h-fit max-w-sm px-3'>
          <CardHeader>
            <Skeleton className='h-6 w-full' /> {/* Question Title */}
            <Skeleton className='h-3 w-32' /> {/* Slug */}
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {/* Option 1 */}
              <div className='space-y-2'>
                <Skeleton className='h-4 w-24' /> {/* Option Label */}
                <div className='flex gap-2'>
                  <Skeleton className='h-10 flex-1' /> {/* Select */}
                  <Skeleton className='h-10 flex-1' /> {/* Input */}
                </div>
              </div>

              {/* Option 2 */}
              <div className='space-y-2'>
                <Skeleton className='h-4 w-28' />
                <div className='flex gap-2'>
                  <Skeleton className='h-10 flex-1' />
                  <Skeleton className='h-10 flex-1' />
                </div>
              </div>

              {/* Option 3 */}
              <div className='space-y-2'>
                <Skeleton className='h-4 w-20' />
                <div className='flex gap-2'>
                  <Skeleton className='h-10 flex-1' />
                  <Skeleton className='h-10 flex-1' />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Question Card 2 */}
        <Card className='h-fit max-w-sm px-3'>
          <CardHeader>
            <Skeleton className='h-6 w-full' />
            <Skeleton className='h-3 w-28' />
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              <div className='space-y-2'>
                <Skeleton className='h-4 w-32' />
                <div className='flex gap-2'>
                  <Skeleton className='h-10 flex-1' />
                  <Skeleton className='h-10 flex-1' />
                </div>
              </div>

              <div className='space-y-2'>
                <Skeleton className='h-4 w-24' />
                <div className='flex gap-2'>
                  <Skeleton className='h-10 flex-1' />
                  <Skeleton className='h-10 flex-1' />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Question Card 3 */}
        <Card className='h-fit max-w-sm px-3'>
          <CardHeader>
            <Skeleton className='h-6 w-full' />
            <Skeleton className='h-3 w-36' />
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              <div className='space-y-2'>
                <Skeleton className='h-4 w-28' />
                <div className='flex gap-2'>
                  <Skeleton className='h-10 flex-1' />
                  <Skeleton className='h-10 flex-1' />
                </div>
              </div>

              <div className='space-y-2'>
                <Skeleton className='h-4 w-20' />
                <div className='flex gap-2'>
                  <Skeleton className='h-10 flex-1' />
                  <Skeleton className='h-10 flex-1' />
                </div>
              </div>

              <div className='space-y-2'>
                <Skeleton className='h-4 w-24' />
                <div className='flex gap-2'>
                  <Skeleton className='h-10 flex-1' />
                  <Skeleton className='h-10 flex-1' />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons Skeleton */}
      <div className='flex items-center justify-between'>
        <Skeleton className='h-10 w-24' /> {/* Reset Button */}
        <Skeleton className='h-10 w-40' /> {/* Save Button */}
      </div>
    </div>
  );
}

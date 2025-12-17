import React from 'react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Skeleton } from '../ui/skeleton';

export default function ModelEditSkeleton() {
  return (
    <div className='space-y-6'>
      {/* Basic Info Card Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className='h-8 w-48' /> {/* CardTitle */}
          <Skeleton className='h-4 w-64' /> {/* CardDescription */}
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {/* Model Name field */}
            <div className='space-y-2'>
              <Skeleton className='h-4 w-24' /> {/* Label */}
              <Skeleton className='h-10 w-full' /> {/* Input */}
            </div>

            {/* Brand Select field */}
            <div className='space-y-2'>
              <Skeleton className='h-4 w-16' /> {/* Label */}
              <Skeleton className='h-10 w-full' /> {/* Select */}
            </div>

            {/* Description field */}
            <div className='space-y-2'>
              <Skeleton className='h-4 w-24' /> {/* Label */}
              <Skeleton className='h-24 w-full' /> {/* Textarea */}
            </div>

            {/* Separator */}
            <Skeleton className='h-px w-full' />

            {/* Submit button */}
            <Skeleton className='h-10 w-32' />
          </div>
        </CardContent>
      </Card>

      {/* Variations Table Skeleton */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div className='space-y-2'>
              <Skeleton className='h-8 w-40' /> {/* CardTitle */}
              <Skeleton className='h-4 w-56' /> {/* CardDescription */}
            </div>
            <Skeleton className='h-10 w-36' /> {/* Add Variation button */}
          </div>
        </CardHeader>
        <CardContent>
          {/* Table skeleton */}
          <div className='space-y-4'>
            {/* Table header */}
            <div className='flex items-center gap-4 border-b pb-2'>
              <Skeleton className='h-4 w-32' /> {/* Variation Name */}
              <Skeleton className='h-4 w-24' /> {/* Created At */}
              <Skeleton className='h-4 w-24' /> {/* Updated At */}
              <Skeleton className='ml-auto h-4 w-16' /> {/* Actions */}
            </div>

            {/* Table rows */}
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className='flex items-center gap-4 border-b py-4'>
                <Skeleton className='h-4 w-32' /> {/* Variation Name */}
                <Skeleton className='h-4 w-24' /> {/* Created At */}
                <Skeleton className='h-4 w-24' /> {/* Updated At */}
                <Skeleton className='ml-auto h-8 w-8' /> {/* Actions button */}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

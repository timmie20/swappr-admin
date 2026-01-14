import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Brand } from '../types/brand.types';

export default function BrandDetailsPage({ brand }: { brand: Brand }) {
  return (
    <Card className='mx-auto w-full'>
      <CardHeader>
        <CardTitle className='text-left text-2xl font-bold'>
          Brand Details
        </CardTitle>
        <CardDescription>View brand information</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          <div>
            <label className='text-sm font-medium'>Brand Name</label>
            <p className='text-muted-foreground mt-1'>{brand.brand_name}</p>
          </div>
          <div>
            <label className='text-sm font-medium'>Brand ID</label>
            <p className='text-muted-foreground mt-1 font-mono text-xs'>
              {brand.id}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

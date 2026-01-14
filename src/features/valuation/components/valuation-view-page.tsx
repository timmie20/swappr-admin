import React from 'react';
import { notFound } from 'next/navigation';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { ValuationManagementSystem } from './valuation-management-system';
import { valuationApiServer } from '../api/valuation-service.server';

type ValuationViewPageProps = {
  modelId: string;
};

export default async function ValuationViewPage({
  modelId
}: ValuationViewPageProps) {
  // Fetch initial data on the server
  try {
    const initialData = await valuationApiServer.getQuestionsForModel(modelId);

    return (
      <div className='space-y-4'>
        <div className='flex items-start justify-between'>
          <Heading
            title={`Valuation Management for ${initialData.model.model_name}`}
            description='Configure valuation parameters for device assessment'
          />
        </div>
        <Separator />

        {/* Pass initial data to client component */}
        <ValuationManagementSystem
          modelId={modelId}
          initialData={initialData}
        />
      </div>
    );
  } catch (error) {
    // If model not found or other error
    notFound();
  }
}

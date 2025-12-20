import { Card, CardTitle } from '@/components/ui/card';
import React from 'react';
import ValuationAssignment from './valuation-assignment';
import { Model } from '@/features/models/types/models.types';
import { UseFormReturn } from 'react-hook-form';
import { Question } from '@/types';

type ValuationManagementModuleProps = {
  model: Model;
  form: UseFormReturn<any>;
};

export default function ValuationManagementModule({
  model,
  form
}: ValuationManagementModuleProps) {
  // Get valuation questions for this model
  const valuationQuestions = model.valuationElements || [];

  if (!valuationQuestions || valuationQuestions.length === 0) {
    return (
      <Card className='space-y-4 p-6'>
        <CardTitle>Valuation Parameters</CardTitle>
        <p className='text-muted-foreground text-sm'>
          No valuation questions configured for this model yet.
        </p>
      </Card>
    );
  }

  return (
    <Card className='space-y-4 p-6'>
      <CardTitle>Valuation Parameters</CardTitle>
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {valuationQuestions.map((question: Question) => (
          <ValuationAssignment
            key={question.id}
            question={question}
            form={form}
          />
        ))}
      </div>
    </Card>
  );
}

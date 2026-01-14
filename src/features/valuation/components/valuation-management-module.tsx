'use client';

import { Card, CardContent, CardTitle } from '@/components/ui/card';
import React from 'react';
import ValuationAssignment from './valuation-assignment';
import { ValuationQuestion } from '../api';
import { UseFormReturn } from 'react-hook-form';

type ValuationManagementModuleProps = {
  valuationQuestions: ValuationQuestion[];
  isLoading: boolean;
  form: UseFormReturn<any>;
};

export default function ValuationManagementModule({
  valuationQuestions,
  isLoading,
  form
}: ValuationManagementModuleProps) {
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

  if (isLoading) {
    return (
      <Card>
        <CardContent className='p-6'>
          <p className='text-muted-foreground'>Loading questions...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='space-y-4 p-6'>
      <CardTitle>Valuation Parameters</CardTitle>
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {valuationQuestions.map((question: ValuationQuestion) => (
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

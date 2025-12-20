'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { useQuestionsForModel } from '../hooks/use-questions-for-model';
import ValuationManagementModule from './valuation-management-module';
import { QuestionsForModelResponse } from '../api/valuation-service';
import { toast } from 'sonner';

// Form schema including valuation parameters
const valuationFormSchema = z.object({
  valuationParams: z
    .array(
      z.object({
        questionId: z.string(),
        optionValue: z.string(),
        adjustmentType: z.enum(['addition', 'deduction']),
        amount: z.number().min(0)
      })
    )
    .optional()
});

type ValuationFormValues = z.infer<typeof valuationFormSchema>;

interface ValuationManagementSystemProps {
  modelId: string;
  initialData: QuestionsForModelResponse;
}

export function ValuationManagementSystem({
  modelId,
  initialData
}: ValuationManagementSystemProps) {
  // Fetch questions with initial data to prevent duplicate fetches
  const { data, isLoading, error } = useQuestionsForModel(modelId, initialData);

  // Initialize form with React Hook Form
  const form = useForm<ValuationFormValues>({
    resolver: zodResolver(valuationFormSchema),
    defaultValues: {
      valuationParams: []
    }
  });

  // Watch for form changes
  const valuationParams = form.watch('valuationParams');

  // Handle form submission
  const onSubmit = async (values: ValuationFormValues) => {
    try {
      // Here you would call your API to save the valuation parameters
      // await valuationApi.saveParameters(modelId, values.valuationParams);

      toast.success('Valuation parameters saved successfully!');
    } catch (err) {
      toast.error('Failed to save valuation parameters');
    }
  };

  // Handle errors
  if (error) {
    return (
      <div className='border-destructive bg-destructive/10 rounded-lg border p-4'>
        <p className='text-destructive text-sm'>
          Error loading questions: {error.message}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
      {/* Valuation Management Module */}
      <ValuationManagementModule
        valuationQuestions={data?.questions || []}
        isLoading={isLoading}
        form={form}
      />

      {/* Debug Info (remove in production) */}
      {valuationParams && valuationParams.length > 0 && (
        <div className='bg-muted rounded-lg border p-4'>
          <h3 className='mb-2 text-sm font-medium'>
            Current Parameters ({valuationParams.length})
          </h3>
          <pre className='overflow-auto text-xs'>
            {JSON.stringify(valuationParams, null, 2)}
          </pre>
        </div>
      )}

      {/* Action Buttons */}
      <div className='flex items-center justify-between'>
        <Button
          type='button'
          variant='outline'
          onClick={() => form.reset()}
          disabled={isLoading}
        >
          Reset
        </Button>
        <Button
          type='submit'
          disabled={isLoading || form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? 'Saving...' : 'Save Parameters'}
        </Button>
      </div>
    </form>
  );
}

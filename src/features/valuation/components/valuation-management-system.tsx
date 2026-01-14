'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { useQuestionsForModel } from '../hooks/use-questions-for-model';
import ValuationManagementModule from './valuation-management-module';
import { QuestionsForModelResponse } from '../api/valuation-service';
import { toast } from 'sonner';
import { useMemo } from 'react';
import { useBulkAssignValuation } from '../hooks/use-bulk-assign-valuation';
import { Icons } from '@/components/icons';

// Form schema including valuation parameters
const valuationFormSchema = z.object({
  valuationParams: z
    .array(
      z.object({
        questionId: z.string(),
        optionId: z.string(),
        adjustmentType: z.enum(['add', 'deduct']),
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

  // Mutation for bulk assigning valuation
  const bulkAssign = useBulkAssignValuation();

  // Extract brandId from model data
  const brandId = data?.model?.brand_id || initialData?.model?.brand_id;

  // Transform API data to form values
  const initialValuationParams = useMemo(() => {
    if (!data?.questions) return [];

    const params: any[] = [];
    data.questions.forEach((question) => {
      question.options.forEach((option) => {
        // Only include options that have both type and value set
        if (option.type && option.value !== null) {
          params.push({
            questionId: question.id,
            optionId: option.id,
            adjustmentType: option.type,
            amount: option.value
          });
        }
      });
    });

    return params;
  }, [data]);

  // Initialize form with React Hook Form
  const form = useForm<ValuationFormValues>({
    resolver: zodResolver(valuationFormSchema),
    values: {
      valuationParams: initialValuationParams
    }
  });

  // Watch for form changes
  // const valuationParams = form.watch('valuationParams');

  // Handle form submission
  const onSubmit = async (values: ValuationFormValues) => {
    if (!brandId) {
      toast.error('Brand ID is required to save valuation parameters');
      return;
    }

    if (!values.valuationParams || values.valuationParams.length === 0) {
      toast.error('No valuation parameters to save');
      return;
    }

    // Filter only new or changed parameters
    const changedItems = values.valuationParams.filter((currentParam) => {
      const initialParam = initialValuationParams.find(
        (p) =>
          p.questionId === currentParam.questionId &&
          p.optionId === currentParam.optionId
      );

      // Include if it's a new parameter (not in initial data)
      if (!initialParam) return true;

      // Include if adjustmentType or amount changed
      return (
        initialParam.adjustmentType !== currentParam.adjustmentType ||
        initialParam.amount !== currentParam.amount
      );
    });

    if (changedItems.length === 0) {
      toast.info('No changes to save');
      return;
    }

    // Transform only changed values to API payload format
    const payload = {
      items: changedItems.map((param) => ({
        questionId: param.questionId,
        optionId: param.optionId,
        adjustmentType: param.adjustmentType,
        amount: param.amount
      }))
    };

    // Call the bulk assign mutation
    bulkAssign.mutate({
      modelId,
      brandId,
      payload
    });
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
    <form onSubmit={form.handleSubmit(onSubmit)} className='mb-10 space-y-6'>
      {/* Valuation Management Module */}
      <ValuationManagementModule
        valuationQuestions={data?.questions || []}
        isLoading={isLoading}
        form={form}
      />

      {/* Debug Info (remove in production)
      {valuationParams && valuationParams.length > 0 && (
        <div className='bg-muted rounded-lg border p-4'>
          <h3 className='mb-2 text-sm font-medium'>
            Current Parameters ({valuationParams.length})
          </h3>
          <pre className='overflow-auto text-xs'>
            {JSON.stringify(valuationParams, null, 2)}
          </pre>
        </div>
      )} */}

      {/* Action Buttons */}
      <div className='flex items-center gap-4'>
        <Button
          type='button'
          variant='outline'
          onClick={() => form.reset()}
          disabled={isLoading || bulkAssign.isPending}
        >
          Reset
        </Button>
        <Button
          type='submit'
          disabled={isLoading || bulkAssign.isPending || !brandId}
        >
          {bulkAssign.isPending && (
            <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
          )}
          {bulkAssign.isPending ? 'Saving...' : 'Save Parameters'}
        </Button>
      </div>
    </form>
  );
}

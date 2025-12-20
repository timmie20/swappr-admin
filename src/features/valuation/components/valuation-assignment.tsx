import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Question, ValuationParameter } from '@/types';
import { UseFormReturn } from 'react-hook-form';
import React from 'react';
import ValuationBlock from './valuation-block';

type TValuationAssignmentProps = {
  question: Question;
  form: UseFormReturn<any>;
};

export default function ValuationAssignment({
  question,
  form
}: TValuationAssignmentProps) {
  const valuationParams = form.watch('valuationParams') || [];

  const updateValuationParam = (
    optionValue: string,
    field: 'adjustmentType' | 'amount',
    value: string | number
  ) => {
    const existingIndex = valuationParams.findIndex(
      (param: ValuationParameter) =>
        param.questionId === question.id && param.optionValue === optionValue
    );

    if (existingIndex >= 0) {
      const updated = {
        ...valuationParams[existingIndex],
        [field]: value
      };
      form.setValue('valuationParams', [
        ...valuationParams.slice(0, existingIndex),
        updated,
        ...valuationParams.slice(existingIndex + 1)
      ]);
    } else {
      // Create new parameter
      const newParam: ValuationParameter = {
        questionId: question.id,
        optionValue,
        adjustmentType:
          field === 'adjustmentType'
            ? (value as 'addition' | 'deduction')
            : 'deduction',
        amount: field === 'amount' ? (value as number) : 0
      };
      form.setValue('valuationParams', [...valuationParams, newParam]);
    }
  };

  const getValuationParam = (optionValue: string) => {
    return valuationParams.find(
      (param: ValuationParameter) =>
        param.questionId === question.id && param.optionValue === optionValue
    );
  };

  if (!question.options || question.options.length === 0) {
    return null;
  }

  return (
    <Card className='h-fit max-w-sm px-3'>
      <CardHeader>
        <CardTitle className='text-left text-lg font-bold'>
          {question.slug}
        </CardTitle>
        <CardDescription>{question.label}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {question.options.map((opt) => {
            const param = getValuationParam(opt.value);
            return (
              <ValuationBlock
                key={opt.value}
                option={opt}
                param={param}
                questionId={question.id}
                onUpdate={updateValuationParam}
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

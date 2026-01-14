'use client';

import React from 'react';
import { Question } from '../types/question.types';
import QuestionForm from './question-form';
import QuestionOptionsTable from './question-options-table';
import useQuestion from '../hooks/use-question';
import { useBrands } from '@/features/brands';

export default function QuestionEditPage({ question }: { question: Question }) {
  const { data: brands } = useBrands();
  const { data: liveQuestion } = useQuestion(question.id, question);

  return (
    <div className='space-y-6'>
      <QuestionForm
        question={question}
        liveQuestion={liveQuestion}
        brands={brands?.brands || []}
      />

      <QuestionOptionsTable
        questionId={question.id}
        options={liveQuestion?.options || []}
      />
    </div>
  );
}

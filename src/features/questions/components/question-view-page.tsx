import { notFound } from 'next/navigation';
import React from 'react';
import { questionApiServer } from '../api/question.server';
import QuestionEditPage from './question-edit-page';

type TQuestionViewPageProps = {
  questionId: string;
};

export default async function QuestionViewPage({
  questionId
}: TQuestionViewPageProps) {
  const question = await questionApiServer.getQuestionId(questionId);
  // Edit existing question
  if (!question) {
    notFound();
  }
  return <QuestionEditPage question={question} />;
}

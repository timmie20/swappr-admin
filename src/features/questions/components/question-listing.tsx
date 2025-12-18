import { questionApiServer } from '../api/question.server';
import { QuestionTable } from './question-tables';
import { columns } from './question-tables/columns';

export default async function QuestionsListingPage() {
  const questions = (await questionApiServer.getAll()).questions;

  return (
    <QuestionTable
      data={questions}
      totalItems={questions.length}
      columns={columns}
    />
  );
}

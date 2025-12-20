/**
 * Preview Component for Valuation Questions
 *
 * Displays valuation questions for a specific phone model in a compact preview format.
 */

'use client';

import { ValuationQuestion, ValuationOption } from '../api/valuation-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Settings, Plus, Edit } from 'lucide-react';
import { formatNaira } from '@/lib/format';

interface ValuationQuestionsPreviewProps {
  modelId: string;
  modelQuestions: ValuationQuestion[];
}

export function ValuationQuestionsPreview({
  modelId,
  modelQuestions
}: ValuationQuestionsPreviewProps) {
  const router = useRouter();

  const handleManageValuation = () => {
    router.push(`/dashboard/model/${modelId}/valuation`);
  };

  const handleManageQuestionOptions = (questionId: string) => {
    router.push(`/dashboard/questions/${questionId}`);
  };

  if (!modelQuestions || modelQuestions.length === 0) {
    return (
      <Card>
        <CardContent className='p-6'>
          <div className='flex items-center justify-between'>
            <p className='text-muted-foreground'>
              No valuation questions found for this model.
            </p>
            <Button onClick={handleManageValuation} variant='outline'>
              <Settings className='mr-2 h-4 w-4' />
              Manage Valuation
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h2 className='text-2xl font-bold'>
          Valuation Questions ({modelQuestions.length})
        </h2>

        <Button onClick={handleManageValuation} variant='outline'>
          <Settings className='mr-2 h-4 w-4' />
          Manage Valuation
        </Button>
      </div>

      {modelQuestions.map((question: ValuationQuestion) => (
        <Card key={question.id}>
          <CardHeader>
            <CardTitle className='flex items-center justify-between'>
              <span>{question.text}</span>

              <Badge variant='outline'>
                {question.brand_id ? 'Brand Specific' : 'Universal'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!question.options || question.options.length === 0 ? (
              <div className='flex flex-col items-center justify-center py-6'>
                <p className='text-muted-foreground mb-4 text-sm'>
                  No options configured for this question
                </p>
                <Button
                  onClick={() => handleManageQuestionOptions(question.id)}
                  variant='outline'
                  size='sm'
                >
                  <Plus className='mr-2 h-4 w-4' />
                  Add Options
                </Button>
              </div>
            ) : (
              <>
                <div className='space-y-2'>
                  {question.options.map((option: ValuationOption) => (
                    <div
                      key={option.id}
                      className='flex items-center justify-between rounded-lg border p-3'
                    >
                      <span className='font-medium'>{option.text}</span>
                      <div className='flex items-center gap-2'>
                        {option.type && (
                          <Badge
                            variant={
                              option.type === 'add' ? 'default' : 'destructive'
                            }
                          >
                            {option.type.toUpperCase()}
                          </Badge>
                        )}
                        {option.value !== null && (
                          <span className='text-muted-foreground text-sm'>
                            {formatNaira(option.value)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className='mt-4 flex justify-end'>
                  <Button
                    onClick={() => handleManageQuestionOptions(question.id)}
                    variant='ghost'
                    size='sm'
                  >
                    <Edit className='mr-2 h-4 w-4' />
                    Manage Options
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

'use client';

import { Brand } from '@/features/brands';
import { Model } from '../types/models.types';
import { useModel } from '../hooks/use-models';
import ModelEditForm from './model-edit-form';
import ModelVariationsTable from './model-variations-table';
import { ValuationQuestionsPreview } from '@/features/valuation/components/valuation-questions-preview';
import { ValuationQuestion } from '@/features/valuation';

interface ModelEditPageProps {
  model: Model;
  brands: Brand[];
  modelQuestions: ValuationQuestion[];
}

export default function ModelEditPage({
  model,
  brands,
  modelQuestions
}: ModelEditPageProps) {
  const { data: liveModel } = useModel(model.id, model);

  return (
    <div className='space-y-6'>
      {/* Model Edit Form */}
      <ModelEditForm model={model} liveModel={liveModel} brands={brands} />

      {/* Variations Table */}
      <ModelVariationsTable
        modelId={model.id}
        variations={liveModel?.variations || []}
      />

      {/* Valuation Questions Preview */}
      <ValuationQuestionsPreview
        modelId={model.id}
        modelQuestions={modelQuestions}
      />
    </div>
  );
}

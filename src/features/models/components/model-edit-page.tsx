'use client';

import { Brand } from '@/features/brands';
import { Model } from '../types/models.types';
import { useModel } from '../hooks/use-models';
import ModelEditForm from './model-edit-form';
import ModelVariationsTable from './model-variations-table';
import { ValuationManagementModule } from '@/features/valuation';

interface ModelEditPageProps {
  model: Model;
  brands: Brand[];
}

export default function ModelEditPage({ model, brands }: ModelEditPageProps) {
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

      {/* Valuation Management Module */}
      {/* <ValuationManagementModule model={liveModel || model} form={form} /> */}
    </div>
  );
}

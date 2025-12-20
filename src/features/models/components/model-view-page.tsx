import { notFound } from 'next/navigation';
import React from 'react';
import ModelForm from './model-create-form';
import ModelEditPage from './model-edit-page';
import { modelsApiServer } from '../api/models.service.server';
import { brandApiServer } from '@/features/brands/api/brands.service.server';

type TModelViewPageProps = {
  modelId: string;
};

export default async function ModelViewPage({ modelId }: TModelViewPageProps) {
  const brands = (await brandApiServer.getAll()).brands;

  // Create new model
  if (modelId === 'new') {
    return (
      <ModelForm
        pageTitle='Create New Phone Model and variations'
        brands={brands}
      />
    );
  }

  const model = (await modelsApiServer.getModelbyId(modelId)).model;
  // Edit existing model
  if (!model) {
    notFound();
  }
  return <ModelEditPage model={model} brands={brands} />;
}

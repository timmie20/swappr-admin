import { notFound } from 'next/navigation';
import React from 'react';
import ModelForm from './model-form';
import ModelEditPage from './model-edit-page';
import { getAuthHeaders } from '@/lib/auth-headers.server';
import apiClient from '@/lib/api-client';
import { BrandsResponse } from '@/features/brands';
import { Model } from '../types/models.types';

type TModelViewPageProps = {
  modelId: string;
};

const getBrands = async () => {
  const auth = await getAuthHeaders();
  const { data } = await apiClient.get<BrandsResponse>('/brands', {
    headers: auth
  });
  return data;
};

const getModelbyId = async (id: string) => {
  const auth = await getAuthHeaders();
  const { data } = await apiClient.get<{ model: Model }>(`/models/${id}`, {
    headers: auth
  });
  return data;
};

export default async function ModelViewPage({ modelId }: TModelViewPageProps) {
  const brands = (await getBrands()).brands;
  const model = (await getModelbyId(modelId)).model;

  // Create new model
  if (modelId === 'new') {
    return (
      <ModelForm
        pageTitle='Create New Phone Model and variations'
        initialData={null}
        brands={brands}
      />
    );
  }

  // Edit existing model
  if (!model) {
    notFound();
  }
  return <ModelEditPage model={model} brands={brands} />;
}

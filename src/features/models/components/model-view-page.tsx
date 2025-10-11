import { notFound } from 'next/navigation';
import React from 'react';
import ModelForm from './model-form';
import { modelData } from '@/constants/data';

type TModelViewPageProps = {
  modelId: string;
};

export default function ModelViewPage({ modelId }: TModelViewPageProps) {
  let pageTitle = 'Create New Phone Model and Valuation parameters';

  if (modelId !== 'new') {
    //model fetching logic goes here
    notFound();
  }
  return <ModelForm pageTitle={pageTitle} initialData={modelData} />;
}

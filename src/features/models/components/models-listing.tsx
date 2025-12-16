import React from 'react';
import { modelsApiServer } from '../api/models.service.server';
import { Model } from '../types/models.types';
import { ModelTable } from './model-tables';
import { columns } from './model-tables/columns';

export default async function ModelsListingPage() {
  const data = await modelsApiServer.getAll();

  const models: Model[] = data.models;
  return <ModelTable data={models} totalItems={20} columns={columns} />;
}

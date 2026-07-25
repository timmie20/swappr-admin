import { categoriesApiServer } from '../api/categories.service.server';
import { CategoryTable } from './category-tables';
import { columns } from './category-tables/columns';

export default async function CategoryListingPage() {
  const categories = await categoriesApiServer.getAll();

  return <CategoryTable data={categories} columns={columns} />;
}

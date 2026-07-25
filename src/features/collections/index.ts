// Types
export type {
  Collection,
  CollectionFilters,
  CollectionFilterParams,
  CollectionsResponse,
  CreateCollectionDto,
  UpdateCollectionDto
} from './types/collection.types';
export { ProductPlatform, ProductCondition } from './types/collection.types';

// Hooks
export {
  useCollections,
  useCreateCollection,
  useUpdateCollection
} from './hooks';

// API Service (if needed for server components)
export { collectionsApi } from './api/collections.service';

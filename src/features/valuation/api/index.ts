// Client-side exports only (safe for client components)
export {
  valuationApi,
  type ValuationOption,
  type ValuationQuestion,
  type QuestionsForModelResponse
} from './valuation-service';

// Note: Server-side API should be imported directly from './valuation-service.server'
// to avoid bundling server-only code in client components

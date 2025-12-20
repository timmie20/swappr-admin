# Valuation Feature Module

## Overview

This module manages valuation parameters and option-value assignments for device models. It is a standalone feature that can be integrated into any page or workflow, not dependent on the model edit page.

## Structure

```
valuation/
├── api/                    # API services for valuation operations
├── components/             # UI components
│   ├── valuation-block.tsx                    # Individual option valuation input
│   ├── valuation-assignment.tsx               # Question-level valuation assignment
│   ├── valuation-management-module.tsx        # Main module component
│   └── index.ts
├── hooks/                  # React hooks for valuation operations
└── index.ts
```

## Components

### ValuationManagementModule

Main component that orchestrates the valuation UI. Can be imported into any page.

**Props:**

- `model: Model` - The model object containing valuation questions
- `form: UseFormReturn<any>` - React Hook Form instance managing valuation parameters

**Usage:**

```tsx
import { ValuationManagementModule } from '@/features/valuation';

<ValuationManagementModule model={model} form={form} />;
```

### ValuationAssignment

Displays valuation inputs for all options of a single question.

**Props:**

- `question: Question` - Question object with options
- `form: UseFormReturn<any>` - Form instance

### ValuationBlock

Individual input fields for setting adjustment type (addition/deduction) and amount.

**Props:**

- `option: Option` - The option being valued
- `param?: ValuationParameter` - Current valuation parameter if exists
- `questionId: string` - Parent question ID
- `onUpdate: Function` - Callback for value updates

## Data Structure

### ValuationParameter Type

```typescript
type ValuationParameter = {
  questionId: string;
  optionValue: string;
  adjustmentType: 'addition' | 'deduction';
  amount: number;
};
```

## Integration Example

```tsx
import { ValuationManagementModule } from '@/features/valuation';
import { useForm } from 'react-hook-form';

function MyPage({ model }) {
  const form = useForm({
    defaultValues: {
      valuationParams: []
    }
  });

  return (
    <div>
      <ValuationManagementModule model={model} form={form} />
    </div>
  );
}
```

## Future Enhancements

- API hooks for CRUD operations
- Persistence layer
- Validation rules
- Bulk import/export
- History tracking

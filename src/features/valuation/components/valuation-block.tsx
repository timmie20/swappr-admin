import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { ValuationParameter } from '@/types';
import { ValuationOption } from '../api';
import React from 'react';

type ValuationBlockProps = {
  option: ValuationOption;
  param?: ValuationParameter;
  questionId: string;
  onUpdate: (
    optionValue: string,
    field: 'adjustmentType' | 'amount',
    value: string | number
  ) => void;
};

export default function ValuationBlock({
  option,
  param,
  onUpdate
}: ValuationBlockProps) {
  return (
    <div className='space-y-2'>
      <Label className='text-sm font-medium'>{option.text}</Label>
      <div className='flex gap-2'>
        <Select
          value={param?.adjustmentType || ''}
          onValueChange={(value) =>
            onUpdate(option.id, 'adjustmentType', value)
          }
          required
        >
          <SelectTrigger className='flex-1/2'>
            <SelectValue placeholder='Type' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='deduction'>Deduction</SelectItem>
            <SelectItem value='addition'>Addition</SelectItem>
          </SelectContent>
        </Select>
        <Input
          placeholder='Amount'
          type='number'
          step='1000'
          value={param ? String(param.amount) : ''}
          className='flex-1/2'
          min={0}
          onChange={(e) =>
            onUpdate(option.id, 'amount', parseFloat(e.target.value) || 0)
          }
        />
      </div>
    </div>
  );
}

'use client';

import { Button } from '@/components/ui/button';
import { Category } from '../../types/category.types';
import { useState } from 'react';
import { CategoryModal } from '../category-modal';

interface CellActionProps {
  data: Category;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <CategoryModal category={data} open={open} onOpenChange={setOpen} />
      <Button variant='outline' size='sm' onClick={() => setOpen(true)}>
        Manage
      </Button>
    </>
  );
};

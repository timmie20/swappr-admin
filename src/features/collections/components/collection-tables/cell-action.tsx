'use client';

import { Button } from '@/components/ui/button';
import { Collection } from '../../types/collection.types';
import { useState } from 'react';
import { CollectionModal } from '../collection-modal';

interface CellActionProps {
  data: Collection;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      <CollectionModal
        collection={data}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <Button variant='outline' size='sm' onClick={() => setEditOpen(true)}>
        Edit
      </Button>
    </>
  );
};

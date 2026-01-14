'use client';

import { Button } from '@/components/ui/button';
import { IconPlus } from '@tabler/icons-react';
import { useState } from 'react';
import { AddQuestionModal } from './add-question-modal';

export function AddQuestionButton() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setModalOpen(true)}>
        <IconPlus className='mr-2 h-4 w-4' /> Add New
      </Button>

      <AddQuestionModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
}

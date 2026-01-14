'use client';

import { AlertModal } from '@/components/modal/alert-modal';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Question } from '../../types/question.types';
import {
  IconEye,
  IconEdit,
  IconDotsVertical,
  IconTrash
} from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useDeleteQuestion } from '../../hooks/use-delete-question';

interface CellActionProps {
  data: Question;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const router = useRouter();
  const deleteQuestion = useDeleteQuestion();

  const onConfirm = async () => {
    deleteQuestion.mutate(data.id, {
      onSuccess: () => {
        setDeleteOpen(false);
        router.refresh();
      }
    });
  };

  return (
    <>
      <AlertModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={onConfirm}
        loading={deleteQuestion.isPending}
      />
      {/* TODO: Add EditQuestionModal */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='h-8 w-8 p-0'>
            <span className='sr-only'>Open menu</span>
            <IconDotsVertical className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>

          <DropdownMenuItem
            onClick={() => router.push(`/dashboard/questions/${data.id}`)}
          >
            <IconEdit className='mr-2 h-4 w-4' /> Update
          </DropdownMenuItem>

          {/* <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <IconEdit className='mr-2 h-4 w-4' /> Update
          </DropdownMenuItem> */}

          <DropdownMenuItem onClick={() => setDeleteOpen(true)}>
            <IconTrash className='mr-2 h-4 w-4' /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

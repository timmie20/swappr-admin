'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { formatDate } from '@/lib/format';
import { IconPlus, IconEdit, IconTrash } from '@tabler/icons-react';
import { AlertModal } from '@/components/modal/alert-modal';
import { useDeleteOption } from '../hooks/use-delete-option';
import OptionFormModal from './option-form-modal';

type Option = {
  id: string;
  text: string;
  created_at?: string;
  updated_at?: string;
};

interface QuestionOptionsTableProps {
  questionId: string;
  options: Option[];
}

export default function QuestionOptionsTable({
  questionId,
  options
}: QuestionOptionsTableProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createMode, setCreateMode] = useState<'single' | 'multiple'>('single');
  const [editingOption, setEditingOption] = useState<Option | null>(null);
  const [deletingOption, setDeletingOption] = useState<Option | null>(null);

  const deleteOption = useDeleteOption();

  const handleDelete = () => {
    if (!deletingOption) return;

    deleteOption.mutate(
      {
        questionId,
        optionId: deletingOption.id
      },
      {
        onSuccess: () => {
          setDeletingOption(null);
        }
      }
    );
  };

  const handleOpenCreate = (mode: 'single' | 'multiple') => {
    setCreateMode(mode);
    setIsCreateOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle>Question Options</CardTitle>
              <CardDescription>
                Manage answer options for this question
              </CardDescription>
            </div>
            <div className='flex gap-2'>
              <Button
                onClick={() => handleOpenCreate('single')}
                size='sm'
                variant='outline'
              >
                <IconPlus className='mr-2 h-4 w-4' />
                Add Single
              </Button>
              <Button onClick={() => handleOpenCreate('multiple')} size='sm'>
                <IconPlus className='mr-2 h-4 w-4' />
                Add Multiple
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Option Text</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {options.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className='text-muted-foreground h-24 text-center'
                    >
                      No options found. Add your first option.
                    </TableCell>
                  </TableRow>
                ) : (
                  options.map((option) => (
                    <TableRow key={option.id}>
                      <TableCell className='font-medium'>
                        {option.text}
                      </TableCell>
                      <TableCell>
                        {option.created_at
                          ? formatDate(option.created_at, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {option.updated_at
                          ? formatDate(option.updated_at, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })
                          : '-'}
                      </TableCell>
                      <TableCell className='text-right'>
                        <div className='flex justify-end gap-2'>
                          <Button
                            variant='ghost'
                            size='icon'
                            onClick={() => setEditingOption(option)}
                          >
                            <IconEdit className='h-4 w-4' />
                          </Button>
                          <Button
                            variant='ghost'
                            size='icon'
                            onClick={() => setDeletingOption(option)}
                          >
                            <IconTrash className='text-destructive h-4 w-4' />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create Modal */}
      <OptionFormModal
        questionId={questionId}
        mode={createMode}
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />

      {/* Edit Modal */}
      {editingOption && (
        <OptionFormModal
          questionId={questionId}
          option={editingOption}
          mode='single'
          open={!!editingOption}
          onOpenChange={(open: boolean) => !open && setEditingOption(null)}
        />
      )}

      {/* Delete Confirmation */}
      <AlertModal
        isOpen={!!deletingOption}
        onClose={() => setDeletingOption(null)}
        onConfirm={handleDelete}
        loading={deleteOption.isPending}
      />
    </>
  );
}

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
import { formatDate, formatStorageCapacity, formatNaira } from '@/lib/format';
import { Variation } from '../types/models.types';
import { IconPlus, IconEdit, IconTrash } from '@tabler/icons-react';
import VariationFormModal from './variation-form-modal';
import { AlertModal } from '@/components/modal/alert-modal';
import { useDeleteVariation } from '../hooks/use-delete-variation';
import { HardDrive } from 'lucide-react';

interface ModelVariationsTableProps {
  modelId: string;
  variations: Variation[];
}

export default function ModelVariationsTable({
  modelId,
  variations
}: ModelVariationsTableProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingVariation, setEditingVariation] = useState<Variation | null>(
    null
  );
  const [deletingVariation, setDeletingVariation] = useState<Variation | null>(
    null
  );

  const deleteVariation = useDeleteVariation();

  const handleDelete = () => {
    if (!deletingVariation) return;

    deleteVariation.mutate(
      {
        modelId,
        variationId: deletingVariation.id
      },
      {
        onSuccess: () => {
          setDeletingVariation(null);
        }
      }
    );
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle>Storage Variations</CardTitle>
              <CardDescription>
                Manage storage options and pricing for this model
              </CardDescription>
            </div>
            <Button onClick={() => setIsCreateOpen(true)} size='sm'>
              <IconPlus className='mr-2 h-4 w-4' />
              Add Variation
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Storage Capacity</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {variations.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className='text-muted-foreground h-24 text-center'
                    >
                      No variations found. Add your first storage variation.
                    </TableCell>
                  </TableRow>
                ) : (
                  variations.map((variation) => (
                    <TableRow key={variation.id}>
                      <TableCell className='font-medium'>
                        <HardDrive className='mx-2 inline-flex h-3 w-3 items-center' />
                        {formatStorageCapacity(variation.storage_capacity)}
                      </TableCell>
                      <TableCell>{formatNaira(variation.price)}</TableCell>
                      <TableCell className='max-w-xs truncate'>
                        {variation.note || '-'}
                      </TableCell>
                      <TableCell>
                        {formatDate(variation.created_at, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </TableCell>
                      <TableCell>
                        {formatDate(variation.updated_at, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </TableCell>
                      <TableCell className='text-right'>
                        <div className='flex justify-end gap-2'>
                          <Button
                            variant='ghost'
                            size='icon'
                            onClick={() => setEditingVariation(variation)}
                          >
                            <IconEdit className='h-4 w-4' />
                          </Button>
                          <Button
                            variant='ghost'
                            size='icon'
                            onClick={() => setDeletingVariation(variation)}
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
      <VariationFormModal
        modelId={modelId}
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />

      {/* Edit Modal */}
      {editingVariation && (
        <VariationFormModal
          modelId={modelId}
          variation={editingVariation}
          open={!!editingVariation}
          onOpenChange={(open: boolean) => !open && setEditingVariation(null)}
        />
      )}

      {/* Delete Confirmation */}
      <AlertModal
        isOpen={!!deletingVariation}
        onClose={() => setDeletingVariation(null)}
        onConfirm={handleDelete}
        loading={deleteVariation.isPending}
      />
    </>
  );
}

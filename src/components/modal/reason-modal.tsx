'use client';

import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/ui/modal';
import { Textarea } from '@/components/ui/textarea';
import { useEffect, useState } from 'react';

interface ReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  loading: boolean;
  title: string;
  /** Restate the consequence of the action */
  description: string;
  label: string;
  placeholder?: string;
  minLength: number;
  maxLength: number;
  confirmLabel: string;
  destructive?: boolean;
  children?: React.ReactNode;
  className?: string;
}

/** Confirmation dialog for actions that require a written reason/note. */
export function ReasonModal({
  isOpen,
  onClose,
  onConfirm,
  loading,
  title,
  description,
  label,
  placeholder,
  minLength,
  maxLength,
  confirmLabel,
  destructive,
  children,
  className
}: ReasonModalProps) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!isOpen) setReason('');
  }, [isOpen]);

  const length = reason.trim().length;
  const valid = length >= minLength && length <= maxLength;

  return (
    <Modal
      title={title}
      description={description}
      isOpen={isOpen}
      onClose={loading ? () => {} : onClose}
      className={className}
    >
      <form
        className='space-y-4'
        onSubmit={(event) => {
          event.preventDefault();
          if (valid && !loading) onConfirm(reason.trim());
        }}
      >
        {children}
        <div className='space-y-2'>
          <Label htmlFor='reason-modal-input'>{label}</Label>
          <Textarea
            id='reason-modal-input'
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder={placeholder}
            maxLength={maxLength}
            rows={4}
            disabled={loading}
          />
          <p className='text-muted-foreground text-xs'>
            {length < minLength
              ? `At least ${minLength} characters (${length}/${minLength})`
              : `${length}/${maxLength}`}
          </p>
        </div>
        <div className='flex w-full items-center justify-end space-x-2'>
          <Button
            type='button'
            disabled={loading}
            variant='outline'
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type='submit'
            disabled={loading || !valid}
            variant={destructive ? 'destructive' : 'default'}
          >
            {loading && <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />}
            {confirmLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

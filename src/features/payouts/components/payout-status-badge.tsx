import { Badge } from '@/components/ui/badge';
import { PAYOUT_STATUS_LABEL, PayoutStatus } from '../types/payout.types';

const STATUS_BADGE_VARIANT: Record<
  PayoutStatus,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  [PayoutStatus.REQUESTED]: 'outline',
  [PayoutStatus.APPROVED]: 'secondary',
  [PayoutStatus.COMPLETED]: 'default',
  [PayoutStatus.REJECTED]: 'destructive',
  [PayoutStatus.PENDING]: 'outline',
  [PayoutStatus.PROCESSING]: 'secondary',
  [PayoutStatus.FAILED]: 'destructive'
};

export function PayoutStatusBadge({ status }: { status: PayoutStatus }) {
  return (
    <Badge variant={STATUS_BADGE_VARIANT[status] ?? 'outline'}>
      {PAYOUT_STATUS_LABEL[status] ?? status}
    </Badge>
  );
}

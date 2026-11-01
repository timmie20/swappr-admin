import { Badge } from '@/components/ui/badge';
import { OrderPaymentStatus, OrderStatus } from '../types/order.types';

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

const ORDER_STATUS_VARIANT: Record<OrderStatus, BadgeVariant> = {
  [OrderStatus.PENDING]: 'outline',
  [OrderStatus.CONFIRMED]: 'outline',
  [OrderStatus.PROCESSING]: 'secondary',
  [OrderStatus.SHIPPED]: 'secondary',
  [OrderStatus.DELIVERED]: 'default',
  [OrderStatus.CANCELLED]: 'destructive',
  [OrderStatus.REJECTED]: 'destructive'
};

const PAYMENT_STATUS_VARIANT: Record<OrderPaymentStatus, BadgeVariant> = {
  unpaid: 'outline',
  paid: 'default',
  refunded: 'secondary'
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge
      variant={ORDER_STATUS_VARIANT[status] ?? 'outline'}
      className='capitalize'
    >
      {status}
    </Badge>
  );
}

export function PaymentStatusBadge({ status }: { status: OrderPaymentStatus }) {
  return (
    <Badge
      variant={PAYMENT_STATUS_VARIANT[status] ?? 'outline'}
      className='capitalize'
    >
      {status}
    </Badge>
  );
}

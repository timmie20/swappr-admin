'use client';

import { CopyButton } from '@/components/copy-button';
import { DetailRow } from '@/components/detail-row';
import { AlertModal } from '@/components/modal/alert-modal';
import { ReasonModal } from '@/components/modal/reason-modal';
import { QueryErrorState } from '@/components/superadmin-required';
import PayoutDetailSkeleton from '@/components/skeletons/payout-detail-skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  useConfirmDeliveryForCustomer,
  useResendDeliveryLink
} from '@/features/delivery/hooks/use-delivery';
import { CONFIRM_DELIVERY_REASON } from '@/features/delivery/types/delivery.types';
import {
  formatCalendarDate,
  formatLagosDateTime,
  formatNaira,
  formatStorageCapacity
} from '@/lib/format';
import {
  IconArrowLeft,
  IconCircleCheck,
  IconMailForward
} from '@tabler/icons-react';
import Link from 'next/link';
import { useState } from 'react';
import { useOrder } from '../hooks/use-orders';
import { OrderDetail, OrderStatus } from '../types/order.types';
import { OrderStatusBadge, PaymentStatusBadge } from './order-status-badge';

function DeliveryActions({ order }: { order: OrderDetail }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [resendOpen, setResendOpen] = useState(false);
  const confirmDelivery = useConfirmDeliveryForCustomer();
  const resendLink = useResendDeliveryLink();

  return (
    <>
      <ReasonModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={(reason) =>
          confirmDelivery.mutate(
            { orderId: order.id, reason },
            { onSettled: () => setConfirmOpen(false) }
          )
        }
        loading={confirmDelivery.isPending}
        title={`Confirm delivery of ${order.order_number} for the customer?`}
        description='This marks the order delivered, revokes the customer’s link and emails both the customer and the vendor. It unlocks the vendor’s settlement and cannot be undone.'
        label='Reason (stored with your name)'
        placeholder='e.g. Customer confirmed receipt by phone on 24 Oct; cannot open the email link.'
        minLength={CONFIRM_DELIVERY_REASON.min}
        maxLength={CONFIRM_DELIVERY_REASON.max}
        confirmLabel='Confirm delivery'
        destructive
      />
      <AlertModal
        isOpen={resendOpen}
        onClose={() => setResendOpen(false)}
        onConfirm={() =>
          resendLink.mutate(order.id, {
            onSettled: () => setResendOpen(false)
          })
        }
        loading={resendLink.isPending}
        title='Resend the confirmation link?'
        description={`A new link is emailed to ${order.buyer?.email ?? 'the customer'} and the previous link stops working. Limited to 3 per order per 24 hours.`}
        confirmLabel='Resend link'
      />
      <div className='flex flex-wrap gap-2'>
        <Button
          variant='outline'
          onClick={() => setResendOpen(true)}
          disabled={resendLink.isPending || confirmDelivery.isPending}
        >
          <IconMailForward className='mr-2 h-4 w-4' /> Resend confirmation link
        </Button>
        <Button
          onClick={() => setConfirmOpen(true)}
          disabled={resendLink.isPending || confirmDelivery.isPending}
        >
          <IconCircleCheck className='mr-2 h-4 w-4' /> Confirm delivery for
          customer
        </Button>
      </div>
    </>
  );
}

function confirmedByLabel(order: OrderDetail): string | null {
  if (order.delivery_confirmed_by === 'customer') return 'Customer (via link)';
  if (order.delivery_confirmed_by === 'admin') return 'Superadmin';
  return null;
}

interface OrderDetailViewProps {
  orderNumber: string;
  canManageDelivery: boolean;
}

export default function OrderDetailView({
  orderNumber,
  canManageDelivery
}: OrderDetailViewProps) {
  const { data: order, isLoading, error } = useOrder(orderNumber);

  if (error) {
    return <QueryErrorState error={error} title='Could not load this order' />;
  }
  if (isLoading || !order) return <PayoutDetailSkeleton />;

  const awaitingConfirmation =
    order.status === OrderStatus.SHIPPED && !order.delivery_confirmed_by;
  const buyerName = [order.buyer?.first_name, order.buyer?.last_name]
    .filter(Boolean)
    .join(' ');
  const f = order.fulfillment;
  const address = order.delivery_address;

  return (
    <div className='w-full space-y-6'>
      <div className='flex flex-wrap items-center justify-between gap-4'>
        <div className='flex items-center gap-3'>
          <Button variant='ghost' size='icon' asChild>
            <Link href='/dashboard/orders'>
              <IconArrowLeft className='h-4 w-4' />
            </Link>
          </Button>
          <Heading
            title={order.order_number}
            description={`Placed ${formatLagosDateTime(order.created_at)}`}
          />
          <OrderStatusBadge status={order.status} />
          <PaymentStatusBadge status={order.payment_status} />
        </div>
        {canManageDelivery && awaitingConfirmation && (
          <DeliveryActions order={order} />
        )}
      </div>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Payment</CardTitle>
          <CardDescription>Amounts in naira</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            <DetailRow
              label='Total Amount'
              value={formatNaira(order.total_amount)}
            />
            <DetailRow
              label='Processing Fee'
              value={
                order.processing_fee === null
                  ? undefined
                  : formatNaira(order.processing_fee)
              }
            />
            <DetailRow
              label='Platform Fee'
              value={
                order.platform_fee === null
                  ? undefined
                  : formatNaira(order.platform_fee)
              }
            />
            <DetailRow
              label='Vendor Payout Amount'
              value={
                order.vendor_payout_amount === null
                  ? undefined
                  : formatNaira(order.vendor_payout_amount)
              }
            />
            <DetailRow
              label='Payout Status'
              value={
                order.payout_status ? (
                  <span className='capitalize'>{order.payout_status}</span>
                ) : undefined
              }
            />
            <DetailRow
              label='Payment Reference'
              mono
              value={
                order.payment_reference ? (
                  <span className='flex items-center gap-2'>
                    {order.payment_reference}
                    <CopyButton
                      value={order.payment_reference}
                      label='payment reference'
                    />
                  </span>
                ) : (
                  'Not paid yet'
                )
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Delivery Confirmation</CardTitle>
          <CardDescription>
            {awaitingConfirmation
              ? 'Shipped — waiting for the customer to confirm receipt'
              : 'Who confirmed that the customer received the order'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            <DetailRow
              label='Shipped'
              value={
                order.fulfillment_ready_at
                  ? formatLagosDateTime(order.fulfillment_ready_at)
                  : undefined
              }
            />
            <DetailRow
              label='Delivered'
              value={
                order.delivered_at
                  ? formatLagosDateTime(order.delivered_at)
                  : undefined
              }
            />
            <DetailRow label='Confirmed By' value={confirmedByLabel(order)} />
            {order.delivery_confirmed_by === 'admin' && (
              <div className='sm:col-span-2 lg:col-span-3'>
                <DetailRow
                  label='Admin Confirmation Reason'
                  value={order.delivery_confirmation_reason}
                />
              </div>
            )}
            {order.cancellation_reason && (
              <div className='sm:col-span-2 lg:col-span-3'>
                <DetailRow
                  label='Cancellation Reason'
                  value={order.cancellation_reason}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle>Customer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              <DetailRow label='Name' value={buyerName} />
              <DetailRow label='Email' value={order.buyer?.email} />
              <DetailRow label='Contact Phone' value={order.contact_phone} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Vendor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              <DetailRow
                label='Business Name'
                value={
                  order.vendor?.business_name || order.vendor?.trading_name
                }
              />
              <DetailRow label='Email' value={order.vendor?.contact_email} />
              <DetailRow label='Phone' value={order.vendor?.contact_number} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fulfillment</CardTitle>
          <CardDescription className='capitalize'>
            {f?.fulfillment_type ?? 'Not set'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            <DetailRow
              label='Tracking Number'
              value={f?.tracking_number ?? order.tracking_number}
              mono
            />
            {f?.fulfillment_type === 'pickup' ? (
              <>
                <DetailRow label='Pickup Location' value={f.pickup_location} />
                <DetailRow
                  label='Pickup Date'
                  value={
                    f.pickup_date
                      ? formatCalendarDate(f.pickup_date)
                      : undefined
                  }
                />
                <DetailRow
                  label='Pickup Window'
                  value={
                    f.pickup_time_from && f.pickup_time_to
                      ? `${f.pickup_time_from} – ${f.pickup_time_to}`
                      : undefined
                  }
                />
              </>
            ) : (
              <>
                <DetailRow
                  label='Estimated Arrival'
                  value={
                    f?.estimated_arrival
                      ? formatCalendarDate(f.estimated_arrival)
                      : undefined
                  }
                />
                <DetailRow label='Rider' value={f?.rider_name} />
                <DetailRow label='Rider Phone' value={f?.rider_phone} />
                <DetailRow
                  label='Delivery Fee'
                  value={
                    f?.delivery_fee != null
                      ? formatNaira(f.delivery_fee)
                      : undefined
                  }
                />
                <div className='sm:col-span-2'>
                  <DetailRow
                    label='Delivery Address'
                    value={
                      address
                        ? [
                            address.street,
                            address.city,
                            address.state,
                            address.postal_code
                          ]
                            .filter(Boolean)
                            .join(', ')
                        : undefined
                    }
                  />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Variant</TableHead>
                <TableHead className='text-right'>Unit Price</TableHead>
                <TableHead className='text-right'>Qty</TableHead>
                <TableHead className='text-right'>Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className='font-medium'>
                    {item.product_name}
                  </TableCell>
                  <TableCell className='text-muted-foreground'>
                    {[
                      item.color,
                      item.storage ? formatStorageCapacity(item.storage) : null
                    ]
                      .filter(Boolean)
                      .join(' · ') || '—'}
                  </TableCell>
                  <TableCell className='text-right'>
                    {formatNaira(item.unit_price)}
                  </TableCell>
                  <TableCell className='text-right'>{item.quantity}</TableCell>
                  <TableCell className='text-right'>
                    {formatNaira(item.subtotal)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {order.delivery_reviews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Delivery Reviews</CardTitle>
            <CardDescription>
              Reviews the vendor asked admins to look at
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            {order.delivery_reviews.map((review) => (
              <div key={review.id} className='rounded-md border p-3 text-sm'>
                <div className='flex flex-wrap items-center gap-2'>
                  <Badge
                    variant={review.status === 'open' ? 'secondary' : 'outline'}
                    className='capitalize'
                  >
                    {review.status}
                  </Badge>
                  <span className='text-muted-foreground'>
                    Requested {formatLagosDateTime(review.created_at)}
                    {review.resolved_at &&
                      ` · resolved ${formatLagosDateTime(review.resolved_at)}`}
                  </span>
                </div>
                {review.resolution_note && (
                  <p className='text-muted-foreground mt-2'>
                    {review.resolution_note}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

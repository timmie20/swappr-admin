'use client';

import { DetailRow } from '@/components/detail-row';
import { SectionError } from '@/components/section-error';
import PayoutDetailSkeleton from '@/components/skeletons/payout-detail-skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  OrderStatusBadge,
  PaymentStatusBadge
} from '@/features/orders/components/order-status-badge';
import { formatKobo, formatLagosDateTime } from '@/lib/format';
import { isAxiosError } from 'axios';
import { IconArrowLeft } from '@tabler/icons-react';
import Link from 'next/link';
import { useAdminCustomer } from '../hooks/use-customers';
import { customerName } from '../types/customer.types';

const n = (value: number) => value.toLocaleString('en-NG');

export default function CustomerDetailView({
  customerId
}: {
  customerId: string;
}) {
  const query = useAdminCustomer(customerId);

  if (isAxiosError(query.error) && query.error.response?.status === 404) {
    return (
      <Alert>
        <AlertTitle>Customer not found</AlertTitle>
        <AlertDescription>
          <p>The account may have been archived.</p>
          <Link href='/dashboard/customers' className='underline'>
            Back to customers
          </Link>
        </AlertDescription>
      </Alert>
    );
  }
  if (query.error) {
    return (
      <SectionError
        error={query.error}
        onRetry={() => void query.refetch()}
        retrying={query.isFetching}
        what='this customer'
      />
    );
  }
  if (!query.data) return <PayoutDetailSkeleton />;

  const {
    customer: c,
    contact,
    bank_account,
    orders,
    spending,
    swap_requests,
    recent_orders
  } = query.data;
  const name = customerName(c);

  return (
    <div className='w-full space-y-6'>
      <div className='flex flex-wrap items-center gap-4'>
        <Button variant='ghost' size='icon' asChild>
          <Link href='/dashboard/customers' aria-label='Back to customers'>
            <IconArrowLeft className='h-4 w-4' />
          </Link>
        </Button>
        <Avatar className='h-12 w-12'>
          {c.avatar_url && <AvatarImage src={c.avatar_url} alt='' />}
          <AvatarFallback>
            {`${c.first_name?.[0] ?? ''}${c.last_name?.[0] ?? ''}`.toUpperCase() ||
              '—'}
          </AvatarFallback>
        </Avatar>
        <div className='space-y-1.5'>
          <h2 className='text-2xl font-bold tracking-tight'>{name}</h2>
          <div className='flex flex-wrap items-center gap-1.5'>
            <span className='text-muted-foreground text-sm'>{c.email}</span>
            {!c.email_verified && <Badge variant='outline'>Unverified</Badge>}
            {!c.is_active && <Badge variant='destructive'>Inactive</Badge>}
            {c.can_swap && <Badge variant='secondary'>Can swap</Badge>}
          </div>
        </div>
      </div>

      <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              <DetailRow
                label='Sign-in method'
                value={c.auth_provider === 'google' ? 'Google' : 'Email'}
              />
              <DetailRow
                label='Email verified'
                value={c.email_verified ? 'Yes' : 'No'}
              />
              <DetailRow
                label='Status'
                value={c.is_active ? 'Active' : 'Inactive'}
              />
              <DetailRow label='Can swap' value={c.can_swap ? 'Yes' : 'No'} />
              <DetailRow
                label='Joined'
                value={formatLagosDateTime(c.created_at)}
              />
              <DetailRow
                label='Last sign-in'
                value={
                  c.last_sign_in_at
                    ? formatLagosDateTime(c.last_sign_in_at)
                    : 'Never'
                }
              />
            </div>
          </CardContent>
        </Card>

        <div className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>Contact</CardTitle>
              <CardDescription>From their latest order</CardDescription>
            </CardHeader>
            <CardContent>
              {contact ? (
                <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
                  <DetailRow
                    label='Phone'
                    value={
                      <a href={`tel:${contact.phone}`} className='underline'>
                        {contact.phone}
                      </a>
                    }
                  />
                  <DetailRow label='City' value={contact.city} />
                  <DetailRow label='State' value={contact.state} />
                </div>
              ) : (
                <p className='text-muted-foreground text-sm'>
                  No orders yet, so no phone on file
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bank account</CardTitle>
            </CardHeader>
            <CardContent>
              {bank_account ? (
                <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
                  <DetailRow label='Bank' value={bank_account.bank_name} />
                  <DetailRow
                    label='Account number'
                    mono
                    value={`•••• ${bank_account.account_number_last4}`}
                  />
                  <DetailRow
                    label='Account name'
                    value={bank_account.account_name}
                  />
                </div>
              ) : (
                <p className='text-muted-foreground text-sm'>
                  No bank account added
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
        <Card className='lg:col-span-2'>
          <CardHeader>
            <CardTitle>Orders</CardTitle>
            <CardDescription>
              {orders.last_order_at
                ? `Last paid order ${formatLagosDateTime(orders.last_order_at)}`
                : 'No paid orders yet'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-2 gap-4 sm:grid-cols-4'>
              <DetailRow label='Paid' value={n(orders.paid)} />
              <DetailRow label='In progress' value={n(orders.in_progress)} />
              <DetailRow
                label='Awaiting their confirmation'
                value={n(orders.awaiting_delivery_confirmation)}
              />
              <DetailRow label='Delivered' value={n(orders.delivered)} />
              <DetailRow
                label='Cancelled after payment'
                value={n(orders.cancelled_after_payment)}
              />
              <DetailRow
                label='Awaiting payment'
                value={n(orders.awaiting_payment)}
              />
              <DetailRow
                label='Abandoned checkouts'
                value={n(orders.abandoned_checkouts)}
              />
              <DetailRow label='Swap orders' value={n(orders.swap_orders)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Spending</CardTitle>
            <CardDescription>
              Every successful payment, incl. processing fees and swap top-ups
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-2 gap-4'>
              <DetailRow
                label='Total paid'
                value={
                  <span className='text-foreground font-medium'>
                    {formatKobo(spending.total_paid_kobo)}
                  </span>
                }
              />
              <DetailRow
                label='Average order'
                value={formatKobo(spending.average_order_value_kobo)}
              />
              <DetailRow
                label='Swap requests'
                value={`${n(swap_requests.total)} (${n(swap_requests.open)} open)`}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent orders</CardTitle>
          <CardDescription>Latest 5, paid or not</CardDescription>
        </CardHeader>
        <CardContent>
          {recent_orders.length === 0 ? (
            <p className='text-muted-foreground text-sm'>No orders yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className='text-right'>Total</TableHead>
                  <TableHead>Placed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent_orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <Link
                        href={`/dashboard/orders/${encodeURIComponent(order.order_number)}`}
                        className='font-mono text-xs hover:underline'
                      >
                        {order.order_number}
                      </Link>
                      <span className='text-muted-foreground ml-2 text-xs capitalize'>
                        {order.order_type}
                      </span>
                    </TableCell>
                    <TableCell>{order.vendor_name ?? '—'}</TableCell>
                    <TableCell>
                      <OrderStatusBadge status={order.status} />
                    </TableCell>
                    <TableCell>
                      <PaymentStatusBadge status={order.payment_status} />
                    </TableCell>
                    <TableCell className='text-right tabular-nums'>
                      {formatKobo(order.total_amount_kobo)}
                    </TableCell>
                    <TableCell className='whitespace-nowrap'>
                      {formatLagosDateTime(order.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

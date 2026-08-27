import { notFound } from 'next/navigation';
import { payoutsApiServer } from '../api/payouts.service.server';
import PayoutDetailView from './payout-detail-view';

type TPayoutDetailPageProps = {
  payoutId: string;
};

export default async function PayoutDetailPage({
  payoutId
}: TPayoutDetailPageProps) {
  const payout = await payoutsApiServer.getById(payoutId);

  if (!payout) {
    notFound();
  }

  return <PayoutDetailView payout={payout} />;
}

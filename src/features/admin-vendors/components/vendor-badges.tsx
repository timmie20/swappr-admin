import { Badge } from '@/components/ui/badge';
import {
  BADGE_LABEL,
  ONBOARDING_STEP_LABEL,
  OnboardingStep,
  TIER_HELP,
  TIER_LABEL,
  VendorBadge,
  VendorTier
} from '../types/vendor.types';

export const AMBER_BADGE =
  'border-amber-500/60 text-amber-700 dark:text-amber-400';

export function OnboardingStepBadge({ step }: { step: OnboardingStep }) {
  return (
    <Badge variant={step === 'approved' ? 'default' : 'outline'}>
      {ONBOARDING_STEP_LABEL[step] ?? step}
    </Badge>
  );
}

export function TierBadge({ tier }: { tier: VendorTier }) {
  return (
    <Badge
      variant={tier === 2 ? 'default' : tier === 1 ? 'secondary' : 'outline'}
      title={TIER_HELP[tier]}
    >
      {TIER_LABEL[tier] ?? `Tier ${tier}`}
    </Badge>
  );
}

/** The API's badges, plus a pending inspection request and suspension */
export function VendorStatusBadges({
  vendor
}: {
  vendor: {
    badges: VendorBadge[];
    is_inspection_verified: boolean;
    inspection_requested_at: string | null;
    suspended_at: string | null;
    pickup_enabled?: boolean;
  };
}) {
  return (
    <div className='flex flex-wrap gap-1'>
      {vendor.suspended_at && <Badge variant='destructive'>Suspended</Badge>}
      {vendor.badges.map((badge) => (
        <Badge key={badge} variant='secondary'>
          {BADGE_LABEL[badge] ?? badge}
        </Badge>
      ))}
      {!vendor.is_inspection_verified && vendor.inspection_requested_at && (
        <Badge variant='outline' className={AMBER_BADGE}>
          Inspection requested
        </Badge>
      )}
      {vendor.pickup_enabled && <Badge variant='outline'>Pickup</Badge>}
    </div>
  );
}

import { Badge } from '@/components/ui/badge';
import { ONBOARDING_STEP_LABEL, OnboardingStep } from '../types/vendor.types';

export const AMBER_BADGE =
  'border-amber-500/60 text-amber-700 dark:text-amber-400';

export function OnboardingStepBadge({ step }: { step: OnboardingStep }) {
  return (
    <Badge variant={step === 'approved' ? 'default' : 'outline'}>
      {ONBOARDING_STEP_LABEL[step] ?? step}
    </Badge>
  );
}

/** Verified + inspection state, as compact badges */
export function VendorStatusBadges({
  vendor
}: {
  vendor: {
    is_verified: boolean;
    is_inspection_verified: boolean;
    inspection_requested_at: string | null;
    pickup_enabled?: boolean;
  };
}) {
  return (
    <div className='flex flex-wrap gap-1'>
      {vendor.is_verified && <Badge variant='secondary'>Verified</Badge>}
      {vendor.is_inspection_verified ? (
        <Badge variant='secondary'>Inspected</Badge>
      ) : (
        vendor.inspection_requested_at && (
          <Badge variant='outline' className={AMBER_BADGE}>
            Inspection requested
          </Badge>
        )
      )}
      {vendor.pickup_enabled && <Badge variant='outline'>Pickup</Badge>}
    </div>
  );
}

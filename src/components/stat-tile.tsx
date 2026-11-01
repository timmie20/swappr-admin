import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { IconTrendingDown, IconTrendingUp } from '@tabler/icons-react';
import Link from 'next/link';

export type StatTone = 'default' | 'warning' | 'danger';

export interface StatTileProps {
  label: string;
  value: React.ReactNode;
  sublabel: React.ReactNode;
  /** warning = amber sublabel; danger = red value and sublabel */
  tone?: StatTone;
  href?: string;
  /** Up/down badge in the card's action slot */
  trend?: { direction: 'up' | 'down' | 'flat'; label: string };
}

const SUBLABEL_TONE: Record<StatTone, string> = {
  default: 'text-muted-foreground',
  warning: 'text-amber-600 dark:text-amber-400',
  danger: 'text-destructive'
};

// The template's stat card, unchanged in look. Linked tiles get a
// full-card overlay link so the Card stays the grid's direct child (the
// grid styles its children by data-slot).
export function StatTile({
  label,
  value,
  sublabel,
  tone = 'default',
  href,
  trend
}: StatTileProps) {
  const TrendIcon =
    trend?.direction === 'down' ? IconTrendingDown : IconTrendingUp;
  return (
    <Card
      className={cn(
        '@container/card',
        href && 'hover:border-primary/40 relative transition-colors'
      )}
    >
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle
          className={cn(
            'text-2xl font-semibold tabular-nums @[250px]/card:text-3xl',
            tone === 'danger' && 'text-destructive'
          )}
        >
          {value}
        </CardTitle>
        {trend && (
          <CardAction>
            <Badge variant='outline'>
              {trend.direction !== 'flat' && <TrendIcon />}
              {trend.label}
            </Badge>
          </CardAction>
        )}
      </CardHeader>
      <CardFooter className='flex-col items-start gap-1.5 text-sm'>
        <div className={SUBLABEL_TONE[tone]}>{sublabel}</div>
      </CardFooter>
      {href && (
        <Link
          href={href}
          className='absolute inset-0 rounded-xl'
          aria-label={label}
        />
      )}
    </Card>
  );
}

export function StatTileSkeleton() {
  return (
    <Card className='@container/card'>
      <CardHeader>
        <Skeleton className='h-4 w-28' />
        <Skeleton className='h-8 w-20' />
      </CardHeader>
      <CardFooter>
        <Skeleton className='h-4 w-36' />
      </CardFooter>
    </Card>
  );
}

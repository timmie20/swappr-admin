export function formatDate(
  date: Date | string | number | undefined,
  opts: Intl.DateTimeFormatOptions = {}
) {
  if (!date) return '';

  try {
    return new Intl.DateTimeFormat('en-US', {
      month: opts.month ?? 'long',
      day: opts.day ?? 'numeric',
      year: opts.year ?? 'numeric',
      ...opts
    }).format(new Date(date));
  } catch (_err) {
    return '';
  }
}

/**
 * Format storage capacity to human-readable format
 * @param capacity - Storage capacity in GB (number or string)
 * @returns Formatted string (e.g., "64GB", "1TB", "2TB")
 */
export function formatStorageCapacity(
  capacity: number | string | undefined
): string {
  if (!capacity) return '';

  const numericCapacity =
    typeof capacity === 'string' ? parseFloat(capacity) : capacity;

  if (isNaN(numericCapacity)) return '';

  // Convert to TB if >= 1000 GB
  if (numericCapacity >= 1000) {
    const tb = numericCapacity / 1024;
    // Format to 1 decimal place if not a whole number
    const formatted = tb % 1 === 0 ? tb.toFixed(0) : tb.toFixed(1);
    return `${formatted}TB`;
  }

  // Otherwise show in GB
  return `${numericCapacity}GB`;
}

export function formatNaira(amount: number | string | undefined): string {
  if (amount === undefined || amount === null) return '₦0.00';

  const numericAmount =
    typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numericAmount)) return '₦0.00';

  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numericAmount);
}

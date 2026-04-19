/**
 * Format a number as USD currency
 */
export function formatCurrency(
  value: number,
  options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }
): string {
  // Ensure valid values and maximumFractionDigits >= minimumFractionDigits
  const minDigits = Math.max(0, Math.min(20, options?.minimumFractionDigits ?? 2));
  const maxDigits = Math.max(
    minDigits,
    Math.min(20, options?.maximumFractionDigits ?? 2)
  );

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: minDigits,
    maximumFractionDigits: maxDigits,
  }).format(value);
}

/**
 * Format a number with specified decimal places
 */
export function formatNumber(value: number, decimals: number = 2): string {
  // Ensure valid range (0-20)
  const validDecimals = Math.max(0, Math.min(20, decimals));

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: validDecimals,
    maximumFractionDigits: validDecimals,
  }).format(value);
}

/**
 * Format a number as a percentage
 */
export function formatPercent(value: number, decimals: number = 2): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format a percentage value (already in 0-100 range)
 */
export function formatPercentValue(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format a date/time string
 */
export function formatDate(
  date: string | Date,
  options?: Intl.DateTimeFormatOptions
): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  };

  return new Intl.DateTimeFormat('en-US', {
    ...defaultOptions,
    ...options,
  }).format(new Date(date));
}

/**
 * Format date as "Apr 11" or "Apr 11, 2024"
 */
export function formatShortDate(date: string | Date, includeYear: boolean = false): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    ...(includeYear && { year: 'numeric' }),
  }).format(new Date(date));
}

/**
 * Format time as "2:30 PM"
 */
export function formatTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(date));
}

/**
 * Format an Ethereum address (truncated)
 */
export function formatAddress(address: string, startChars: number = 6, endChars: number = 4): string {
  if (!address || address.length < startChars + endChars) return address;
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Format a large number with K, M, B suffixes
 */
export function formatCompactNumber(value: number): string {
  const formatter = new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1,
  });
  return formatter.format(value);
}

/**
 * Format a countdown timer (e.g., "4m 32s", "1h 23m", "32s")
 */
export function formatCountdown(targetDate: Date | string): string {
  const now = new Date().getTime();
  const target = new Date(targetDate).getTime();
  const diff = target - now;

  if (diff <= 0) return 'Expired';

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

/**
 * Format time remaining in seconds to readable format
 */
export function formatTimeRemaining(seconds: number): string {
  if (seconds <= 0) return 'Expired';

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  if (mins > 60) {
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}h ${remainingMins}m`;
  }

  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }

  return `${secs}s`;
}

/**
 * Get color class for P&L (profit/loss)
 */
export function getPnLColor(value: number): string {
  if (value > 0) return 'text-positive';
  if (value < 0) return 'text-negative';
  return 'text-text-secondary';
}

/**
 * Format P&L with color and sign
 */
export function formatPnL(value: number): {
  formatted: string;
  color: string;
  sign: '+' | '-' | '';
} {
  const sign = value > 0 ? '+' : value < 0 ? '-' : '';
  const formatted = formatCurrency(Math.abs(value));
  const color = getPnLColor(value);

  return { formatted, color, sign };
}

/**
 * Format time ago (e.g., "2 hours ago", "5 minutes ago", "just now")
 */
export function formatTimeAgo(date: string | Date): string {
  const now = new Date().getTime();
  const then = new Date(date).getTime();
  const diff = now - then;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  if (days < 7) return `${days} ${days === 1 ? 'day' : 'days'} ago`;

  // For older dates, show formatted date
  return formatShortDate(date);
}

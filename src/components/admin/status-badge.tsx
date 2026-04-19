import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  status: 'active' | 'suspended' | 'pending';
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const variants = {
    active: 'success' as const,
    suspended: 'error' as const,
    pending: 'warning' as const,
  };

  const labels = {
    active: 'Active',
    suspended: 'Suspended',
    pending: 'Pending',
  };

  return (
    <Badge variant={variants[status]} size={size}>
      {labels[status]}
    </Badge>
  );
}

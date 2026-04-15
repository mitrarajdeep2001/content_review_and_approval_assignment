import type { ContentStatus } from '../types';
import { STATUS_LABELS, STATUS_COLORS, STATUS_DOT_COLORS } from '../utils/constants';
import { clsx } from 'clsx';

interface Props {
  status: ContentStatus;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: Props) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        STATUS_COLORS[status],
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
      )}
    >
      <span className={clsx('h-1.5 w-1.5 rounded-full flex-shrink-0', STATUS_DOT_COLORS[status])} />
      {STATUS_LABELS[status]}
    </span>
  );
}

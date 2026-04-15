import type { Role } from '../types';
import { ROLE_LABELS, ROLE_COLORS } from '../utils/constants';
import { clsx } from 'clsx';

interface Props {
  role: Role | 'SYSTEM';
}

export function RoleBadge({ role }: Props) {
  if (role === 'SYSTEM') {
    return (
      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
        System
      </span>
    );
  }
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        ROLE_COLORS[role]
      )}
    >
      {ROLE_LABELS[role]}
    </span>
  );
}

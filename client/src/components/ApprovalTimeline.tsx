import type { ApprovalHistoryEntry } from '../types';
import { RoleBadge } from './RoleBadge';
import { formatDate } from '../utils/helpers';
import { clsx } from 'clsx';
import {
  FilePlus,
  Send,
  CheckCircle2,
  XCircle,
  Edit2,
  Award,
} from 'lucide-react';

const ACTION_CONFIG: Record<string, { icon: any, color: string, bg: string, label: string }> = {
  DRAFT: { icon: FilePlus, color: 'text-gray-500', bg: 'bg-gray-100', label: 'Drafted' },
  IN_REVIEW: { icon: Send, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Status: In Review' },
  APPROVED: { icon: Award, color: 'text-emerald-600', bg: 'bg-emerald-100', label: 'Approved' },
  CHANGES_REQUESTED: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100', label: 'Changes Requested' },
  CREATED: { icon: FilePlus, color: 'text-gray-500', bg: 'bg-gray-100', label: 'Created' },
  SUBMITTED: { icon: Send, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Submitted for Review' },
  APPROVED_L1: { icon: CheckCircle2, color: 'text-sky-600', bg: 'bg-sky-100', label: 'Approved (Stage 1)' },
  APPROVED_L2: { icon: Award, color: 'text-emerald-600', bg: 'bg-emerald-100', label: 'Approved (Stage 2)' },
  REJECTED: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100', label: 'Changes Requested' },
  EDITED: { icon: Edit2, color: 'text-amber-600', bg: 'bg-amber-100', label: 'Edited' },
  DEFAULT: { icon: FilePlus, color: 'text-gray-500', bg: 'bg-gray-100', label: 'Update' }
};

interface Props {
  history: ApprovalHistoryEntry[];
}

export function ApprovalTimeline({ history }: Props) {
  return (
    <div className="space-y-0">
      {history.map((entry, idx) => {
        const config = ACTION_CONFIG[entry.action] || ACTION_CONFIG.DEFAULT;
        const Icon = config.icon;
        const isLast = idx === history.length - 1;

        return (
          <div key={entry.id} className="flex gap-3">
            {/* Icon + line */}
            <div className="flex flex-col items-center">
              <div
                className={clsx(
                  'flex h-8 w-8 items-center justify-center rounded-full flex-shrink-0',
                  config.bg
                )}
              >
                <Icon className={clsx('h-4 w-4', config.color)} />
              </div>
              {!isLast && <div className="w-px flex-1 bg-gray-200 my-1" />}
            </div>

            {/* Content */}
            <div className={clsx('pb-5 flex-1 min-w-0', isLast && 'pb-0')}>
              <div className="flex flex-wrap items-center gap-2 mb-0.5">
                <span className="text-sm font-medium text-gray-900">{config.label}</span>
                <RoleBadge role={entry.role} />
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                <span className="font-medium text-gray-600">{entry.actor}</span>
                <span>·</span>
                <span>{formatDate(entry.timestamp)}</span>
              </div>
              {entry.comment && (
                <p className="mt-1.5 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                  "{entry.comment}"
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

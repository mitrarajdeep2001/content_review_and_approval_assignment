import type { ContentStatus, Role } from '../types';

export const COOKIE_KEY = 'cf_user_session';

export const STATUS_LABELS: Record<ContentStatus, string> = {
  DRAFT: 'Draft',
  IN_REVIEW: 'In Review',
  CHANGES_REQUESTED: 'Changes Requested',
  APPROVED: 'Approved',
};

export const STATUS_COLORS: Record<ContentStatus, string> = {
  DRAFT: 'bg-slate-100 text-slate-600 border-slate-200',
  IN_REVIEW: 'bg-amber-50 text-amber-700 border-amber-200',
  CHANGES_REQUESTED: 'bg-red-50 text-red-700 border-red-200',
  APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export const STATUS_DOT_COLORS: Record<ContentStatus, string> = {
  DRAFT: 'bg-slate-400',
  IN_REVIEW: 'bg-amber-400',
  CHANGES_REQUESTED: 'bg-red-500',
  APPROVED: 'bg-emerald-500',
};

export const ROLE_LABELS: Record<Role, string> = {
  CREATOR: 'Creator',
  REVIEWER_L1: 'Reviewer L1',
  REVIEWER_L2: 'Reviewer L2',
};

export const ROLE_COLORS: Record<Role, string> = {
  CREATOR: 'bg-violet-100 text-violet-700',
  REVIEWER_L1: 'bg-sky-100 text-sky-700',
  REVIEWER_L2: 'bg-indigo-100 text-indigo-700',
};

export const STAGE_LABELS: Record<1 | 2, string> = {
  1: 'Stage 1 — L1 Review',
  2: 'Stage 2 — L2 Review',
};

import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  Eye,
  Clock,
  User,
  AlertCircle,
} from 'lucide-react';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';
import type { ContentItem, Role } from '../types';
import { ConfirmModal } from './ConfirmModal';
import { formatRelative } from '../utils/helpers';
import { useApp } from '../store/AppContext';

interface Props {
  item: ContentItem;
  currentRole: Role;
  isRecentlyReviewed?: boolean;
}

type ModalType = 'approve' | 'reject' | null;

export function ReviewQueueCard({ item, currentRole, isRecentlyReviewed }: Props) {
  const { approveContent, rejectContent } = useApp();
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [pendingAction, setPendingAction] = useState<'approve' | 'reject' | null>(null);

  const stage = item.currentReviewStage;
  const isStage1 = stage === 1;

  const handleApprove = async (comment?: string) => {
    setPendingAction('approve');
    try {
      await approveContent(item.id, comment);
      const msg =
        currentRole === 'REVIEWER_L1'
          ? '✅ Approved! Moving to Stage 2 review.'
          : '🎉 Content fully approved and published!';
      toast.success(msg);
    } catch (error) {
      // Error is handled in context/toast
    } finally {
      setPendingAction(null);
      setActiveModal(null);
    }
  };

  const handleReject = async (comment?: string) => {
    setPendingAction('reject');
    try {
      await rejectContent(item.id, comment);
      toast.error('Changes requested. Returned to creator.');
    } catch (error) {
      // Error is handled in context/toast
    } finally {
      setPendingAction(null);
      setActiveModal(null);
    }
  };

  return (
    <>
      <article
        className={clsx(
          'group relative flex flex-col bg-white rounded-2xl border overflow-hidden transition-all duration-200',
          isRecentlyReviewed
            ? 'border-gray-200 shadow-sm opacity-80'
            : 'border-gray-200 shadow-sm hover:shadow-lg hover:-translate-y-0.5'
        )}
      >
        {/* Thumbnail */}
        <div className="relative h-44 overflow-hidden bg-gray-100 flex-shrink-0">
          <img
            src={item.image}
            alt={item.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&auto=format&fit=crop&q=60';
            }}
          />

          {/* Stage badge */}
          {!isRecentlyReviewed && stage && (
            <div className="absolute top-2 left-2">
              <span
                className={clsx(
                  'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide shadow-sm',
                  isStage1
                    ? 'bg-blue-600 text-white'
                    : 'bg-violet-600 text-white'
                )}
              >
                Stage {stage} Review
              </span>
            </div>
          )}

          {/* Recently reviewed overlay */}
          {isRecentlyReviewed && (
            <div className="absolute inset-0 bg-black/10 flex items-end">
              <div className="w-full px-3 py-2">
                {(() => {
                  const lastReview = [...item.history]
                    .reverse()
                    .find((h) =>
                      ['APPROVED_L1', 'APPROVED_L2', 'APPROVED', 'REJECTED'].includes(h.action)
                    );
                  const wasApproved = lastReview?.action !== 'REJECTED';
                  return (
                    <span
                      className={clsx(
                        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide',
                        wasApproved
                          ? 'bg-emerald-600 text-white'
                          : 'bg-red-600 text-white'
                      )}
                    >
                      {wasApproved ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      {wasApproved ? 'Approved' : 'Changes Requested'}
                    </span>
                  );
                })()}
              </div>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-4 flex flex-col flex-1">
          <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 mb-1">
            {item.title}
          </h3>
          <p className="text-gray-400 text-xs leading-relaxed line-clamp-2 mb-3 flex-1">
            {item.description}
          </p>

          {/* Meta */}
          <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {item.createdBy}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatRelative(item.updatedAt)}
            </span>
          </div>

          {/* Actions */}
          {!isRecentlyReviewed ? (
            <div className="grid grid-cols-3 gap-2">
              {/* Approve */}
              <button
                id={`approve-${item.id}`}
                onClick={() => setActiveModal('approve')}
                disabled={!!pendingAction}
                className={clsx(
                  'flex items-center justify-center gap-1 rounded-xl py-2 text-xs font-semibold transition-all',
                  'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed'
                )}
                title="Approve (A)"
              >
                {pendingAction === 'approve' ? (
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
                Approve
              </button>

              {/* Reject */}
              <button
                id={`reject-${item.id}`}
                onClick={() => setActiveModal('reject')}
                disabled={!!pendingAction}
                className={clsx(
                  'flex items-center justify-center gap-1 rounded-xl py-2 text-xs font-semibold transition-all',
                  'bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed'
                )}
                title="Reject (R)"
              >
                {pendingAction === 'reject' ? (
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-red-300 border-t-red-600" />
                ) : (
                  <XCircle className="h-3.5 w-3.5" />
                )}
                Reject
              </button>

              {/* View */}
              <Link
                to={`/content/${item.id}`}
                id={`view-${item.id}`}
                className="flex items-center justify-center gap-1 rounded-xl py-2 text-xs font-semibold bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 active:scale-95 transition-all"
                title="View Details"
              >
                <Eye className="h-3.5 w-3.5" />
                View
              </Link>
            </div>
          ) : (
            <Link
              to={`/content/${item.id}`}
              className="flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 transition-all"
            >
              <Eye className="h-3.5 w-3.5" />
              View Details
            </Link>
          )}
        </div>

        {/* Loading overlay */}
        {!!pendingAction && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center rounded-2xl">
            <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600/30 border-t-blue-600" />
              Processing…
            </div>
          </div>
        )}
      </article>

      {/* Approve Modal */}
      <ConfirmModal
        isOpen={activeModal === 'approve'}
        title={
          currentRole === 'REVIEWER_L1'
            ? 'Approve & Move to Stage 2'
            : 'Approve & Publish'
        }
        description={
          currentRole === 'REVIEWER_L1'
            ? 'This will pass the content to the L2 reviewer for final approval.'
            : 'This will mark the content as fully approved and published.'
        }
        confirmLabel={currentRole === 'REVIEWER_L1' ? 'Approve' : 'Publish'}
        variant="success"
        commentPlaceholder="Add a review comment (optional)..."
        isLoading={!!pendingAction}
        onConfirm={handleApprove}
        onCancel={() => setActiveModal(null)}
      />

      {/* Reject Modal */}
      <ConfirmModal
        isOpen={activeModal === 'reject'}
        title="Request Changes"
        description="This will return the content to the creator. Please explain what needs to be revised."
        confirmLabel="Request Changes"
        variant="danger"
        requireComment={true}
        commentPlaceholder="Describe the changes needed (required)..."
        isLoading={!!pendingAction}
        onConfirm={handleReject}
        onCancel={() => setActiveModal(null)}
      />
    </>
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  Eye,
  Clock,
  User,
  Layers,
} from 'lucide-react';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';
import type { ReviewQueueItem } from '../hooks/useReviewQueue';
import type { Role } from '../types';
import { ConfirmModal } from './ConfirmModal';
import { formatRelative, getImageUrl } from '../utils/helpers';
import { useApp } from '../store/AppContext';

interface Props {
  item: ReviewQueueItem;
  currentRole: Role;
  isRecentlyReviewed?: boolean;
}

type ModalType = 'approve' | 'reject' | null;

export function ReviewQueueCard({ item, currentRole, isRecentlyReviewed }: Props) {
  const { 
    approveContent, 
    rejectContent, 
    approveSubContent, 
    rejectSubContent 
  } = useApp();
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [pendingAction, setPendingAction] = useState<'approve' | 'reject' | null>(null);

  // Check if it's a sub-content
  const isSubContent = 'parentId' in item;
  const stage = item.currentReviewStage;
  const isStage1 = stage === 1;

  const handleApprove = async (comment?: string) => {
    setPendingAction('approve');
    try {
      if (isSubContent) {
        await approveSubContent(item.id, comment);
      } else {
        await approveContent(item.id, comment);
      }
      
      const msg =
        currentRole === 'REVIEWER_L1'
          ? '✅ Approved! Moving to Stage 2 review.'
          : '🎉 Item fully approved and published!';
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
      if (isSubContent) {
        await rejectSubContent(item.id, comment);
      } else {
        await rejectContent(item.id, comment);
      }
      toast.success('Changes requested. Returned to creator.');
    } catch (error) {
      // Error is handled in context/toast
    } finally {
      setPendingAction(null);
      setActiveModal(null);
    }
  };

  // Determine correct Link URL
  const detailUrl = isSubContent ? `/sub-content/${item.id}` : `/content/${item.id}`;
  const creator = isSubContent ? (item as any).creatorName || 'Unknown' : item.createdBy;

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
            src={getImageUrl(item.image)}
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

          {/* Sub-content indicator */}
          {isSubContent && (
            <div className="absolute top-2 right-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-black/40 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold text-white tracking-wide uppercase">
                <Layers className="h-3 w-3" />
                Sub-unit
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
          <div className="mb-2">
            {isSubContent && (
              <span className="block text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1 truncate">
                Part of: {(item as any).parentTitle}
              </span>
            )}
            <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">
              {item.title}
            </h3>
          </div>
          <p className="text-gray-400 text-xs leading-relaxed line-clamp-2 mb-3 flex-1">
            {item.description}
          </p>

          {/* Meta */}
          <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
            <span className="flex items-center gap-1 truncate max-w-[120px]">
              <User className="h-3 w-3 flex-shrink-0" />
              {creator}
            </span>
            <span className="flex items-center gap-1 flex-shrink-0">
              <Clock className="h-3 w-3" />
              {formatRelative(item.updatedAt)}
            </span>
          </div>

          {/* Actions */}
          {!isRecentlyReviewed ? (
            <div className="grid grid-cols-3 gap-2">
              {/* Approve */}
              <button
                onClick={() => setActiveModal('approve')}
                disabled={!!pendingAction}
                className={clsx(
                  'flex items-center justify-center gap-1 rounded-xl py-2 text-xs font-semibold transition-all',
                  'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed'
                )}
                title="Approve"
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
                onClick={() => setActiveModal('reject')}
                disabled={!!pendingAction}
                className={clsx(
                  'flex items-center justify-center gap-1 rounded-xl py-2 text-xs font-semibold transition-all',
                  'bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed'
                )}
                title="Reject"
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
                to={detailUrl}
                className="flex items-center justify-center gap-1 rounded-xl py-2 text-xs font-semibold bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 active:scale-95 transition-all"
                title="View Details"
              >
                <Eye className="h-3.5 w-3.5" />
                View
              </Link>
            </div>
          ) : (
            <Link
              to={detailUrl}
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
            ? 'This will pass the content unit to the L2 reviewer for final approval.'
            : 'This will mark the content unit as fully approved and published.'
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
        description="This will return the content unit to the creator. Please explain what needs to be revised."
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

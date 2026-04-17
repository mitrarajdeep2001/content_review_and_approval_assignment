import { useState } from 'react';
import { Send, CheckCircle2, XCircle, Edit2, Trash2, Clock, Lock, Maximize2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { SubContent, AuthUser } from '../types';
import { StatusBadge } from './StatusBadge';
import { useApp } from '../store/AppContext';
import { ConfirmModal } from './ConfirmModal';
import { getImageUrl } from '../utils/helpers';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

interface Props {
  item: SubContent;
  currentUser: AuthUser;
  onEdit: (item: SubContent) => void;
}

type ModalType = 'approve' | 'reject' | 'delete' | 'submit' | 'edit' | null;

export function SubContentCard({ item, currentUser, onEdit }: Props) {
  const { deleteSubContent, submitSubContent, approveSubContent, rejectSubContent } = useApp();
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [isPending, setIsPending] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const canSubmit = currentUser.role === 'CREATOR' && (item.status === 'DRAFT' || item.status === 'CHANGES_REQUESTED');
  const canEdit = canSubmit;
  const canDelete = currentUser.role === 'CREATOR' && item.status === 'DRAFT';
  const canApprove = item.status === 'IN_REVIEW' && (
    (item.currentReviewStage === 1 && currentUser.role === 'REVIEWER_L1') ||
    (item.currentReviewStage === 2 && currentUser.role === 'REVIEWER_L2')
  );
  const canReject = canApprove;

  const handleAction = async (actionFn: () => Promise<void>, successMsg: string) => {
    setIsPending(true);
    try {
      await actionFn();
      toast.success(successMsg);
      setActiveModal(null);
    } catch (err) {
      // Error handled in context
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow group">
      <div className="flex gap-4">
        {item.image && (
          <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-gray-100 border border-gray-100">
            <img 
              src={getImageUrl(item.image)} 
              alt={item.title} 
              className="w-full h-full object-cover"
              onError={(e) => (e.currentTarget.style.display = 'none')}
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 text-sm truncate">{item.title}</h4>
              <p className="text-xs text-gray-500 mt-1 line-clamp-1">{item.description}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              {isPending ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border font-medium px-2 py-0.5 text-[10px] bg-blue-50 border-blue-100 text-blue-600 animate-pulse">
                  <div className="h-1 w-1 rounded-full bg-blue-500 animate-ping" />
                  Updating...
                </span>
              ) : (
                <>
                  <StatusBadge status={item.status} size="sm" />
                  {item.status === 'IN_REVIEW' && (
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 uppercase">
                      Stage {item.currentReviewStage}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="mt-2 text-xs text-gray-500">
            <div 
              onClick={() => setIsExpanded(!isExpanded)}
              className={clsx(
                "relative transition-all duration-300 cursor-pointer hover:text-gray-700",
                !isExpanded ? "line-clamp-2" : "bg-gray-50 rounded-lg p-3 border border-gray-100 mb-2 prose prose-xs max-w-none text-gray-600"
              )}
            >
              {item.body.split('\n').map((line, i) => <p key={i} className={clsx(!isExpanded && "inline mr-1")}>{line}</p>)}
              {!isExpanded && item.body.length > 100 && (
                <span className="text-blue-600 font-bold ml-1 text-[10px] uppercase tracking-wider">Expand</span>
              )}
            </div>
            
            {isExpanded && (
              <button 
                onClick={() => setIsExpanded(false)}
                className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 transition-colors mt-1"
              >
                Show Less
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
        <div className="flex items-center gap-2">
           {item.isLocked && <Lock className="h-3 w-3 text-gray-400" />}
           <div className="flex items-center gap-1 text-[10px] text-gray-400">
             <Clock className="h-3 w-3" />
             <span>{new Date(item.updatedAt).toLocaleDateString()}</span>
           </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Link
            to={`/sub-content/${item.id}`}
            className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="Focus View (Expand)"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </Link>
          {canSubmit && (
            <button
              onClick={() => setActiveModal('submit')}
              disabled={isPending}
              className={clsx(
                "p-1.5 rounded-lg transition-colors",
                isPending ? "text-gray-300 cursor-not-allowed" : "text-blue-600 hover:bg-blue-50"
              )}
              title="Submit for Review"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          )}
          {canEdit && (
            <button
              onClick={() => onEdit(item)}
              disabled={isPending}
              className={clsx(
                "p-1.5 rounded-lg transition-colors",
                isPending ? "text-gray-300 cursor-not-allowed" : "text-amber-600 hover:bg-amber-50"
              )}
              title="Edit"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => setActiveModal('delete')}
              disabled={isPending}
              className={clsx(
                "p-1.5 rounded-lg transition-colors",
                isPending ? "text-gray-300 cursor-not-allowed" : "text-red-600 hover:bg-red-50"
              )}
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
          {canApprove && (
            <button
              onClick={() => setActiveModal('approve')}
              disabled={isPending}
              className={clsx(
                "flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-colors text-[10px] font-bold",
                isPending ? "bg-gray-50 text-gray-400 cursor-not-allowed" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              )}
            >
              <CheckCircle2 className="h-3 w-3" />
              Approve
            </button>
          )}
          {canReject && (
            <button
              onClick={() => setActiveModal('reject')}
              disabled={isPending}
              className={clsx(
                "p-1.5 rounded-lg transition-colors",
                isPending ? "text-gray-300 cursor-not-allowed" : "text-red-600 hover:bg-red-50"
              )}
              title="Request Changes"
            >
              <XCircle className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={activeModal === 'submit'}
        title="Submit Sub-content"
        description="Ready to send this item for review?"
        confirmLabel="Submit"
        variant="success"
        showComment={false}
        isLoading={isPending}
        onConfirm={() => handleAction(() => submitSubContent(item.id), 'Sub-content submitted!')}
        onCancel={() => setActiveModal(null)}
      />

      <ConfirmModal
        isOpen={activeModal === 'delete'}
        title="Delete Item"
        description="Are you sure? This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        showComment={false}
        isLoading={isPending}
        onConfirm={() => handleAction(() => deleteSubContent(item.id), 'Deleted successfully')}
        onCancel={() => setActiveModal(null)}
      />

      <ConfirmModal
        isOpen={activeModal === 'approve'}
        title="Approve Sub-content"
        description={item.currentReviewStage === 1 ? 'Approve and move to Stage 2?' : 'Final approval for this item?'}
        confirmLabel="Approve"
        variant="success"
        showComment={true}
        isLoading={isPending}
        onConfirm={(comment) => handleAction(() => approveSubContent(item.id, comment), 'Approved!')}
        onCancel={() => setActiveModal(null)}
      />

      <ConfirmModal
        isOpen={activeModal === 'reject'}
        title="Reject & Request Changes"
        description="Please provide feedback for the creator."
        confirmLabel="Reject"
        variant="danger"
        requireComment={true}
        isLoading={isPending}
        onConfirm={(comment) => handleAction(() => rejectSubContent(item.id, comment), 'Changes requested')}
        onCancel={() => setActiveModal(null)}
      />
    </div>
  );
}

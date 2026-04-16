import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Send,
  CheckCircle2,
  XCircle,
  Edit2,
  Lock,
  Globe,
  Calendar,
  User,
  BookOpen,
  Trash2,
} from 'lucide-react';
import { useApp } from '../store/AppContext';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { StatusBadge } from '../components/StatusBadge';
import { WorkflowProgress } from '../components/WorkflowProgress';
import { ApprovalTimeline } from '../components/ApprovalTimeline';
import { ConfirmModal } from '../components/ConfirmModal';
import { formatDate } from '../utils/helpers';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

type ModalType = 'approve' | 'reject' | 'submit' | 'delete' | null;

export function ContentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const currentUser = useRequireAuth();
  const { contentList, submitContent, approveContent, rejectContent, deleteContent } = useApp();
  const navigate = useNavigate();
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [isLoading, setIsLoading] = useState(false);

  const item = contentList.find((c) => c.id === id);

  if (!currentUser) return null;

  if (!item) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-5xl mb-4">🔍</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Content not found</h2>
          <p className="text-gray-500 text-sm mb-5">
            The content you're looking for doesn't exist or may have been removed.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const canSubmit = currentUser.role === 'CREATOR' && (item.status === 'DRAFT' || item.status === 'CHANGES_REQUESTED');
  const canEdit = currentUser.role === 'CREATOR' && (item.status === 'DRAFT' || item.status === 'CHANGES_REQUESTED');
  const canDelete = currentUser.role === 'CREATOR' && (item.status === 'DRAFT' || item.status === 'CHANGES_REQUESTED');
  const canApprove =
    item.status === 'IN_REVIEW' &&
    ((item.currentReviewStage === 1 && currentUser.role === 'REVIEWER_L1') ||
      (item.currentReviewStage === 2 && currentUser.role === 'REVIEWER_L2'));
  const canReject = canApprove;

  const simulateLoading = async (fn: () => void | Promise<void>) => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    await fn();
    setIsLoading(false);
  };

  const handleSubmit = async () => {
    await simulateLoading(() => {
      submitContent(item.id);
      toast.success('Content submitted for review!');
    });
    setActiveModal(null);
  };

  const handleApprove = async (comment?: string) => {
    await simulateLoading(() => {
      approveContent(item.id, comment);
      toast.success('🎉 Content approved and published!');
    });
    setActiveModal(null);
    navigate('/');
  };

  const handleReject = async (comment?: string) => {
    await simulateLoading(() => {
      rejectContent(item.id, comment);
      toast.error('Changes requested. Content returned to creator.');
    });
    setActiveModal(null);
  };
  
  const handleDelete = async () => {
    await simulateLoading(async () => {
      await deleteContent(item.id);
      navigate('/');
    });
    setActiveModal(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Back button */}
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-6 group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Dashboard
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">

            {/* Hero Image */}
            <div className="relative h-64 rounded-2xl overflow-hidden shadow-md bg-gray-200">
              <img
                src={item.image}
                alt={item.title}
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&auto=format&fit=crop&q=60';
                }}
              />
              {item.isLocked && (
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <div className="bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Lock className="h-4 w-4" />
                    {item.status === 'APPROVED' ? 'Published' : 'Locked for Review'}
                  </div>
                </div>
              )}
            </div>

            {/* Content Header */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <h1 className="text-xl font-bold text-gray-900 leading-tight flex-1">
                  {item.title}
                </h1>
                <div className="flex items-center gap-2">
                  <StatusBadge status={item.status} />
                  {item.status === 'IN_REVIEW' && item.currentReviewStage && (
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-200 uppercase tracking-wide">
                      Stage {item.currentReviewStage} Review
                    </span>
                  )}
                </div>
              </div>

              <p className="text-gray-500 text-sm leading-relaxed mb-5 border-l-4 border-gray-100 pl-4 italic">
                {item.description}
              </p>

              {/* Meta info */}
              <div className="flex flex-wrap gap-4 text-xs text-gray-400 mb-5">
                <div className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  <span>{item.createdBy}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Created {formatDate(item.createdAt)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>Updated {formatDate(item.updatedAt)}</span>
                </div>
                {item.status === 'APPROVED' && (
                  <div className="flex items-center gap-1.5 text-emerald-600">
                    <Globe className="h-3.5 w-3.5" />
                    <span className="font-medium">Published</span>
                  </div>
                )}
              </div>

              {/* Body content */}
              <div className="prose prose-sm max-w-none">
                {item.body.split('\n\n').map((paragraph, idx) => {
                  if (paragraph.startsWith('## ')) {
                    return (
                      <h2 key={idx} className="text-base font-bold text-gray-800 mt-5 mb-2">
                        {paragraph.replace('## ', '')}
                      </h2>
                    );
                  }
                  if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                    return (
                      <h3 key={idx} className="text-sm font-bold text-gray-800 mt-3 mb-1">
                        {paragraph.replace(/\*\*/g, '')}
                      </h3>
                    );
                  }
                  // Handle inline bold
                  const parts = paragraph.split(/(\*\*[^*]+\*\*)/g);
                  return (
                    <p key={idx} className="text-sm text-gray-600 leading-relaxed mb-3">
                      {parts.map((part, i) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                          return <strong key={i} className="font-semibold text-gray-800">{part.replace(/\*\*/g, '')}</strong>;
                        }
                        return <span key={i}>{part}</span>;
                      })}
                    </p>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Workflow Progress */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-800 mb-4">Workflow Progress</h3>
              <WorkflowProgress item={item} />
            </div>

            {/* Actions Panel */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-800 mb-4">Actions</h3>

              {item.status === 'APPROVED' ? (
                <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium py-2">
                  <CheckCircle2 className="h-4 w-4" />
                  This content is approved & published.
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Submit */}
                  <button
                    onClick={() => setActiveModal('submit')}
                    disabled={!canSubmit || isLoading}
                    className={clsx(
                      'w-full flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all',
                      canSubmit
                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    )}
                  >
                    <Send className="h-4 w-4" />
                    Submit for Review
                  </button>

                  {/* Edit */}
                  {canEdit && (
                    <Link
                      to={`/edit/${item.id}`}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5 text-sm font-medium text-amber-700 hover:bg-amber-100 transition-colors"
                    >
                      <Edit2 className="h-4 w-4" />
                      Edit Content
                    </Link>
                  )}

                  {/* Delete */}
                  {canDelete && (
                    <button
                      onClick={() => setActiveModal('delete')}
                      disabled={isLoading}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-50 border border-red-100 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Content
                    </button>
                  )}

                  {/* Approve */}
                  <button
                    onClick={() => setActiveModal('approve')}
                    disabled={!canApprove || isLoading}
                    className={clsx(
                      'w-full flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all',
                      canApprove
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    )}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Approve
                  </button>

                  {/* Reject */}
                  <button
                    onClick={() => setActiveModal('reject')}
                    disabled={!canReject || isLoading}
                    className={clsx(
                      'w-full flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all',
                      canReject
                        ? 'bg-red-50 border border-red-200 text-red-700 hover:bg-red-100'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    )}
                  >
                    <XCircle className="h-4 w-4" />
                    Request Changes
                  </button>

                  {/* Helper text */}
                  {item.status === 'IN_REVIEW' && !canApprove && (
                    <p className="text-xs text-amber-600 bg-amber-50 rounded-lg p-2.5 text-center mt-3 border border-amber-100 italic">
                      {item.currentReviewStage === 1
                        ? "Currently awaiting L1 Reviewer approval."
                        : "Currently awaiting L2 Reviewer approval."}
                    </p>
                  )}
                  {!canSubmit && !canEdit && !canApprove && !canReject && item.status !== 'IN_REVIEW' && (
                    <p className="text-xs text-gray-400 text-center pt-1">
                      No actions available for your role at this stage.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Approval History */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-800 mb-4">Approval History</h3>
              <ApprovalTimeline history={item.history} />
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ConfirmModal
        isOpen={activeModal === 'submit'}
        title="Submit for Review"
        description="Are you sure you want to submit this content for review? It will be locked for editing until a reviewer responds."
        confirmLabel="Submit"
        variant="success"
        isLoading={isLoading}
        onConfirm={handleSubmit}
        onCancel={() => setActiveModal(null)}
      />
      <ConfirmModal
        isOpen={activeModal === 'approve'}
        title="Approve Content"
        description="This will mark the content as fully approved and published. This action cannot be undone."
        confirmLabel="Publish"
        variant="success"
        commentPlaceholder="Add a review comment (optional)..."
        isLoading={isLoading}
        onConfirm={handleApprove}
        onCancel={() => setActiveModal(null)}
      />
      <ConfirmModal
        isOpen={activeModal === 'reject'}
        title="Request Changes"
        description="This will return the content to the creator with changes requested. Please add a comment explaining what needs to be revised."
        confirmLabel="Request Changes"
        variant="danger"
        requireComment={true}
        commentPlaceholder="Describe the changes needed (required)..."
        isLoading={isLoading}
        onConfirm={handleReject}
        onCancel={() => setActiveModal(null)}
      />
      <ConfirmModal
        isOpen={activeModal === 'delete'}
        title="Delete Content"
        description="Are you sure you want to delete this content? This action is permanent and cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        showComment={false}
        isLoading={isLoading}
        onConfirm={handleDelete}
        onCancel={() => setActiveModal(null)}
      />
    </div>
  );
}

import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
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
  ChevronUp,
  Clock,
} from 'lucide-react';
import { useApp } from '../store/AppContext';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { StatusBadge } from '../components/StatusBadge';
import { WorkflowProgress } from '../components/WorkflowProgress';
import { ApprovalTimeline } from '../components/ApprovalTimeline';
import { ConfirmModal } from '../components/ConfirmModal';
import { formatDate } from '../utils/helpers';
import { SubContentList } from '../components/SubContentList';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

type ModalType = 'approve' | 'reject' | 'submit' | 'delete' | null;

export function ContentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { pathname } = useLocation();
  const currentUser = useRequireAuth();
  const { 
    contentList, 
    submitContent, approveContent, rejectContent, deleteContent,
    submitSubContent, approveSubContent, rejectSubContent, deleteSubContent 
  } = useApp();
  const navigate = useNavigate();
  
  const isSubMode = pathname.includes('/sub-content/');
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [pendingAction, setPendingAction] = useState<'submit' | 'approve' | 'reject' | 'delete' | null>(null);

  // Find either parent item or sub-content item with its parent
  const { mainItem, parentItem } = useMemo(() => {
    if (isSubMode) {
      const parent = contentList.find(c => c.subContents?.some(sc => sc.id === id));
      const sub = parent?.subContents?.find(sc => sc.id === id);
      return { mainItem: sub, parentItem: parent };
    }
    return { mainItem: contentList.find(c => c.id === id), parentItem: null };
  }, [contentList, id, isSubMode]);

  const item = mainItem;

  const [scrollProgress, setScrollProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Calculate reading time
  const readingTime = useMemo(() => {
    if (!item?.body) return 0;
    const words = item.body.trim().split(/\s+/).length;
    return Math.ceil(words / 200); // Average 200 wpm
  }, [item?.body]);

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / totalScroll) * 100;
      setScrollProgress(progress);
      setShowBackToTop(window.scrollY > 500);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  const canSubmit =
    currentUser.role === 'CREATOR' &&
    (item.status === 'DRAFT' || item.status === 'CHANGES_REQUESTED');
  
  const canEdit =
    currentUser.role === 'CREATOR' &&
    (item.status === 'DRAFT' || item.status === 'CHANGES_REQUESTED');
  const canDelete =
    currentUser.role === 'CREATOR' && item.status === 'DRAFT';
  
  const canApprove =
    item.status === 'IN_REVIEW' &&
    ((item.currentReviewStage === 1 && currentUser.role === 'REVIEWER_L1') ||
      (item.currentReviewStage === 2 && currentUser.role === 'REVIEWER_L2'));
  
  const canFinalize = canApprove;
  
  const canReject = canApprove;

  // ─── Handlers ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!item) return;
    setPendingAction('submit');
    setActiveModal(null);
    try {
      if (isSubMode) {
        await submitSubContent(item.id);
      } else {
        await submitContent(item.id);
      }
      toast.success('Submitted for review!');
    } catch {
    } finally {
      setPendingAction(null);
    }
  };

  const handleApprove = async (comment?: string) => {
    if (!item) return;
    setPendingAction('approve');
    setActiveModal(null);
    try {
      if (isSubMode) {
        await approveSubContent(item.id, comment);
      } else {
        await approveContent(item.id, comment);
      }
      const msg = currentUser.role === 'REVIEWER_L1' 
        ? 'Approved! Item moved to Stage 2.' 
        : 'Item fully approved and published!';
      toast.success(msg);
      navigate('/');
    } catch {
    } finally {
      setPendingAction(null);
    }
  };

  const handleReject = async (comment?: string) => {
    if (!item) return;
    setPendingAction('reject');
    setActiveModal(null);
    try {
      if (isSubMode) {
        await rejectSubContent(item.id, comment);
      } else {
        await rejectContent(item.id, comment);
      }
      toast.success('Changes requested. Item returned to creator.');
      navigate('/');
    } catch {
    } finally {
      setPendingAction(null);
    }
  };

  const handleDelete = async () => {
    if (!item) return;
    setPendingAction('delete');
    setActiveModal(null);
    try {
      if (isSubMode) {
        await deleteSubContent(item.id);
      } else {
        await deleteContent(item.id);
      }
      navigate('/');
    } catch {
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Reading Progress Bar */}
      <div className="fixed top-14 left-0 w-full h-1 z-40 pointer-events-none bg-gray-200/50">
        <div 
          className="h-full bg-blue-600 transition-all duration-150 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

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
              {(item.isLocked || item.status === 'IN_REVIEW' || item.status === 'APPROVED') && (
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
                  {pendingAction ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-600 animate-pulse">
                      <div className="h-2 w-2 rounded-full bg-blue-500 animate-ping" />
                      Updating...
                    </span>
                  ) : (
                    <>
                      <StatusBadge status={item.status} />
                      {item.status === 'IN_REVIEW' && item.currentReviewStage && (
                        <span
                          className={clsx(
                            'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold border uppercase tracking-wide',
                            item.currentReviewStage === 1
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-violet-50 text-violet-700 border-violet-200'
                          )}
                        >
                          Stage {item.currentReviewStage} Review
                        </span>
                      )}
                    </>
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
                <div className="flex items-center gap-1.5 text-blue-600 font-medium">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Est. {readingTime} min read</span>
                </div>
                {item.status === 'APPROVED' && (
                  <div className="flex items-center gap-1.5 text-emerald-600">
                    <Globe className="h-3.5 w-3.5" />
                    <span className="font-medium">Published</span>
                  </div>
                )}
              </div>

              {/* Body content */}
              <div className="prose prose-slate prose-lg max-w-none prose-p:text-gray-600 prose-headings:text-gray-900 prose-p:leading-relaxed prose-headings:font-bold">
                {item.body.split('\n\n').map((paragraph, idx) => {
                  if (paragraph.startsWith('## ')) {
                    return (
                      <h2 key={idx} className="text-xl font-bold text-gray-900 mt-10 mb-4 border-b border-gray-100 pb-2">
                        {paragraph.replace('## ', '')}
                      </h2>
                    );
                  }
                  if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                    return (
                      <h3 key={idx} className="text-lg font-bold text-gray-800 mt-6 mb-3">
                        {paragraph.replace(/\*\*/g, '')}
                      </h3>
                    );
                  }
                  const parts = paragraph.split(/(\*\*[^*]+\*\*)/g);
                  return (
                    <p key={idx} className="text-base text-gray-700 leading-relaxed mb-6">
                      {parts.map((part, i) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                          return (
                            <strong key={i} className="font-bold text-gray-900">
                              {part.replace(/\*\*/g, '')}
                            </strong>
                          );
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
          <aside className="lg:col-span-1">
            <div className="lg:sticky lg:top-24 space-y-5 self-start">
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
                  This content is approved &amp; published.
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Submit */}
                  {currentUser.role === 'CREATOR' && (
                    <button
                      onClick={() => setActiveModal('submit')}
                      disabled={!canSubmit || !!pendingAction}
                      className={clsx(
                        'w-full flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all',
                        canSubmit && !pendingAction
                          ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      )}
                    >
                      {pendingAction === 'submit' ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      Submit for Review
                    </button>
                  )}

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
                      disabled={!!pendingAction}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-50 border border-red-100 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {pendingAction === 'delete' ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-300 border-t-red-600" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      Delete Content
                    </button>
                  )}

                  {/* Approve */}
                  {(currentUser.role === 'REVIEWER_L1' || currentUser.role === 'REVIEWER_L2') && (
                    <>
                      <button
                        onClick={() => setActiveModal('approve')}
                        disabled={!canFinalize || !!pendingAction}
                        className={clsx(
                          'w-full flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all',
                          canFinalize && !pendingAction
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        )}
                      >
                        {pendingAction === 'approve' ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                        {currentUser.role === 'REVIEWER_L1' ? 'Approve (→ Stage 2)' : 'Approve & Publish'}
                      </button>



                      {/* Reject */}
                      <button
                        onClick={() => setActiveModal('reject')}
                        disabled={!canReject || !!pendingAction}
                        className={clsx(
                          'w-full flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all',
                          canReject && !pendingAction
                            ? 'bg-red-50 border border-red-200 text-red-700 hover:bg-red-100'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        )}
                      >
                        {pendingAction === 'reject' ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-300 border-t-red-600" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                        Request Changes
                      </button>

                      {/* Helper text when reviewer but not the right stage */}
                      {item.status === 'IN_REVIEW' && !canApprove && (
                        <p className="text-xs text-amber-600 bg-amber-50 rounded-lg p-2.5 text-center mt-3 border border-amber-100 italic">
                          {item.currentReviewStage === 1
                            ? 'Currently awaiting L1 Reviewer approval.'
                            : 'Currently awaiting L2 Reviewer approval.'}
                        </p>
                      )}
                    </>
                  )}

                  {!canSubmit && !canEdit && !canApprove && !canReject && item.status !== 'IN_REVIEW' && (
                    <p className="text-xs text-gray-400 text-center pt-1">
                      No actions available for your role at this stage.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Sub-Contents / Parent Reference Section */}
            {!isSubMode && item.status === 'APPROVED' && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                <SubContentList parent={item} />
              </div>
            )}

            {isSubMode && parentItem && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4 text-blue-500" />
                  Parent Content Reference
                </h3>
                <Link to={`/content/${parentItem.id}`} className="block group">
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 group-hover:border-blue-100 group-hover:bg-blue-50/30 transition-all">
                    <div className="flex items-start gap-3">
                      <div className="h-12 w-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200">
                        <img 
                          src={parentItem.image} 
                          alt="parent" 
                          className="h-full w-full object-cover grayscale group-hover:grayscale-0 transition-all" 
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-gray-900 truncate group-hover:text-blue-700 transition-colors">
                          {parentItem.title}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">{parentItem.description}</p>
                      </div>
                      <StatusBadge status={parentItem.status} size="sm" />
                    </div>
                  </div>
                </Link>
              </div>
            )}

            {/* Approval History */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-800 mb-4">Approval History</h3>
              <ApprovalTimeline history={item.history} />
            </div>
          </div>
        </aside>
      </div>
    </div>

      {/* Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-8 right-8 h-12 w-12 rounded-full bg-white border border-gray-200 shadow-xl flex items-center justify-center text-gray-600 hover:text-blue-600 hover:scale-110 active:scale-95 transition-all z-40 animate-in zoom-in-95"
        >
          <ChevronUp className="h-6 w-6" />
        </button>
      )}

      {/* ── Modals ──────────────────────────────────────────────────────────────── */}
      <ConfirmModal
        isOpen={activeModal === 'submit'}
        title="Submit for Review"
        description="Are you sure you want to submit this content for review? It will be locked for editing until a reviewer responds."
        confirmLabel="Submit"
        variant="success"
        showComment={false}
        isLoading={!!pendingAction}
        onConfirm={handleSubmit}
        onCancel={() => setActiveModal(null)}
      />
      <ConfirmModal
        isOpen={activeModal === 'approve'}
        title={
          currentUser.role === 'REVIEWER_L1'
            ? 'Approve & Move to Stage 2'
            : 'Approve & Publish'
        }
        description={
          currentUser.role === 'REVIEWER_L1'
            ? 'This will pass the content to the L2 reviewer for final approval.'
            : 'This will mark the content as fully approved and published. This action cannot be undone.'
        }
        confirmLabel={currentUser.role === 'REVIEWER_L1' ? 'Approve' : 'Publish'}
        variant="success"
        commentPlaceholder="Add a review comment (optional)..."
        isLoading={!!pendingAction}
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
        isLoading={!!pendingAction}
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
        isLoading={!!pendingAction}
        onConfirm={handleDelete}
        onCancel={() => setActiveModal(null)}
      />
    </div>
  );
}

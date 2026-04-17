import { useState, useEffect } from 'react';
import {
  Search,
  ClipboardList,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Inbox,
} from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import { clsx } from 'clsx';
import { useApp } from '../store/AppContext';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { useDebounce } from '../hooks/useDebounce';
import { useReviewQueue } from '../hooks/useReviewQueue';
import { ReviewQueueCard } from '../components/ReviewQueueCard';
import { EmptyState } from '../components/EmptyState';
import { SkeletonCard, SkeletonStats } from '../components/SkeletonCard';

type ReviewTab = 'pending' | 'recent';

export function ReviewerDashboard() {
  const currentUser = useRequireAuth();
  const { 
    isLoading, 
    isFetchingNextPage, 
    hasNextPage, 
    fetchNextPage, 
    stats,
    setFilters
  } = useApp();
  
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<ReviewTab>('pending');
  const debouncedSearch = useDebounce(search, 300);

  const { ref, inView } = useInView();

  // Sync search and tab with global filters for server-side filtering
  useEffect(() => {
    setFilters({ search: debouncedSearch, tab });
  }, [debouncedSearch, tab, setFilters]);

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const {
    filteredItems,
  } = useReviewQueue({ search, tab });

  // Use server-side stats
  const pendingCount = stats.pendingCount || 0;
  const approvedByMeCount = stats.approvedByMeCount || 0;
  const rejectedByMeCount = stats.rejectedByMeCount || 0;


  if (!currentUser) return null;

  const isL1 = currentUser.role === 'REVIEWER_L1';
  const stageLabel = isL1 ? 'Stage 1' : 'Stage 2';
  const stageColor = isL1 ? 'text-blue-600' : 'text-violet-600';
  const stageBg = isL1 ? 'bg-blue-50 border-blue-200' : 'bg-violet-50 border-violet-200';
  const stageAccent = isL1 ? 'from-blue-600 to-cyan-500' : 'from-violet-600 to-purple-500';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Page Header ─────────────────────────────────────────────────────── */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div
                  className={clsx(
                    'flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br shadow-sm',
                    stageAccent
                  )}
                >
                  <ShieldCheck className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Review Queue</h1>
              </div>
              <p className="text-sm text-gray-500 ml-12">
                {isL1
                  ? 'Content awaiting your Stage 1 review'
                  : 'Content awaiting your Stage 2 review'}
              </p>
            </div>

            <div
              className={clsx(
                'hidden sm:flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold shrink-0',
                stageBg,
                stageColor
              )}
            >
              <ClipboardList className="h-4 w-4" />
              {stageLabel} Reviewer
            </div>
          </div>
        </div>

        {/* ── Stats Cards ──────────────────────────────────────────────────────── */}
        {isLoading ? (
          <SkeletonStats />
        ) : (
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              {
                label: 'Pending Reviews',
                value: pendingCount,
                icon: Clock,
                color: isL1 ? 'text-blue-600' : 'text-violet-600',
                bg: isL1 ? 'bg-blue-50' : 'bg-violet-50',
                ring: isL1 ? 'ring-blue-100' : 'ring-violet-100',
                highlight: true,
              },
              {
                label: 'Approved by You',
                value: approvedByMeCount,
                icon: CheckCircle2,
                color: 'text-emerald-600',
                bg: 'bg-emerald-50',
                ring: 'ring-emerald-100',
                highlight: false,
              },
              {
                label: 'Rejected by You',
                value: rejectedByMeCount,
                icon: XCircle,
                color: 'text-red-500',
                bg: 'bg-red-50',
                ring: 'ring-red-100',
                highlight: false,
              },
            ].map(({ label, value, icon: Icon, color, bg, ring, highlight }) => (
              <div
                key={label}
                className={clsx(
                  'bg-white rounded-2xl border border-gray-200 p-5 shadow-sm transition-all',
                  highlight && 'ring-2',
                  highlight && ring
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-gray-500">{label}</span>
                  <div className={clsx('rounded-xl p-2', bg)}>
                    <Icon className={clsx('h-4 w-4', color)} />
                  </div>
                </div>
                <div className={clsx('text-3xl font-bold', highlight ? color : 'text-gray-900')}>
                  {value}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Search & Filter Tabs ─────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-6">
          <div className="flex flex-col sm:flex-row gap-0 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
            {/* Search */}
            <div className="relative flex-1 p-3">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                id="review-search"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title or description…"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1.5 p-3 shrink-0">
              <button
                id="tab-pending"
                onClick={() => setTab('pending')}
                className={clsx(
                  'flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-all',
                  tab === 'pending'
                    ? isL1
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-violet-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                <Inbox className="h-3.5 w-3.5" />
                All Pending
                {pendingCount > 0 && (
                  <span
                    className={clsx(
                      'rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums',
                      tab === 'pending' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                    )}
                  >
                    {pendingCount}
                  </span>
                )}
              </button>

              <button
                id="tab-recent"
                onClick={() => setTab('recent')}
                className={clsx(
                  'flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-all',
                  tab === 'recent'
                    ? isL1
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-violet-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                <Clock className="h-3.5 w-3.5" />
                Recently Reviewed
              </button>
            </div>
          </div>
        </div>


        {/* ── Section heading ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-700">
              {tab === 'pending' ? 'Awaiting Your Decision' : 'Recently Reviewed'}
            </h2>
            {filteredItems.length > 0 && (
              <p className="text-xs text-gray-400 mt-0.5">
                Showing <span className="font-semibold">{filteredItems.length}</span> item{filteredItems.length !== 1 ? 's' : ''}
                {search && ` matching "${search}"`}
              </p>
            )}
          </div>

          {tab === 'pending' && pendingCount > 0 && (
            <div
              className={clsx(
                'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold',
                isL1
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-violet-50 text-violet-700 border border-violet-200'
              )}
            >
              <span className={clsx('h-1.5 w-1.5 rounded-full animate-pulse', isL1 ? 'bg-blue-500' : 'bg-violet-500')} />
              {stageLabel} Active
            </div>
          )}
        </div>

        {/* ── Content Grid ─────────────────────────────────────────────────────── */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : filteredItems.length === 0 ? (
          <EmptyState
            title={
              tab === 'pending'
                ? search
                  ? 'No results found'
                  : 'Queue is clear! 🎉'
                : search
                  ? 'No results found'
                  : 'No recent activity'
            }
            description={
              tab === 'pending'
                ? search
                  ? 'Try adjusting your search.'
                  : `You have no pending ${stageLabel} reviews right now.`
                : search
                  ? 'Try adjusting your search.'
                  : 'Content you review will appear here.'
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredItems.map((item) => (
              <ReviewQueueCard
                key={item.id}
                item={item}
                currentRole={currentUser.role}
                isRecentlyReviewed={tab === 'recent'}
              />
            ))}
            
            {/* Load More Trigger */}
            {(hasNextPage || isFetchingNextPage) && (
              <div ref={ref} className="col-span-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-5">
                {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
              </div>
            )}
            
            {!hasNextPage && filteredItems.length > 5 && (
              <div className="col-span-full text-center py-10 text-gray-400 text-sm">
                You've reached the end of the queue.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, PlusCircle, TrendingUp, FileText, Clock, CheckCircle2 } from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import { useApp } from '../store/AppContext';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { ContentCard } from '../components/ContentCard';
import { EmptyState } from '../components/EmptyState';
import { StatusBadge } from '../components/StatusBadge';
import { SkeletonCard, SkeletonStats } from '../components/SkeletonCard';
import { clsx } from 'clsx';
import type { ContentStatus } from '../types';

const STATUS_OPTIONS: { value: ContentStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All Content' },
  { value: 'DRAFT', label: 'Drafts' },
  { value: 'IN_REVIEW', label: 'In Review' },
  { value: 'CHANGES_REQUESTED', label: 'Changes Requested' },
  { value: 'APPROVED', label: 'Approved' },
];

export function ContentListPage() {
  const currentUser = useRequireAuth();
  const { 
    contentList, 
    filters, 
    setFilters, 
    isLoading, 
    isFetchingNextPage, 
    hasNextPage, 
    fetchNextPage, 
    stats 
  } = useApp();

  const { ref, inView } = useInView();

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Content Dashboard</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Manage and track your content approval workflow
            </p>
          </div>
          {currentUser.role === 'CREATOR' && (
            <Link
              to="/create"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 active:scale-95 transition-all shadow-sm self-start sm:self-auto"
            >
              <PlusCircle className="h-4 w-4" />
              New Content
            </Link>
          )}
        </div>

        {/* Stats Row */}
        {isLoading ? (
          <SkeletonStats />
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
            {[
              { label: 'Total Content', value: stats.total, icon: TrendingUp, color: 'text-gray-600', bg: 'bg-gray-100' },
              { label: 'Drafts', value: stats.drafts, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'In Review', value: stats.inReview, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
              { label: 'Approved', value: stats.approved, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Needs Revision', value: stats.needsAction, icon: Clock, color: 'text-red-600', bg: 'bg-red-50' },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-500">{label}</span>
                  <div className={clsx('rounded-lg p-1.5', bg)}>
                    <Icon className={clsx('h-3.5 w-3.5', color)} />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900">{value || 0}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ search: e.target.value })}
                placeholder="Search by title or description..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Status filter */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <Filter className="h-4 w-4 text-gray-400 shrink-0" />
              {STATUS_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setFilters({ status: value })}
                  className={clsx(
                    'rounded-lg px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap',
                    filters.status === value
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : contentList.length === 0 ? (
          <EmptyState
            title="No content found"
            description={
              filters.status !== 'ALL' || filters.search
                ? 'Try adjusting your filters.'
                : 'Get started by creating your first content piece.'
            }
            action={
              currentUser.role === 'CREATOR' ? (
                <Link
                  to="/create"
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                >
                  <PlusCircle className="h-4 w-4" />
                  Create Content
                </Link>
              ) : undefined
            }
          />
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">
                Showing <span className="font-semibold text-gray-700">{contentList.length}</span> item{contentList.length !== 1 ? 's' : ''}
                {filters.status !== 'ALL' && (
                  <>
                    {' '}with status{' '}
                    <StatusBadge status={filters.status as ContentStatus} size="sm" />
                  </>
                )}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {contentList.map((item) => (
                <ContentCard key={item.id} item={item} currentRole={currentUser.role} />
              ))}
              
              {/* Load More Trigger */}
              {(hasNextPage || isFetchingNextPage) && (
                <div ref={ref} className="col-span-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-5">
                  {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
                </div>
              )}
            </div>
            
            {!hasNextPage && contentList.length > 0 && (
              <div className="text-center py-10 text-gray-400 text-sm">
                You've reached the end of the list.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

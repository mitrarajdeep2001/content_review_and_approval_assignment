import { useMemo } from 'react';
import { useApp } from '../store/AppContext';
import type { ContentItem, SubContent, Role } from '../types';

type ReviewTab = 'pending' | 'recent';

// Union type for items in the review queue
export type ReviewQueueItem = ContentItem | SubContent;

interface UseReviewQueueOptions {
  search: string;
  tab: ReviewTab;
}

interface ReviewQueueResult {
  pendingItems: ReviewQueueItem[];
  recentItems: ReviewQueueItem[];
  filteredItems: ReviewQueueItem[];
  pendingCount: number;
  approvedByMeCount: number;
  rejectedByMeCount: number;
}

function getReviewerStage(role: Role): 1 | 2 | null {
  if (role === 'REVIEWER_L1') return 1;
  if (role === 'REVIEWER_L2') return 2;
  return null;
}

export function useReviewQueue(
  { search, tab }: UseReviewQueueOptions
): ReviewQueueResult {
  const { contentList, currentUser } = useApp();

  return useMemo(() => {
    if (!currentUser || currentUser.role === 'CREATOR') {
      return {
        pendingItems: [],
        recentItems: [],
        filteredItems: [],
        pendingCount: 0,
        approvedByMeCount: 0,
        rejectedByMeCount: 0,
      };
    }

    const stage = getReviewerStage(currentUser.role);
    const userName = currentUser.name;
    const reviewActions = new Set(['APPROVED_L1', 'APPROVED_L2', 'APPROVED', 'REJECTED']);

    // 1. Flatten all possible reviewable items (Parent contents + all their SubContents)
    const allItems: ReviewQueueItem[] = [];
    contentList.forEach((parent) => {
      allItems.push(parent);
      if (parent.subContents) {
        parent.subContents.forEach((child) => {
          allItems.push(child);
        });
      }
    });

    // 2. Filter Pending: IN_REVIEW at the current reviewer's stage
    const pendingItems = allItems.filter(
      (item) =>
        item.status === 'IN_REVIEW' && item.currentReviewStage === stage
    );

    // 3. Filter Recently reviewed: items where this user's last history action is in reviewActions
    const recentItems = allItems
      .filter((item) => {
        const relevantEntries = item.history.filter(
          (h) => h.actor === userName && reviewActions.has(h.action)
        );
        return relevantEntries.length > 0;
      })
      .sort((a, b) => {
        // Sort by the most recent action by this reviewer
        const lastA = [...a.history]
          .reverse()
          .find((h) => h.actor === userName && reviewActions.has(h.action));
        const lastB = [...b.history]
          .reverse()
          .find((h) => h.actor === userName && reviewActions.has(h.action));
        const tA = lastA ? new Date(lastA.timestamp).getTime() : 0;
        const tB = lastB ? new Date(lastB.timestamp).getTime() : 0;
        return tB - tA;
      });

    // 4. Stats
    // Note: These counts are now partially redundant because the server returns accurate stats,
    // but we keep them for UI feedback on the current loaded set if needed.
    const approvedByMeCount = allItems.filter((item) =>
      item.history.some(
        (h) =>
          h.actor === userName &&
          (h.action === 'APPROVED_L1' || h.action === 'APPROVED_L2' || h.action === 'APPROVED')
      )
    ).length;

    const rejectedByMeCount = allItems.filter((item) =>
      item.history.some((h) => h.actor === userName && h.action === 'REJECTED')
    ).length;

    // 5. Active items for the current tab
    // Since the server already filters by tab, we just need to flatten the results
    // and potentially filter by search (though the server handles that too, 
    // we keep it here as a client-side search refinement layer).
    const needle = search.toLowerCase();
    const sourceItems = tab === 'pending' ? pendingItems : recentItems;
    const filteredItems = needle
      ? sourceItems.filter(
          (item) =>
            item.title.toLowerCase().includes(needle) ||
            item.description.toLowerCase().includes(needle) ||
            ('parentTitle' in item && item.parentTitle?.toLowerCase().includes(needle))
        )
      : sourceItems;

    return {
      pendingItems,
      recentItems,
      filteredItems,
      pendingCount: pendingItems.length,
      approvedByMeCount,
      rejectedByMeCount,
    };
  }, [contentList, currentUser, search, tab]);
}

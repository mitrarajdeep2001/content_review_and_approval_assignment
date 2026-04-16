import { useMemo } from 'react';
import { useApp } from '../store/AppContext';
import type { ContentItem, Role } from '../types';

type ReviewTab = 'pending' | 'recent';

interface UseReviewQueueOptions {
  search: string;
  tab: ReviewTab;
}

interface ReviewQueueResult {
  pendingItems: ContentItem[];
  recentItems: ContentItem[];
  filteredItems: ContentItem[];
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

    // Pending: IN_REVIEW at the reviewer's stage
    const pendingItems = contentList.filter(
      (item) =>
        item.status === 'IN_REVIEW' && item.currentReviewStage === stage
    );

    // Recently reviewed: items where this user's last history action is APPROVED_L1/APPROVED_L2/APPROVED/REJECTED
    const reviewActions = new Set(['APPROVED_L1', 'APPROVED_L2', 'APPROVED', 'REJECTED']);
    const recentItems = contentList
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
      })
      .slice(0, 5); // Show last 5

    // Stats
    const approvedByMeCount = contentList.filter((item) =>
      item.history.some(
        (h) =>
          h.actor === userName &&
          (h.action === 'APPROVED_L1' || h.action === 'APPROVED_L2' || h.action === 'APPROVED')
      )
    ).length;

    const rejectedByMeCount = contentList.filter((item) =>
      item.history.some((h) => h.actor === userName && h.action === 'REJECTED')
    ).length;

    // Apply search filter
    const needle = search.toLowerCase();
    const sourceItems = tab === 'pending' ? pendingItems : recentItems;
    const filteredItems = needle
      ? sourceItems.filter(
          (item) =>
            item.title.toLowerCase().includes(needle) ||
            item.description.toLowerCase().includes(needle)
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

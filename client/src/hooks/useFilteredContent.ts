import { useMemo } from 'react';
import { useApp } from '../store/AppContext';

export function useFilteredContent() {
  const { contentList, filters } = useApp();

  return useMemo(() => {
    return contentList.filter((item) => {
      const matchesStatus =
        filters.status === 'ALL' || item.status === filters.status;
      const matchesSearch =
        !filters.search ||
        item.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        item.description.toLowerCase().includes(filters.search.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [contentList, filters]);
}

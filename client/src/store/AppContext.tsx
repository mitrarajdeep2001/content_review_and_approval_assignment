import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useEffect,
  useCallback,
} from 'react';
import type { AppContextType, AuthUser, ContentItem, FilterState } from '../types';
import { getSession, saveSession, clearSession } from '../utils/auth';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';

const CONTENT_QUERY_KEY = ['contents'];
const USER_QUERY_KEY = ['user'];

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  
  // ─── Auth State with TanStack Query ─────────────────────────────────────
  const { data: userData } = useQuery({
    queryKey: USER_QUERY_KEY,
    queryFn: async () => {
      try {
        const response = await api.get('/auth/me');
        return response.data as AuthUser;
      } catch {
        return null;
      }
    },
    staleTime: 0,
    retry: false,
  });

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => getSession());
  const [filters, setFiltersState] = useState<FilterState>({ status: 'ALL', search: '' });

  // Keep currentUser state in sync with query data
  useEffect(() => {
    if (userData !== undefined) {
      setCurrentUser(userData);
      if (userData) {
        saveSession(userData);
      } else {
        clearSession();
      }
    }
  }, [userData]);

  // ─── Fetch content list with Infinite Query ──────────────────────────────
  const {
    data: contentData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: [...CONTENT_QUERY_KEY, filters],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await api.get('/content', {
        params: {
          page: pageParam,
          limit: 10,
          search: filters.search,
          status: filters.status,
          tab: filters.tab,
        },
      });
      return response.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    enabled: !!currentUser,
    staleTime: 0,
  });

  const contentList = useMemo(() => {
    return contentData?.pages.flatMap((page) => page.items) || [];
  }, [contentData]);

  const stats = useMemo(() => {
    // Use the latest page's stats so they stay fresh after refetches
    const pages = contentData?.pages;
    return pages?.[pages.length - 1]?.stats || pages?.[0]?.stats || {};
  }, [contentData]);

  const login = useCallback(async (credentials: { email: string; password: string }) => {
    try {
      const response = await api.post('/auth/login', credentials);
      setCurrentUser(response.data);
      saveSession(response.data);
      queryClient.setQueryData(USER_QUERY_KEY, response.data);
      toast.success(`Welcome back, ${response.data.name}!`);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
      clearSession();
      queryClient.setQueryData(USER_QUERY_KEY, null);
      queryClient.setQueryData(CONTENT_QUERY_KEY, { pages: [], pageParams: [] });
      toast.success('Logged out successfully');
    } catch {
      toast.error('Logout failed');
    }
  }, [queryClient]);

  // ─── Filters ───────────────────────────────────────────────────────────────
  const setFilters = useCallback((partial: Partial<FilterState>) => {
    setFiltersState((prev) => ({ ...prev, ...partial }));
  }, []);

  // ─── Create Content ────────────────────────────────────────────────────────
  const createContent = useCallback(
    async (formData: FormData): Promise<ContentItem> => {
      if (!currentUser) throw new Error('Not authenticated');
      try {
        const response = await api.post('/content', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const newItem = response.data;
        queryClient.invalidateQueries({ queryKey: CONTENT_QUERY_KEY });
        return newItem;
      } catch (error) {
        toast.error('Failed to create content');
        throw error;
      }
    },
    [currentUser, queryClient]
  );

  // ─── Update Content ────────────────────────────────────────────────────────
  const updateContent = useCallback(
    async (id: string, formData: FormData) => {
      if (!currentUser) return;

      const item = contentList.find((c) => c.id === id);
      if (item && item.status !== 'DRAFT' && item.status !== 'CHANGES_REQUESTED') {
        toast.error('Content can only be edited when it is a draft or changes are requested.');
        return;
      }

      try {
        await api.put(`/content/${id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        queryClient.invalidateQueries({ queryKey: CONTENT_QUERY_KEY });
      } catch (error) {
        toast.error('Failed to update content');
        throw error;
      }
    },
    [currentUser, contentList, queryClient]
  );

  // ─── Delete Content ────────────────────────────────────────────────────────
  const deleteContent = useCallback(
    async (id: string) => {
      if (!currentUser) return;

      const item = contentList.find((c) => c.id === id);
      if (item && (item.status === 'IN_REVIEW' || item.status === 'APPROVED')) {
        toast.error('Locked content cannot be deleted.');
        return;
      }

      try {
        await api.delete(`/content/${id}`);
        queryClient.invalidateQueries({ queryKey: CONTENT_QUERY_KEY });
        toast.success('Content deleted');
      } catch (error) {
        toast.error('Failed to delete content');
        throw error;
      }
    },
    [currentUser, contentList, queryClient]
  );

  // ─── Submit Content ────────────────────────────────────────────────────────
  const submitContent = useCallback(
    async (id: string) => {
      if (!currentUser) return;
      try {
        await api.patch(`/content/${id}/submit`);
        // Refetch the full list so history & status are fresh from DB
        queryClient.invalidateQueries({ queryKey: CONTENT_QUERY_KEY });
      } catch (error: any) {
        const message = error.response?.data?.message || 'Failed to submit content';
        toast.error(message);
        throw error;
      }
    },
    [currentUser, queryClient]
  );

  // ─── Approve Content ───────────────────────────────────────────────────────
  const approveContent = useCallback(
    async (id: string, comment?: string) => {
      if (!currentUser) return;
      try {
        await api.patch(`/content/${id}/approve`, { comment });
        queryClient.invalidateQueries({ queryKey: CONTENT_QUERY_KEY });
      } catch (error: any) {
        const message = error.response?.data?.message || 'Failed to approve content';
        toast.error(message);
        throw error;
      }
    },
    [currentUser, queryClient]
  );

  // ─── Reject Content ────────────────────────────────────────────────────────
  const rejectContent = useCallback(
    async (id: string, comment?: string) => {
      if (!currentUser) return;
      try {
        await api.patch(`/content/${id}/reject`, { comment });
        queryClient.invalidateQueries({ queryKey: CONTENT_QUERY_KEY });
      } catch (error: any) {
        const message = error.response?.data?.message || 'Failed to reject content';
        toast.error(message);
        throw error;
      }
    },
    [currentUser, queryClient]
  );

  // ─── Sub-Content Actions ───────────────────────────────────────────────────
  const createSubContent = useCallback(
    async (parentId: string, data: FormData) => {
      try {
        const response = await api.post(`/content/${parentId}/sub-content`, data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        queryClient.invalidateQueries({ queryKey: CONTENT_QUERY_KEY });
        return response.data;
      } catch (error: any) {
        toast.error(error.response?.data?.error || 'Failed to create sub-content');
        throw error;
      }
    },
    [queryClient]
  );

  const updateSubContent = useCallback(
    async (id: string, data: FormData) => {
      try {
        await api.put(`/sub-content/${id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        queryClient.invalidateQueries({ queryKey: CONTENT_QUERY_KEY });
      } catch (error: any) {
        toast.error(error.response?.data?.error || 'Failed to update sub-content');
        throw error;
      }
    },
    [queryClient]
  );

  const deleteSubContent = useCallback(
    async (id: string) => {
      try {
        await api.delete(`/sub-content/${id}`);
        queryClient.invalidateQueries({ queryKey: CONTENT_QUERY_KEY });
        toast.success('Sub-content deleted');
      } catch (error: any) {
        toast.error(error.response?.data?.error || 'Failed to delete sub-content');
        throw error;
      }
    },
    [queryClient]
  );

  const submitSubContent = useCallback(
    async (id: string) => {
      try {
        await api.patch(`/sub-content/${id}/submit`);
        queryClient.invalidateQueries({ queryKey: CONTENT_QUERY_KEY });
      } catch (error: any) {
        toast.error(error.response?.data?.error || 'Failed to submit sub-content');
        throw error;
      }
    },
    [queryClient]
  );

  const approveSubContent = useCallback(
    async (id: string, comment?: string) => {
      try {
        await api.patch(`/sub-content/${id}/approve`, { comment });
        queryClient.invalidateQueries({ queryKey: CONTENT_QUERY_KEY });
      } catch (error: any) {
        toast.error(error.response?.data?.error || 'Failed to approve sub-content');
        throw error;
      }
    },
    [queryClient]
  );

  const rejectSubContent = useCallback(
    async (id: string, comment?: string) => {
      try {
        await api.patch(`/sub-content/${id}/reject`, { comment });
        queryClient.invalidateQueries({ queryKey: CONTENT_QUERY_KEY });
      } catch (error: any) {
        toast.error(error.response?.data?.error || 'Failed to reject sub-content');
        throw error;
      }
    },
    [queryClient]
  );

  const value = useMemo<AppContextType>(
    () => ({
      currentUser,
      login,
      logout,
      contentList,
      createContent,
      updateContent,
      deleteContent,
      submitContent,
      approveContent,
      rejectContent,
      createSubContent,
      updateSubContent,
      deleteSubContent,
      submitSubContent,
      approveSubContent,
      rejectSubContent,
      filters,
      setFilters,
      isLoading,
      isFetchingNextPage,
      hasNextPage,
      fetchNextPage,
      stats,
    }),
    [
      currentUser,
      login,
      logout,
      contentList,
      createContent,
      updateContent,
      deleteContent,
      submitContent,
      approveContent,
      rejectContent,
      createSubContent,
      updateSubContent,
      deleteSubContent,
      submitSubContent,
      approveSubContent,
      rejectSubContent,
      filters,
      setFilters,
      isLoading,
      isFetchingNextPage,
      hasNextPage,
      fetchNextPage,
      stats,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}

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

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => getSession());
  const [contentList, setContentList] = useState<ContentItem[]>([]);
  const [filters, setFiltersState] = useState<FilterState>({ status: 'ALL', search: '' });

  // ─── Fetch content list ────────────────────────────────────────────────────
  const refreshContents = useCallback(async () => {
    try {
      const response = await api.get('/content');
      setContentList(response.data);
    } catch (error) {
      console.error('Failed to fetch contents:', error);
    }
  }, []);

  useEffect(() => {
    refreshContents();
  }, [refreshContents, currentUser]);

  // ─── Auth ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchMe = async () => {
      try {
        const response = await api.get('/auth/me');
        setCurrentUser(response.data);
      } catch {
        setCurrentUser(null);
      }
    };
    fetchMe();
  }, []);

  const login = useCallback(async (credentials: { email: string; password: string }) => {
    try {
      const response = await api.post('/auth/login', credentials);
      setCurrentUser(response.data);
      saveSession(response.data);
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
      setCurrentUser(null);
      setContentList([]);
      toast.success('Logged out successfully');
    } catch {
      toast.error('Logout failed');
    }
  }, []);

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
        setContentList((prev) => [newItem, ...prev]);
        return newItem;
      } catch (error) {
        toast.error('Failed to create content');
        throw error;
      }
    },
    [currentUser]
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
        const response = await api.put(`/content/${id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const updatedItem = response.data;
        setContentList((prev) =>
          prev.map((c) => (c.id !== id ? c : { ...c, ...updatedItem }))
        );
      } catch (error) {
        toast.error('Failed to update content');
        throw error;
      }
    },
    [currentUser, contentList]
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
        setContentList((prev) => prev.filter((c) => c.id !== id));
        toast.success('Content deleted');
      } catch (error) {
        toast.error('Failed to delete content');
        throw error;
      }
    },
    [currentUser, contentList]
  );

  // ─── Submit Content ────────────────────────────────────────────────────────
  const submitContent = useCallback(
    async (id: string) => {
      if (!currentUser) return;
      try {
        await api.patch(`/content/${id}/submit`);
        // Refetch the full list so history & status are fresh from DB
        await refreshContents();
      } catch (error: any) {
        const message = error.response?.data?.message || 'Failed to submit content';
        toast.error(message);
        throw error;
      }
    },
    [currentUser, refreshContents]
  );

  // ─── Approve Content ───────────────────────────────────────────────────────
  const approveContent = useCallback(
    async (id: string, comment?: string) => {
      if (!currentUser) return;
      try {
        const response = await api.patch(`/content/${id}/approve`, { comment });
        const updatedItem: ContentItem = response.data;
        // Replace the item in state with the fresh version (includes updated history)
        setContentList((prev) =>
          prev.map((c) => (c.id !== id ? c : updatedItem))
        );
      } catch (error: any) {
        const message = error.response?.data?.message || 'Failed to approve content';
        toast.error(message);
        throw error;
      }
    },
    [currentUser]
  );

  // ─── Reject Content ────────────────────────────────────────────────────────
  const rejectContent = useCallback(
    async (id: string, comment?: string) => {
      if (!currentUser) return;
      try {
        const response = await api.patch(`/content/${id}/reject`, { comment });
        const updatedItem: ContentItem = response.data;
        setContentList((prev) =>
          prev.map((c) => (c.id !== id ? c : updatedItem))
        );
      } catch (error: any) {
        const message = error.response?.data?.message || 'Failed to reject content';
        toast.error(message);
        throw error;
      }
    },
    [currentUser]
  );

  // ─── Sub-Content Actions ───────────────────────────────────────────────────
  const createSubContent = useCallback(
    async (parentId: string, data: FormData) => {
      try {
        const response = await api.post(`/content/${parentId}/sub-content`, data);
        await refreshContents();
        return response.data;
      } catch (error: any) {
        toast.error(error.response?.data?.error || 'Failed to create sub-content');
        throw error;
      }
    },
    [refreshContents]
  );

  const updateSubContent = useCallback(
    async (id: string, data: FormData) => {
      try {
        await api.put(`/sub-content/${id}`, data);
        await refreshContents();
      } catch (error: any) {
        toast.error(error.response?.data?.error || 'Failed to update sub-content');
        throw error;
      }
    },
    [refreshContents]
  );

  const deleteSubContent = useCallback(
    async (id: string) => {
      try {
        await api.delete(`/sub-content/${id}`);
        await refreshContents();
        toast.success('Sub-content deleted');
      } catch (error: any) {
        toast.error(error.response?.data?.error || 'Failed to delete sub-content');
        throw error;
      }
    },
    [refreshContents]
  );

  const submitSubContent = useCallback(
    async (id: string) => {
      try {
        await api.patch(`/sub-content/${id}/submit`);
        await refreshContents();
      } catch (error: any) {
        toast.error(error.response?.data?.error || 'Failed to submit sub-content');
        throw error;
      }
    },
    [refreshContents]
  );

  const approveSubContent = useCallback(
    async (id: string, comment?: string) => {
      try {
        await api.patch(`/sub-content/${id}/approve`, { comment });
        await refreshContents();
      } catch (error: any) {
        toast.error(error.response?.data?.error || 'Failed to approve sub-content');
        throw error;
      }
    },
    [refreshContents]
  );

  const rejectSubContent = useCallback(
    async (id: string, comment?: string) => {
      try {
        await api.patch(`/sub-content/${id}/reject`, { comment });
        await refreshContents();
      } catch (error: any) {
        toast.error(error.response?.data?.error || 'Failed to reject sub-content');
        throw error;
      }
    },
    [refreshContents]
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
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}

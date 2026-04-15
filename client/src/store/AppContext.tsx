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
import { generateId } from '../utils/helpers';
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

  useEffect(() => {
    const fetchContents = async () => {
      try {
        const response = await api.get('/content');
        setContentList(response.data);
      } catch (error) {
        console.error('Failed to fetch contents:', error);
      }
    };
    fetchContents();
  }, []);

  // ─── Auth ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchMe = async () => {
      try {
        const response = await api.get('/auth/me');
        setCurrentUser(response.data);
      } catch (error) {
        // Not logged in or error, just clear current user
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
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Logout failed');
    }
  }, []);

  // ─── Filters ─────────────────────────────────────────────────────────────────
  const setFilters = useCallback((partial: Partial<FilterState>) => {
    setFiltersState((prev) => ({ ...prev, ...partial }));
  }, []);

  // ─── Create Content ───────────────────────────────────────────────────────────
  const createContent = useCallback(
    async (formData: FormData): Promise<ContentItem> => {
      if (!currentUser) throw new Error('Not authenticated');
      
      try {
        const response = await api.post('/content', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
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

  // ─── Update Content ───────────────────────────────────────────────────────────
  const updateContent = useCallback(
    (id: string, data: Partial<Pick<ContentItem, 'title' | 'body' | 'description' | 'image'>>) => {
      if (!currentUser) return;
      setContentList((prev) =>
        prev.map((item) => {
          if (item.id !== id) return item;
          if (item.status !== 'CHANGES_REQUESTED') {
            toast.error('Content can only be edited when changes are requested.');
            return item;
          }
          const now = new Date().toISOString();
          return {
            ...item,
            ...data,
            updatedAt: now,
            history: [
              ...item.history,
              {
                id: generateId(),
                action: 'EDITED' as const,
                actor: currentUser.name,
                role: currentUser.role,
                timestamp: now,
                comment: 'Content updated after change request',
              },
            ],
          };
        })
      );
    },
    [currentUser]
  );

  // ─── Submit Content ───────────────────────────────────────────────────────────
  const submitContent = useCallback(
    (id: string) => {
      if (!currentUser) return;
      setContentList((prev) =>
        prev.map((item) => {
          if (item.id !== id) return item;
          if (item.status !== 'DRAFT' && item.status !== 'CHANGES_REQUESTED') {
            toast.error('Only draft or rejected content can be submitted.');
            return item;
          }
          const now = new Date().toISOString();
          return {
            ...item,
            status: 'IN_REVIEW' as const,
            isLocked: true,
            updatedAt: now,
            history: [
              ...item.history,
              {
                id: generateId(),
                action: 'SUBMITTED' as const,
                actor: currentUser.name,
                role: currentUser.role,
                timestamp: now,
              },
            ],
          };
        })
      );
    },
    [currentUser]
  );

  // ─── Approve Content ──────────────────────────────────────────────────────────
  const approveContent = useCallback(
    (id: string, comment?: string) => {
      if (!currentUser) return;
      setContentList((prev) =>
        prev.map((item) => {
          if (item.id !== id) return item;

          if (item.status !== 'IN_REVIEW') {
            toast.error('Content must be in review to approve.');
            return item;
          }

          const now = new Date().toISOString();

          // Assuming an approval immediately moves it to APPROVED if there are no stages.
          // Or if there was a L1 and L2, but we removed stages.
          // We will just set it to APPROVED.
          return {
            ...item,
            status: 'APPROVED' as const,
            isLocked: true,
            updatedAt: now,
            history: [
              ...item.history,
              {
                id: generateId(),
                action: 'APPROVED' as const,
                actor: currentUser.name,
                role: currentUser.role,
                timestamp: now,
                comment,
              },
            ],
          };
        })
      );
    },
    [currentUser]
  );

  // ─── Reject Content ───────────────────────────────────────────────────────────
  const rejectContent = useCallback(
    (id: string, comment?: string) => {
      if (!currentUser) return;
      setContentList((prev) =>
        prev.map((item) => {
          if (item.id !== id) return item;
          if (item.status !== 'IN_REVIEW') {
            toast.error('Content must be in review to reject.');
            return item;
          }
          const now = new Date().toISOString();
          return {
            ...item,
            status: 'CHANGES_REQUESTED' as const,
            isLocked: false,
            updatedAt: now,
            history: [
              ...item.history,
              {
                id: generateId(),
                action: 'REJECTED' as const,
                actor: currentUser.name,
                role: currentUser.role,
                timestamp: now,
                comment,
              },
            ],
          };
        })
      );
    },
    [currentUser]
  );

  const value = useMemo<AppContextType>(
    () => ({
      currentUser,
      login,
      logout,
      contentList,
      createContent,
      updateContent,
      submitContent,
      approveContent,
      rejectContent,
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
      submitContent,
      approveContent,
      rejectContent,
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

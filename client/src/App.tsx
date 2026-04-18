import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppProvider } from './store/AppContext';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { ContentListPage } from './pages/ContentListPage';
import { ContentDetailPage } from './pages/ContentDetailPage';
import { CreateContentPage } from './pages/CreateContentPage';
import { EditContentPage } from './pages/EditContentPage';
import { ReviewerDashboard } from './pages/ReviewerDashboard';
import { useApp } from './store/AppContext';
import { focusManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';

// Explicitly handle window focus to ensure refetch when switching between apps
focusManager.setEventListener((onFocus) => {
  if (typeof window !== 'undefined' && window.addEventListener) {
    const handler = () => onFocus(true);
    window.addEventListener('focus', handler, false);
    window.addEventListener('visibilitychange', handler, false);

    return () => {
      window.removeEventListener('focus', handler);
      window.removeEventListener('visibilitychange', handler);
    };
  }
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0, // Always consider data stale to trigger refetch on focus
      refetchOnWindowFocus: true,
    },
  },
});

function RoleBasedHome() {
  const { currentUser } = useApp();
  if (!currentUser) return null;
  return currentUser.role === 'CREATOR' || currentUser.role === 'READER' ? <ContentListPage /> : <ReviewerDashboard />;
}

export default function App() {
  // Extra layer of insurance to guarantee refetch on app switch
  useEffect(() => {
    const handleFocus = () => {
      queryClient.invalidateQueries();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <BrowserRouter>
          <Routes>
            {/* Public route */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected routes with layout */}
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<RoleBasedHome />} />
              <Route path="/content/:id" element={<ContentDetailPage />} />
              <Route path="/sub-content/:id" element={<ContentDetailPage />} />
              <Route
                path="/create"
                element={
                  <ProtectedRoute allowedRoles={['CREATOR']}>
                    <CreateContentPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/edit/:id"
                element={
                  <ProtectedRoute allowedRoles={['CREATOR']}>
                    <EditContentPage />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>

        {/* Global toast for outside of Layout */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              borderRadius: '12px',
              background: '#1f2937',
              color: '#f9fafb',
              fontSize: '13px',
              fontWeight: '500',
            },
          }}
        />
      </AppProvider>
    </QueryClientProvider>
  );
}

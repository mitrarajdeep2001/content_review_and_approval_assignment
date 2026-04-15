import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import type { Role } from '../types';

export function useRequireAuth(allowedRoles?: Role[]) {
  const { currentUser } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      navigate('/login', { replace: true });
      return;
    }
    if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
      navigate('/', { replace: true });
    }
  }, [currentUser, allowedRoles, navigate]);

  return currentUser;
}

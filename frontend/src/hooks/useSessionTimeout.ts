import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '@/store';
import { logout } from '@/store/slices/authSlice';
import { isTokenExpiringSoon, validateSession } from '@/lib/auth';

interface UseSessionTimeoutOptions {
  warningTime?: number; // Minutes before showing warning
  enabled?: boolean;
}

export const useSessionTimeout = (options: UseSessionTimeoutOptions = {}) => {
  const { warningTime = 5, enabled = true } = options;
  const dispatch = useDispatch();
  const { isAuthenticated, tokens } = useSelector((state: RootState) => state.auth);

  const handleLogout = useCallback(() => {
    dispatch(logout());
  }, [dispatch]);

  const checkSession = useCallback(() => {
    if (!isAuthenticated || !enabled) return;

    // Validate current session
    if (!validateSession()) {
      return; // validateSession handles logout automatically
    }

    // Check if access token is expiring soon
    if (tokens?.access_token && isTokenExpiringSoon(tokens.access_token, warningTime)) {
      // The axios interceptor will handle token refresh automatically
      // We could show a warning here if needed
      console.log('Token expiring soon, will be refreshed automatically');
    }
  }, [isAuthenticated, tokens, warningTime, enabled]);

  useEffect(() => {
    if (!enabled || !isAuthenticated) return;

    // Check session immediately
    checkSession();

    // Set up periodic session checks
    const interval = setInterval(checkSession, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [checkSession, enabled, isAuthenticated]);

  return {
    handleLogout,
  };
};
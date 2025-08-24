import { jwtDecode } from 'jwt-decode';
import { handleSessionExpiry } from './axios';

interface JwtPayload {
  exp: number;
  iat: number;
  user_id: string;
  role: string;
}

/**
 * Checks if a JWT token is expired
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
  } catch {
    return true; // Consider invalid tokens as expired
  }
};

/**
 * Gets the expiration time of a JWT token
 */
export const getTokenExpiration = (token: string): number | null => {
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    return decoded.exp * 1000; // Convert to milliseconds
  } catch {
    return null;
  }
};

/**
 * Checks if token will expire within the specified minutes
 */
export const isTokenExpiringSoon = (token: string, minutesBeforeExpiry = 5): boolean => {
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    const currentTime = Date.now() / 1000;
    const expiryThreshold = currentTime + (minutesBeforeExpiry * 60);
    return decoded.exp < expiryThreshold;
  } catch {
    return true;
  }
};

/**
 * Validates the current session and handles expiry
 */
export const validateSession = (): boolean => {
  const accessToken = localStorage.getItem('access_token');
  const refreshToken = localStorage.getItem('refresh_token');

  if (!accessToken || !refreshToken) {
    handleSessionExpiry();
    return false;
  }

  if (isTokenExpired(accessToken) && isTokenExpired(refreshToken)) {
    handleSessionExpiry();
    return false;
  }

  return true;
};

/**
 * Sets up automatic session validation
 */
export const setupSessionMonitoring = (): () => void => {
  const checkInterval = 60000; // Check every minute
  
  const intervalId = setInterval(() => {
    const accessToken = localStorage.getItem('access_token');
    
    if (accessToken && isTokenExpired(accessToken)) {
      const refreshToken = localStorage.getItem('refresh_token');
      
      if (!refreshToken || isTokenExpired(refreshToken)) {
        handleSessionExpiry();
      }
      // If refresh token is valid, the axios interceptor will handle the refresh
    }
  }, checkInterval);

  // Return cleanup function
  return () => clearInterval(intervalId);
};
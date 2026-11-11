// Client-side auth utilities for frontend
import { User } from '@/types';
import { API_URL } from './config';
import { resetSocketSession } from '@/contexts/SocketContext';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

export const setAuthToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const removeAuthToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const setUser = (user: User): void => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getUser = (): User | null => {
  const userData = localStorage.getItem(USER_KEY);
  return userData ? JSON.parse(userData) : null;
};

export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};

// Ends the session everywhere: server cookie, stored token, live socket, and page state.
export const logout = async (redirectTo = '/auth/login'): Promise<void> => {
  try {
    await fetch(`${API_URL}/auth/logout`, { method: 'POST', credentials: 'include' });
  } catch {
    // Ignore network errors; local sign-out still happens below.
  }
  removeAuthToken();
  resetSocketSession();
  // Full reload clears in-memory state (notifications, cached user data).
  window.location.href = redirectTo;
};

export const getAuthHeaders = (): HeadersInit => {
  const token = getAuthToken();
  return token 
    ? { Authorization: `Bearer ${token}` }
    : {};
};

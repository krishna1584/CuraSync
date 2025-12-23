// Client-side auth utilities for frontend
import { User } from '@/types';

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

export const logout = (): void => {
  removeAuthToken();
  // Redirect to login or handle logout logic
  window.location.href = '/auth/login';
};

export const getAuthHeaders = (): HeadersInit => {
  const token = getAuthToken();
  return token 
    ? { Authorization: `Bearer ${token}` }
    : {};
};

export const generateId = (prefix: string, count: number): string => {
  return `${prefix}${String(count + 1).padStart(6, '0')}`;
};
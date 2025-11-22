import { getAuthHeaders } from './auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface FetchOptions extends RequestInit {
  headers?: HeadersInit;
}

export const apiCall = async (endpoint: string, options: FetchOptions = {}) => {
  const url = endpoint.startsWith('/api') 
    ? endpoint  // Use the endpoint as-is if it starts with /api (for Next.js rewrites)
    : `${API_BASE_URL}${endpoint}`;
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
  };

  const config: FetchOptions = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    return response;
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};

// Helper functions for common HTTP methods
export const apiGet = (endpoint: string, options: Omit<FetchOptions, 'method'> = {}) => 
  apiCall(endpoint, { ...options, method: 'GET' });

export const apiPost = (endpoint: string, data?: unknown, options: Omit<FetchOptions, 'method' | 'body'> = {}) => 
  apiCall(endpoint, { 
    ...options, 
    method: 'POST', 
    body: data ? JSON.stringify(data) : undefined 
  });

export const apiPut = (endpoint: string, data?: unknown, options: Omit<FetchOptions, 'method' | 'body'> = {}) => 
  apiCall(endpoint, { 
    ...options, 
    method: 'PUT', 
    body: data ? JSON.stringify(data) : undefined 
  });

export const apiDelete = (endpoint: string, options: Omit<FetchOptions, 'method'> = {}) => 
  apiCall(endpoint, { ...options, method: 'DELETE' });
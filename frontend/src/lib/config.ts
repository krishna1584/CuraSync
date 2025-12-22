// API Configuration
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
// Remove /api if it's already in the NEXT_PUBLIC_API_URL
export const API_URL = BASE_URL.endsWith('/api') ? BASE_URL : `${BASE_URL}/api`;
export const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || BASE_URL.replace('/api', '');

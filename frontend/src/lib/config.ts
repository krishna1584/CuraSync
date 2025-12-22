// API Configuration
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
export const API_URL = `${BASE_URL}/api`;
export const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

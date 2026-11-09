// The single place the frontend works out where the backend lives.
// NEXT_PUBLIC_API_URL may be given with or without a trailing /api.
const clean = (url: string) => url.trim().replace(/\/+$/, '');

const API_ORIGIN = clean(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/api$/i, '');

export const API_URL = `${API_ORIGIN}/api`;
export const SOCKET_URL = clean(process.env.NEXT_PUBLIC_SOCKET_URL || API_ORIGIN);

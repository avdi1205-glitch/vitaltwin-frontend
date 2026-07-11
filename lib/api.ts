const defaultBase =
  process.env.NODE_ENV === 'production'
    ? 'https://web-production-e9bdb.up.railway.app'
    : 'http://localhost:8000';

const base = (process.env.NEXT_PUBLIC_API_BASE_URL || defaultBase).replace(/\/$/, '');

export function apiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

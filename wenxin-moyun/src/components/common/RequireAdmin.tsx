import { Navigate } from 'react-router-dom';
import { getItem } from '../../utils/storageUtils';

function parseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

export default function RequireAdmin({ children }: { children: React.ReactNode }) {
  const token = getItem('access_token');
  if (!token) return <Navigate to="/login" replace />;

  const payload = parseJwtPayload(token);
  if (!payload || payload.is_superuser !== true) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

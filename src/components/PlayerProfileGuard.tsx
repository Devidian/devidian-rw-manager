import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import PlayerProfilePage from '@/pages/PlayerProfilePage';

export function PlayerProfileGuard() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  return isAuthenticated ? <PlayerProfilePage /> : <Navigate to="/auth/login" replace />;
}

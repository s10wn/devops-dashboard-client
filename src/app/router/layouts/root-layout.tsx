import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@shared/lib/stores/auth-store';

export const RootLayout = () => {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    const handleLogout = () => {
      logout();
      navigate('/login', { replace: true });
    };

    const handleRefreshNeeded = () => {
      // TODO: implement token refresh
      // For now, just logout
      handleLogout();
    };

    window.addEventListener('auth:logout', handleLogout);
    window.addEventListener('auth:refresh-needed', handleRefreshNeeded);

    return () => {
      window.removeEventListener('auth:logout', handleLogout);
      window.removeEventListener('auth:refresh-needed', handleRefreshNeeded);
    };
  }, [logout, navigate]);

  return <Outlet />;
};

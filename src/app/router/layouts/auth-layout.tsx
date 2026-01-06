import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '@shared/lib/stores/auth-store';

export const AuthLayout = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="auth-layout">
      <div className="auth-layout__container">
        <Outlet />
      </div>
    </div>
  );
}

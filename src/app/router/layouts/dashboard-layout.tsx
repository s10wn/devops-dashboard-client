import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '@shared/lib/stores/auth-store';
import { Sidebar } from '@widgets/sidebar';
import { Header } from '@widgets/header';

export const DashboardLayout = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard-layout__content">
        <Header />
        <main className="dashboard-layout__main">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

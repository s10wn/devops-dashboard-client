import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '@shared/lib/stores/auth-store';

export function DashboardLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="dashboard-layout">
      <aside className="dashboard-layout__sidebar">
        {/* Sidebar will be added later */}
      </aside>
      <main className="dashboard-layout__main">
        <Outlet />
      </main>
    </div>
  );
}

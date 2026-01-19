import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { RootLayout } from './layouts/root-layout';
import { AuthLayout } from './layouts/auth-layout';
import { DashboardLayout } from './layouts/dashboard-layout';

const DashboardPage = lazy(() =>
  import('@pages/dashboard/index.tsx').then((m) => ({ default: m.DashboardPage }))
);
const ProjectsPage = lazy(() =>
  import('@pages/projects/index.tsx').then((m) => ({ default: m.ProjectsPage }))
);
const ProjectPage = lazy(() =>
  import('@pages/projects/ui/project-page.tsx').then((m) => ({ default: m.ProjectPage }))
);
const PaymentsPage = lazy(() =>
  import('@pages/payments/index.tsx').then((m) => ({ default: m.PaymentsPage }))
);
const SettingsPage = lazy(() =>
  import('@pages/settings/index.tsx').then((m) => ({ default: m.SettingsPage }))
);
const KanbanPage = lazy(() =>
  import('@pages/kanban/index.tsx').then((m) => ({ default: m.KanbanPage }))
);
const LoginPage = lazy(() =>
  import('@pages/auth/login/index.tsx').then((m) => ({ default: m.LoginPage }))
);
const RegisterPage = lazy(() =>
  import('@pages/auth/register/index.tsx').then((m) => ({ default: m.RegisterPage }))
);

const PageLoader = () => <div className="page-loader">Loading...</div>;

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        element: <AuthLayout />,
        children: [
          {
            path: 'login',
            element: (
              <Suspense fallback={<PageLoader />}>
                <LoginPage />
              </Suspense>
            ),
          },
          {
            path: 'register',
            element: (
              <Suspense fallback={<PageLoader />}>
                <RegisterPage />
              </Suspense>
            ),
          },
        ],
      },
      {
        element: <DashboardLayout />,
        children: [
          {
            path: 'dashboard',
            element: (
              <Suspense fallback={<PageLoader />}>
                <DashboardPage />
              </Suspense>
            ),
          },
          {
            path: 'projects',
            element: (
              <Suspense fallback={<PageLoader />}>
                <ProjectsPage />
              </Suspense>
            ),
          },
          {
            path: 'projects/:id',
            element: (
              <Suspense fallback={<PageLoader />}>
                <ProjectPage />
              </Suspense>
            ),
          },
          {
            path: 'payments',
            element: (
              <Suspense fallback={<PageLoader />}>
                <PaymentsPage />
              </Suspense>
            ),
          },
          {
            path: 'settings',
            element: (
              <Suspense fallback={<PageLoader />}>
                <SettingsPage />
              </Suspense>
            ),
          },
          {
            path: 'kanban',
            element: (
              <Suspense fallback={<PageLoader />}>
                <KanbanPage />
              </Suspense>
            ),
          },
        ],
      },
    ],
  },
]);

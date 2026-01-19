import { StatsCards, ServerOverview, UpcomingPayments } from './ui';
import './dashboard.css';

export const DashboardPage = () => {
  return (
    <div className="dashboard">
      <div className="dashboard__header">
        <h1>Обзор</h1>
      </div>

      <StatsCards />

      <div className="dashboard__grid">
        <ServerOverview />
        <UpcomingPayments />
      </div>
    </div>
  );
};

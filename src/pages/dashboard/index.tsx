import { useTeamStore } from '@entities/team';
import { StatsCards, ServerOverview, UpcomingPayments } from './ui';
import './dashboard.css';

export const DashboardPage = () => {
  const currentTeam = useTeamStore((s) => s.currentTeam);

  if (!currentTeam) {
    return (
      <div className="dashboard">
        <h1>Обзор</h1>
        <p className="dashboard__empty">Выберите команду для просмотра статистики</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard__header">
        <h1>Обзор</h1>
        <p className="dashboard__subtitle">Команда: {currentTeam.name}</p>
      </div>

      <StatsCards />

      <div className="dashboard__grid">
        <ServerOverview />
        <UpcomingPayments />
      </div>
    </div>
  );
};

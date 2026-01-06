import { useQuery } from '@apollo/client/react';
import { useTeamStore } from '@entities/team';
import { Card, Skeleton } from '@shared/ui';
import { BILLING_SUMMARY_QUERY, TEAM_SERVERS_QUERY } from '../api';
import './stats-cards.css';

type Server = {
  id: string;
  status: string;
};

type BillingSummary = {
  totalMonthly: number;
  overdueCount: number;
  upcomingPaymentsCount: number;
};

type ServersData = {
  teamServers: Server[];
};

type BillingSummaryData = {
  billingSummary: BillingSummary;
};

export const StatsCards = () => {
  const currentTeam = useTeamStore((s) => s.currentTeam);

  const { data: serversData, loading: serversLoading } = useQuery<ServersData>(
    TEAM_SERVERS_QUERY,
    {
      variables: { teamId: currentTeam?.id },
      skip: !currentTeam?.id,
    }
  );

  const { data: billingData, loading: billingLoading } = useQuery<BillingSummaryData>(
    BILLING_SUMMARY_QUERY,
    {
      variables: { teamId: currentTeam?.id },
      skip: !currentTeam?.id,
    }
  );

  const servers = serversData?.teamServers || [];
  const onlineServers = servers.filter((s) => s.status === 'ONLINE').length;
  const billing = billingData?.billingSummary;

  const stats = [
    {
      label: 'Серверов онлайн',
      value: `${onlineServers}/${servers.length}`,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="3" width="18" height="7" rx="2" />
          <rect x="3" y="14" width="18" height="7" rx="2" />
          <circle cx="7" cy="6.5" r="1" fill="currentColor" />
          <circle cx="7" cy="17.5" r="1" fill="currentColor" />
        </svg>
      ),
      color: 'success',
    },
    {
      label: 'Ежемесячно',
      value: billing ? `${billing.totalMonthly.toLocaleString()} ₽` : '0 ₽',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <path d="M2 10h20" />
        </svg>
      ),
      color: 'info',
    },
    {
      label: 'Предстоящих платежей',
      value: billing?.upcomingPaymentsCount || 0,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M3 10h18" />
          <path d="M8 2v4M16 2v4" />
        </svg>
      ),
      color: 'warning',
    },
    {
      label: 'Просрочено',
      value: billing?.overdueCount || 0,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      ),
      color: 'error',
    },
  ];

  const loading = serversLoading || billingLoading;

  return (
    <div className="stats-cards">
      {stats.map((stat, i) => (
        <Card key={i} className="stats-card">
          {loading ? (
            <>
              <Skeleton width={40} height={40} variant="rectangular" />
              <div className="stats-card__content">
                <Skeleton width={80} height={14} />
                <Skeleton width={60} height={24} />
              </div>
            </>
          ) : (
            <>
              <div className={`stats-card__icon stats-card__icon--${stat.color}`}>
                {stat.icon}
              </div>
              <div className="stats-card__content">
                <span className="stats-card__label">{stat.label}</span>
                <span className="stats-card__value">{stat.value}</span>
              </div>
            </>
          )}
        </Card>
      ))}
    </div>
  );
};

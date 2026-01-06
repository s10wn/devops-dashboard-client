import { useQuery } from '@apollo/client/react';
import { useTeamStore } from '@entities/team';
import { Card, CardHeader, CardBody, Badge, Skeleton } from '@shared/ui';
import { TEAM_SERVERS_QUERY } from '../api';
import './server-overview.css';

type Server = {
  id: string;
  name: string;
  host: string;
  status: string;
  lastCheckAt: string;
};

type ServersData = {
  teamServers: Server[];
};

const statusMap: Record<string, { variant: 'success' | 'error' | 'warning' | 'default'; label: string }> = {
  ONLINE: { variant: 'success', label: 'Онлайн' },
  OFFLINE: { variant: 'error', label: 'Офлайн' },
  DEGRADED: { variant: 'warning', label: 'Проблемы' },
  UNKNOWN: { variant: 'default', label: 'Неизвестно' },
};

export const ServerOverview = () => {
  const currentTeam = useTeamStore((s) => s.currentTeam);

  const { data, loading } = useQuery<ServersData>(TEAM_SERVERS_QUERY, {
    variables: { teamId: currentTeam?.id },
    skip: !currentTeam?.id,
  });

  const servers = data?.teamServers || [];

  return (
    <Card padding="none">
      <CardHeader>
        <h3>Серверы</h3>
      </CardHeader>
      <CardBody>
        {loading ? (
          <div className="server-overview__loading">
            {[1, 2, 3].map((i) => (
              <div key={i} className="server-overview__item">
                <Skeleton width={120} height={16} />
                <Skeleton width={80} height={20} />
              </div>
            ))}
          </div>
        ) : servers.length === 0 ? (
          <div className="server-overview__empty">Нет серверов</div>
        ) : (
          <div className="server-overview__list">
            {servers.slice(0, 5).map((server) => {
              const status = statusMap[server.status] || statusMap.UNKNOWN;
              return (
                <div key={server.id} className="server-overview__item">
                  <div className="server-overview__info">
                    <span className="server-overview__name">{server.name}</span>
                    <span className="server-overview__host">{server.host}</span>
                  </div>
                  <Badge variant={status.variant} dot>
                    {status.label}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardBody>
    </Card>
  );
};

import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import {
  SERVERS_QUERY,
  DELETE_SERVER_MUTATION,
  TOGGLE_SERVER_MUTATION,
} from '@entities/server';
import {
  Card,
  CardBody,
  Button,
  Badge,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
  Skeleton,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@shared/ui';
import { ServerStatus } from '@shared/types/enums';
import { CreateServerModal } from './ui/create-server-modal';
import { ServerDetailModal } from './ui/server-detail-modal';
import './servers.css';

type ViewMode = 'table' | 'grid';

type AgentMetrics = {
  cpuUsage: number;
  memoryUsage: number;
  processCount: number;
  onlineProcessCount: number;
};

type Server = {
  id: string;
  name: string;
  host: string;
  port: number;
  checkType: string;
  status: ServerStatus;
  lastCheckAt?: string;
  uptimePercentage?: number;
  isActive: boolean;
  agentConnected?: boolean;
  agentMetrics?: AgentMetrics | null;
  provider?: string;
  monthlyPrice?: number;
};

type ServersData = {
  servers: Server[];
};

export const ServersPage = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [serverToDelete, setServerToDelete] = useState<Server | null>(null);

  const { data, loading, refetch } = useQuery<ServersData>(SERVERS_QUERY);

  const [deleteServer, { loading: deleting }] = useMutation(DELETE_SERVER_MUTATION, {
    onCompleted: () => {
      setServerToDelete(null);
      refetch();
    },
  });

  const [toggleServer] = useMutation(TOGGLE_SERVER_MUTATION, {
    onCompleted: () => refetch(),
  });

  const servers = data?.servers || [];

  const handleDeleteServer = () => {
    if (serverToDelete) {
      deleteServer({ variables: { serverId: serverToDelete.id } });
    }
  };

  const handleToggleServer = (server: Server) => {
    toggleServer({
      variables: { serverId: server.id, isActive: !server.isActive },
    });
  };

  const formatLastCheck = (date?: string) => {
    if (!date) return 'Нет данных';
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Только что';
    if (minutes < 60) return `${minutes} мин. назад`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)} ч. назад`;
    return d.toLocaleDateString('ru-RU');
  };

  const getStatusLabel = (status: ServerStatus) => {
    const labels: Record<ServerStatus, string> = {
      [ServerStatus.ONLINE]: 'Онлайн',
      [ServerStatus.OFFLINE]: 'Офлайн',
      [ServerStatus.DEGRADED]: 'Деградация',
      [ServerStatus.UNKNOWN]: 'Неизвестно',
    };
    return labels[status];
  };

  const getStatusVariant = (status: ServerStatus): 'success' | 'error' | 'warning' | 'default' => {
    const variants: Record<ServerStatus, 'success' | 'error' | 'warning' | 'default'> = {
      [ServerStatus.ONLINE]: 'success',
      [ServerStatus.OFFLINE]: 'error',
      [ServerStatus.DEGRADED]: 'warning',
      [ServerStatus.UNKNOWN]: 'default',
    };
    return variants[status];
  };

  return (
    <div className="servers">
      <div className="servers__header">
        <div className="servers__title">
          <h1>Серверы</h1>
          <span className="servers__subtitle">
            {servers.length > 0
              ? `${servers.length} ${servers.length === 1 ? 'сервер' : 'серверов'}`
              : 'Нет серверов'}
          </span>
        </div>

        <div className="servers__actions">
          <div className="servers__view-toggle">
            <button
              type="button"
              className={`servers__view-btn ${viewMode === 'grid' ? 'servers__view-btn--active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Карточки"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="2" width="5" height="5" rx="1" />
                <rect x="11" y="2" width="5" height="5" rx="1" />
                <rect x="2" y="11" width="5" height="5" rx="1" />
                <rect x="11" y="11" width="5" height="5" rx="1" />
              </svg>
            </button>
            <button
              type="button"
              className={`servers__view-btn ${viewMode === 'table' ? 'servers__view-btn--active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Таблица"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="3" width="14" height="3" rx="1" />
                <rect x="2" y="8" width="14" height="3" rx="1" />
                <rect x="2" y="13" width="14" height="3" rx="1" />
              </svg>
            </button>
          </div>

          <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
            + Добавить сервер
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="servers__grid">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} width="100%" height={180} variant="rectangular" />
          ))}
        </div>
      ) : servers.length === 0 ? (
        <Card>
          <CardBody>
            <div className="servers__empty">
              <p>Нет серверов</p>
              <Button variant="primary" onClick={() => setIsCreateModalOpen(true)} style={{ marginTop: 'var(--space-md)' }}>
                Добавить первый сервер
              </Button>
            </div>
          </CardBody>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="servers__grid">
          {servers.map((server) => (
            <div
              key={server.id}
              className="server-card"
              onClick={() => setSelectedServer(server)}
            >
              <div className="server-card__header">
                <div>
                  <div className="server-card__name">{server.name}</div>
                  <div className="server-card__host">{server.host}:{server.port}</div>
                </div>
                <span className={`server-card__status server-card__status--${server.status.toLowerCase()}`}>
                  <span className="server-card__status-dot" />
                  {getStatusLabel(server.status)}
                </span>
              </div>

              {server.agentConnected && server.agentMetrics && (
                <div className="server-card__metrics">
                  <div className="server-card__metric">
                    <span className="server-card__metric-label">CPU</span>
                    <span className="server-card__metric-value">{server.agentMetrics.cpuUsage.toFixed(1)}%</span>
                  </div>
                  <div className="server-card__metric">
                    <span className="server-card__metric-label">RAM</span>
                    <span className="server-card__metric-value">{server.agentMetrics.memoryUsage.toFixed(1)}%</span>
                  </div>
                  <div className="server-card__metric">
                    <span className="server-card__metric-label">Процессы</span>
                    <span className="server-card__metric-value">
                      {server.agentMetrics.onlineProcessCount}/{server.agentMetrics.processCount}
                    </span>
                  </div>
                </div>
              )}

              <div className="server-card__info">
                <div className="server-card__info-item">
                  <span>{server.provider || server.checkType}</span>
                </div>
                <div className="server-card__info-item">
                  <span>{server.agentConnected ? 'Агент' : server.isActive ? 'Активен' : 'Отключен'}</span>
                </div>
                {server.monthlyPrice && (
                  <div className="server-card__info-item">
                    <span>${server.monthlyPrice}/мес</span>
                  </div>
                )}
              </div>

              <div className="server-card__footer">
                <span>{formatLastCheck(server.lastCheckAt)}</span>
                <div className="server-card__uptime">
                  <span>{server.uptimePercentage?.toFixed(1) || 0}%</span>
                  <div className="server-card__uptime-bar">
                    <div
                      className="server-card__uptime-fill"
                      style={{ width: `${server.uptimePercentage || 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <div className="servers__table-wrap">
            <Table className="servers__table">
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Название</TableHeaderCell>
                  <TableHeaderCell>Хост</TableHeaderCell>
                  <TableHeaderCell>Статус</TableHeaderCell>
                  <TableHeaderCell>CPU</TableHeaderCell>
                  <TableHeaderCell>RAM</TableHeaderCell>
                  <TableHeaderCell>Процессы</TableHeaderCell>
                  <TableHeaderCell>Uptime</TableHeaderCell>
                  <TableHeaderCell></TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {servers.map((server) => (
                  <TableRow key={server.id} onClick={() => setSelectedServer(server)}>
                    <TableCell>
                      <strong>{server.name}</strong>
                    </TableCell>
                    <TableCell>
                      <code>{server.host}:{server.port}</code>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(server.status)}>
                        {getStatusLabel(server.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {server.agentMetrics ? `${server.agentMetrics.cpuUsage.toFixed(1)}%` : '-'}
                    </TableCell>
                    <TableCell>
                      {server.agentMetrics ? `${server.agentMetrics.memoryUsage.toFixed(1)}%` : '-'}
                    </TableCell>
                    <TableCell>
                      {server.agentMetrics
                        ? `${server.agentMetrics.onlineProcessCount}/${server.agentMetrics.processCount}`
                        : '-'}
                    </TableCell>
                    <TableCell>{server.uptimePercentage?.toFixed(1) || 0}%</TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" onClick={(e) => {
                        e.stopPropagation();
                        setSelectedServer(server);
                      }}>
                        ...
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      <CreateServerModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          refetch();
        }}
      />

      {selectedServer && (
        <ServerDetailModal
          server={selectedServer}
          onClose={() => setSelectedServer(null)}
          onDelete={() => {
            setServerToDelete(selectedServer);
            setSelectedServer(null);
          }}
          onToggle={() => handleToggleServer(selectedServer)}
          onUpdate={() => refetch()}
        />
      )}

      <Modal isOpen={!!serverToDelete} onClose={() => setServerToDelete(null)} size="sm">
        <ModalHeader onClose={() => setServerToDelete(null)}>Удалить сервер?</ModalHeader>
        <ModalBody>
          <p>
            Вы уверены, что хотите удалить сервер <strong>{serverToDelete?.name}</strong>?
            Это действие нельзя отменить.
          </p>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setServerToDelete(null)}>
            Отмена
          </Button>
          <Button variant="danger" onClick={handleDeleteServer} loading={deleting}>
            Удалить
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

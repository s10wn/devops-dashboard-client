import { useState, useEffect } from 'react';
import { useQuery, useMutation, useSubscription } from '@apollo/client/react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  SERVER_QUERY,
  SERVER_UPTIME_STATS_QUERY,
  SERVER_CHECKS_QUERY,
  UPDATE_SERVER_MUTATION,
  REGENERATE_AGENT_TOKEN_MUTATION,
  REQUEST_SERVER_PROCESSES_MUTATION,
  REQUEST_SERVER_LOGS_MUTATION,
  RESTART_PROCESS_MUTATION,
  STOP_PROCESS_MUTATION,
  START_PROCESS_MUTATION,
  SERVER_PROCESSES_SUBSCRIPTION,
  SERVER_LOGS_HISTORY_SUBSCRIPTION,
  NEW_SERVER_LOG_SUBSCRIPTION,
  COMMAND_RESULT_SUBSCRIPTION,
} from '@entities/server';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Button,
  Badge,
  Card,
  CardBody,
  Skeleton,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from '@shared/ui';
import { ServerStatus } from '@shared/types/enums';

type Tab = 'overview' | 'processes' | 'checks' | 'logs' | 'agent';

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
};

type ServerDetailData = {
  server: {
    id: string;
    name: string;
    host: string;
    port: number;
    checkType: string;
    httpPath?: string;
    checkInterval: number;
    status: ServerStatus;
    lastCheckAt?: string;
    lastOnlineAt?: string;
    agentToken?: string;
    agentConnected: boolean;
    isActive: boolean;
    teamId: string;
    projectId?: string;
    uptimePercentage?: number;
    provider?: string;
    monthlyPrice?: number;
  };
};

type UptimeStatsData = {
  serverUptimeStats: {
    uptimePercentage: number;
    totalChecks: number;
    successfulChecks: number;
    averageResponseTime: number;
    downtime: number;
  };
};

type ServerCheck = {
  id: string;
  checkedAt: string;
  status: ServerStatus;
  responseTime?: number;
  statusCode?: number;
  errorMessage?: string;
};

type ServerChecksData = {
  serverChecks: ServerCheck[];
};

// Real-time structured logs from newServerLog subscription
type RealtimeLog = {
  id: string;
  timestamp: string;
  level: string;
  message: string;
  source?: string;
  serverId: string;
};

type NewServerLogData = {
  newServerLog: RealtimeLog;
};

// PM2 logs history (plain text strings)
type ServerLogsHistoryData = {
  serverLogsHistory: {
    serverId: string;
    logs: string[];
  };
};

type PM2Process = {
  pm_id: number;
  name: string;
  pid: number;
  pm2_env: {
    status: string;
    pm_uptime: number;
    restart_time: number;
  };
  monit: {
    cpu: number;
    memory: number;
  };
};

type ServerProcessesData = {
  serverProcesses: {
    serverId: string;
    processes: PM2Process[];
  };
};

type CommandResultData = {
  commandResult: {
    serverId: string;
    success: boolean;
    command: string;
    processId?: number;
    output?: string;
    error?: string;
  };
};

const updateServerSchema = yup.object({
  name: yup.string().min(2, 'Минимум 2 символа').required('Обязательное поле'),
  host: yup.string().required('Обязательное поле'),
  port: yup
    .number()
    .min(1, 'Порт от 1 до 65535')
    .max(65535, 'Порт от 1 до 65535')
    .required('Обязательное поле'),
  checkType: yup
    .string()
    .oneOf(['PING', 'TCP', 'HTTP'] as const)
    .required('Выберите тип проверки'),
  httpPath: yup.string().optional(),
  checkInterval: yup
    .number()
    .min(30, 'Минимум 30 секунд')
    .max(3600, 'Максимум 3600 секунд')
    .required('Обязательное поле'),
  provider: yup.string().optional(),
  monthlyPrice: yup
    .number()
    .min(0, 'Цена не может быть отрицательной')
    .optional()
    .nullable()
    .transform((value, original) => (original === '' ? null : value)),
});

type UpdateServerFormData = yup.InferType<typeof updateServerSchema>;

type ServerDetailModalProps = {
  server: Server;
  onClose: () => void;
  onDelete: () => void;
  onToggle: () => void;
  onUpdate: () => void;
};

export const ServerDetailModal = ({
  server,
  onClose,
  onDelete,
  onToggle,
  onUpdate,
}: ServerDetailModalProps) => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [tokenCopied, setTokenCopied] = useState(false);
  const [processes, setProcesses] = useState<PM2Process[]>([]);
  const [pm2Logs, setPm2Logs] = useState<string[]>([]);
  const [realtimeLogs, setRealtimeLogs] = useState<RealtimeLog[]>([]);
  const [logsView, setLogsView] = useState<'realtime' | 'pm2'>('realtime');
  const [selectedProcessId, setSelectedProcessId] = useState<number | null>(null);
  const [commandMessage, setCommandMessage] = useState<string | null>(null);

  const { data, loading, refetch } = useQuery<ServerDetailData>(SERVER_QUERY, {
    variables: { id: server.id },
  });

  const { data: statsData } = useQuery<UptimeStatsData>(SERVER_UPTIME_STATS_QUERY, {
    variables: { serverId: server.id, period: '7d' },
  });

  const { data: checksData, loading: checksLoading } = useQuery<ServerChecksData>(
    SERVER_CHECKS_QUERY,
    {
      variables: { serverId: server.id, limit: 50 },
      skip: activeTab !== 'checks',
    }
  );

  // Subscription for PM2 logs history
  const { data: logsHistoryData } = useSubscription<ServerLogsHistoryData>(
    SERVER_LOGS_HISTORY_SUBSCRIPTION,
    {
      variables: { serverId: server.id },
      skip: activeTab !== 'logs' || logsView !== 'pm2',
    }
  );

  // Subscription for real-time logs
  const { data: newLogData } = useSubscription<NewServerLogData>(
    NEW_SERVER_LOG_SUBSCRIPTION,
    {
      variables: { serverId: server.id },
      skip: activeTab !== 'logs' || logsView !== 'realtime',
    }
  );

  // Subscriptions for processes tab
  const { data: processesSubData } = useSubscription<ServerProcessesData>(
    SERVER_PROCESSES_SUBSCRIPTION,
    {
      variables: { serverId: server.id },
      skip: activeTab !== 'processes',
    }
  );

  const { data: commandResultData } = useSubscription<CommandResultData>(
    COMMAND_RESULT_SUBSCRIPTION,
    {
      variables: { serverId: server.id },
      skip: activeTab !== 'processes',
    }
  );

  // Update processes when subscription data arrives
  useEffect(() => {
    if (processesSubData?.serverProcesses?.processes) {
      setProcesses(processesSubData.serverProcesses.processes);
    }
  }, [processesSubData]);

  // Update PM2 logs when subscription data arrives
  useEffect(() => {
    if (logsHistoryData?.serverLogsHistory?.logs) {
      setPm2Logs(logsHistoryData.serverLogsHistory.logs);
    }
  }, [logsHistoryData]);

  // Append new real-time log when subscription receives data
  useEffect(() => {
    if (newLogData?.newServerLog) {
      setRealtimeLogs((prev) => [...prev.slice(-99), newLogData.newServerLog]);
    }
  }, [newLogData]);

  // Show command result message
  useEffect(() => {
    if (commandResultData?.commandResult) {
      const result = commandResultData.commandResult;
      if (result.success) {
        setCommandMessage(`✓ ${result.command} выполнена успешно`);
      } else {
        setCommandMessage(`✗ Ошибка: ${result.error}`);
      }
      setTimeout(() => setCommandMessage(null), 3000);
    }
  }, [commandResultData]);

  const serverDetail = data?.server;
  const stats = statsData?.serverUptimeStats;
  const checks = checksData?.serverChecks || [];

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<UpdateServerFormData>({
    resolver: yupResolver(updateServerSchema) as never,
    values: serverDetail
      ? {
          name: serverDetail.name,
          host: serverDetail.host,
          port: serverDetail.port,
          checkType: serverDetail.checkType as 'PING' | 'TCP' | 'HTTP',
          httpPath: serverDetail.httpPath || '',
          checkInterval: serverDetail.checkInterval,
          provider: serverDetail.provider || '',
          monthlyPrice: serverDetail.monthlyPrice || null,
        }
      : undefined,
  });

  const checkType = watch('checkType');

  const [updateServer, { loading: updating }] = useMutation(UPDATE_SERVER_MUTATION, {
    onCompleted: () => {
      setIsEditing(false);
      onUpdate();
    },
  });

  const [regenerateToken, { loading: regenerating }] = useMutation(
    REGENERATE_AGENT_TOKEN_MUTATION,
    {
      onCompleted: () => {
        refetch();
      },
    }
  );

  const [requestProcesses, { loading: requestingProcesses }] = useMutation(
    REQUEST_SERVER_PROCESSES_MUTATION
  );

  const [requestLogs, { loading: requestingLogs }] = useMutation(REQUEST_SERVER_LOGS_MUTATION);

  const [restartProcess] = useMutation(RESTART_PROCESS_MUTATION);
  const [stopProcess] = useMutation(STOP_PROCESS_MUTATION);
  const [startProcess] = useMutation(START_PROCESS_MUTATION);

  // Auto-request processes when switching to processes tab
  useEffect(() => {
    if (activeTab === 'processes' && serverDetail?.agentConnected) {
      requestProcesses({ variables: { serverId: server.id } });
    }
  }, [activeTab, serverDetail?.agentConnected, server.id, requestProcesses]);

  // Auto-request PM2 logs when switching to pm2 view or changing process
  useEffect(() => {
    if (activeTab === 'logs' && logsView === 'pm2' && serverDetail?.agentConnected) {
      // Also request processes list if not loaded
      if (processes.length === 0) {
        requestProcesses({ variables: { serverId: server.id } });
      }
      // Clear old logs before requesting new ones
      setPm2Logs([]);
      const variables: { serverId: string; lines: number; processId?: number } = {
        serverId: server.id,
        lines: 100,
      };
      if (selectedProcessId !== null) {
        variables.processId = selectedProcessId;
      }
      requestLogs({ variables });
    }
  }, [activeTab, logsView, selectedProcessId, serverDetail?.agentConnected, server.id, requestLogs, processes.length, requestProcesses]);

  const onSubmit = (formData: UpdateServerFormData) => {
    updateServer({
      variables: {
        input: {
          serverId: server.id,
          name: formData.name,
          host: formData.host,
          port: formData.port,
          checkType: formData.checkType,
          checkInterval: formData.checkInterval,
          httpPath: formData.checkType === 'HTTP' ? formData.httpPath : undefined,
          provider: formData.provider || undefined,
          monthlyPrice: formData.monthlyPrice || undefined,
        },
      },
    });
  };

  const handleCopyToken = () => {
    if (serverDetail?.agentToken) {
      navigator.clipboard.writeText(serverDetail.agentToken);
      setTokenCopied(true);
      setTimeout(() => setTokenCopied(false), 2000);
    }
  };

  const handleRegenerateToken = () => {
    if (confirm('Старый токен перестанет работать. Продолжить?')) {
      regenerateToken({ variables: { serverId: server.id } });
    }
  };

  const handleRequestProcesses = () => {
    requestProcesses({ variables: { serverId: server.id } });
  };

  const handleRequestLogs = (processId?: number | null) => {
    const variables: { serverId: string; lines: number; processId?: number } = {
      serverId: server.id,
      lines: 100,
    };
    if (processId !== null && processId !== undefined) {
      variables.processId = processId;
    }
    requestLogs({ variables });
  };

  const handleRestartProcess = (processId: number) => {
    restartProcess({ variables: { serverId: server.id, processId } });
  };

  const handleStopProcess = (processId: number) => {
    stopProcess({ variables: { serverId: server.id, processId } });
  };

  const handleStartProcess = (processId: number) => {
    startProcess({ variables: { serverId: server.id, processId } });
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

  const getLogLevelVariant = (level: string): 'success' | 'error' | 'warning' | 'default' => {
    switch (level.toLowerCase()) {
      case 'info':
        return 'success';
      case 'warn':
      case 'warning':
        return 'warning';
      case 'error':
      case 'fatal':
        return 'error';
      default:
        return 'default';
    }
  };

  const getProcessStatusVariant = (status: string): 'success' | 'error' | 'warning' | 'default' => {
    switch (status) {
      case 'online':
        return 'success';
      case 'stopped':
      case 'errored':
        return 'error';
      case 'launching':
      case 'stopping':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatDate = (date?: string) => {
    if (!date) return 'Нет данных';
    return new Date(date).toLocaleString('ru-RU');
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatMemory = (bytes: number) => {
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  const formatUptime = (uptime: number) => {
    const now = Date.now();
    const diff = now - uptime;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m`;
    return `${seconds}s`;
  };

  if (loading || !serverDetail) {
    return (
      <Modal isOpen onClose={onClose} size="lg">
        <ModalHeader onClose={onClose}>{server.name}</ModalHeader>
        <ModalBody>
          <Skeleton width="100%" height={300} variant="rectangular" />
        </ModalBody>
      </Modal>
    );
  }

  return (
    <Modal isOpen onClose={onClose} size="lg">
      <ModalHeader onClose={onClose}>{serverDetail.name}</ModalHeader>

      {isEditing ? (
        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Input label="Название" error={errors.name?.message} {...register('name')} />

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                <Input label="Хост" error={errors.host?.message} {...register('host')} />
                <Input
                  label="Порт"
                  type="number"
                  error={errors.port?.message}
                  {...register('port', { valueAsNumber: true })}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: 500,
                    fontSize: '0.875rem',
                  }}
                >
                  Тип проверки
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {(['HTTP', 'TCP', 'PING'] as const).map((type) => (
                    <label
                      key={type}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0.5rem',
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        background: checkType === type ? 'var(--bg-tertiary)' : 'transparent',
                      }}
                    >
                      <input
                        type="radio"
                        value={type}
                        {...register('checkType')}
                        style={{ display: 'none' }}
                      />
                      {type}
                    </label>
                  ))}
                </div>
              </div>

              {checkType === 'HTTP' && (
                <Input
                  label="HTTP путь"
                  error={errors.httpPath?.message}
                  {...register('httpPath')}
                />
              )}

              <Input
                label="Интервал проверки (сек)"
                type="number"
                error={errors.checkInterval?.message}
                {...register('checkInterval', { valueAsNumber: true })}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Input
                  label="Провайдер"
                  placeholder="Hetzner, DO, AWS..."
                  error={errors.provider?.message}
                  {...register('provider')}
                />
                <Input
                  label="Цена в месяц ($)"
                  type="number"
                  step="0.01"
                  placeholder="29.99"
                  error={errors.monthlyPrice?.message}
                  {...register('monthlyPrice', { valueAsNumber: true })}
                />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="secondary" onClick={() => setIsEditing(false)}>
              Отмена
            </Button>
            <Button type="submit" variant="primary" loading={updating}>
              Сохранить
            </Button>
          </ModalFooter>
        </form>
      ) : (
        <ModalBody>
          <div className="server-detail">
            {/* Tabs */}
            <div className="server-detail__tabs">
              <button
                type="button"
                className={`server-detail__tab ${activeTab === 'overview' ? 'server-detail__tab--active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                Обзор
              </button>
              <button
                type="button"
                className={`server-detail__tab ${activeTab === 'processes' ? 'server-detail__tab--active' : ''}`}
                onClick={() => setActiveTab('processes')}
              >
                Процессы
              </button>
              <button
                type="button"
                className={`server-detail__tab ${activeTab === 'checks' ? 'server-detail__tab--active' : ''}`}
                onClick={() => setActiveTab('checks')}
              >
                История
              </button>
              <button
                type="button"
                className={`server-detail__tab ${activeTab === 'logs' ? 'server-detail__tab--active' : ''}`}
                onClick={() => setActiveTab('logs')}
              >
                Логи
              </button>
              <button
                type="button"
                className={`server-detail__tab ${activeTab === 'agent' ? 'server-detail__tab--active' : ''}`}
                onClick={() => setActiveTab('agent')}
              >
                Агент
              </button>
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <>
                <div className="server-detail__header">
                  <div className="server-detail__status">
                    <Badge variant={getStatusVariant(serverDetail.status)}>
                      {getStatusLabel(serverDetail.status)}
                    </Badge>
                    {!serverDetail.isActive && <Badge variant="default">Отключен</Badge>}
                    {serverDetail.agentConnected && (
                      <Badge variant="success">Агент подключен</Badge>
                    )}
                  </div>
                </div>

                <div className="server-detail__info">
                  <div className="server-detail__info-item">
                    <span className="server-detail__info-label">Хост</span>
                    <span className="server-detail__info-value">
                      {serverDetail.host}:{serverDetail.port}
                    </span>
                  </div>
                  <div className="server-detail__info-item">
                    <span className="server-detail__info-label">Тип проверки</span>
                    <span className="server-detail__info-value">{serverDetail.checkType}</span>
                  </div>
                  {serverDetail.httpPath && (
                    <div className="server-detail__info-item">
                      <span className="server-detail__info-label">HTTP путь</span>
                      <span className="server-detail__info-value">{serverDetail.httpPath}</span>
                    </div>
                  )}
                  <div className="server-detail__info-item">
                    <span className="server-detail__info-label">Интервал</span>
                    <span className="server-detail__info-value">
                      {serverDetail.checkInterval} сек
                    </span>
                  </div>
                  <div className="server-detail__info-item">
                    <span className="server-detail__info-label">Последняя проверка</span>
                    <span className="server-detail__info-value">
                      {formatDate(serverDetail.lastCheckAt)}
                    </span>
                  </div>
                  <div className="server-detail__info-item">
                    <span className="server-detail__info-label">Последний онлайн</span>
                    <span className="server-detail__info-value">
                      {formatDate(serverDetail.lastOnlineAt)}
                    </span>
                  </div>
                  {serverDetail.provider && (
                    <div className="server-detail__info-item">
                      <span className="server-detail__info-label">Провайдер</span>
                      <span className="server-detail__info-value">{serverDetail.provider}</span>
                    </div>
                  )}
                  {serverDetail.monthlyPrice && (
                    <div className="server-detail__info-item">
                      <span className="server-detail__info-label">Цена</span>
                      <span className="server-detail__info-value">${serverDetail.monthlyPrice}/мес</span>
                    </div>
                  )}
                </div>

                {stats && (
                  <Card>
                    <CardBody>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-tertiary)',
                          marginBottom: 'var(--space-sm)',
                        }}
                      >
                        Статистика за 7 дней
                      </div>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(4, 1fr)',
                          gap: 'var(--space-md)',
                          textAlign: 'center',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--success)' }}>
                            {stats.uptimePercentage.toFixed(1)}%
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            Uptime
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{stats.totalChecks}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            Проверок
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>
                            {stats.averageResponseTime}ms
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            Ср. отклик
                          </div>
                        </div>
                        <div>
                          <div
                            style={{
                              fontSize: '1.5rem',
                              fontWeight: 600,
                              color: stats.downtime > 0 ? 'var(--error)' : 'var(--text-primary)',
                            }}
                          >
                            {Math.floor(stats.downtime / 60)}м
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            Downtime
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                )}

                <div className="server-detail__actions">
                  <Button variant="secondary" onClick={() => setIsEditing(true)}>
                    Редактировать
                  </Button>
                  <Button variant="secondary" onClick={onToggle}>
                    {serverDetail.isActive ? 'Отключить' : 'Включить'}
                  </Button>
                  <Button variant="danger" onClick={onDelete}>
                    Удалить
                  </Button>
                </div>
              </>
            )}

            {/* Processes Tab (PM2) */}
            {activeTab === 'processes' && (
              <div className="server-detail__processes">
                {!serverDetail.agentConnected ? (
                  <div className="server-detail__empty">
                    <p>Агент не подключен</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 'var(--space-sm)' }}>
                      Подключите агент для управления процессами
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="server-detail__processes-header">
                      <Button
                        variant="primary"
                        onClick={handleRequestProcesses}
                        loading={requestingProcesses}
                      >
                        Обновить список процессов
                      </Button>
                      {commandMessage && (
                        <span
                          className={`server-detail__command-message ${commandMessage.startsWith('✓') ? 'server-detail__command-message--success' : 'server-detail__command-message--error'}`}
                        >
                          {commandMessage}
                        </span>
                      )}
                    </div>

                    {processes.length === 0 ? (
                      <div className="server-detail__empty">
                        <p>Нет данных о процессах</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 'var(--space-sm)' }}>
                          Нажмите «Обновить список процессов» для получения данных
                        </p>
                      </div>
                    ) : (
                      <div style={{ maxHeight: '350px', overflow: 'auto' }}>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableHeaderCell>ID</TableHeaderCell>
                              <TableHeaderCell>Название</TableHeaderCell>
                              <TableHeaderCell>PID</TableHeaderCell>
                              <TableHeaderCell>Статус</TableHeaderCell>
                              <TableHeaderCell>CPU</TableHeaderCell>
                              <TableHeaderCell>Память</TableHeaderCell>
                              <TableHeaderCell>Uptime</TableHeaderCell>
                              <TableHeaderCell>Рестарты</TableHeaderCell>
                              <TableHeaderCell>Действия</TableHeaderCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {processes.map((proc) => (
                              <TableRow key={proc.pm_id}>
                                <TableCell>{proc.pm_id}</TableCell>
                                <TableCell>
                                  <strong>{proc.name}</strong>
                                </TableCell>
                                <TableCell>{proc.pid}</TableCell>
                                <TableCell>
                                  <Badge variant={getProcessStatusVariant(proc.pm2_env.status)}>
                                    {proc.pm2_env.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>{proc.monit.cpu.toFixed(1)}%</TableCell>
                                <TableCell>{formatMemory(proc.monit.memory)}</TableCell>
                                <TableCell>{formatUptime(proc.pm2_env.pm_uptime)}</TableCell>
                                <TableCell>{proc.pm2_env.restart_time}</TableCell>
                                <TableCell>
                                  <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleRestartProcess(proc.pm_id)}
                                      title="Перезапустить"
                                    >
                                      ↻
                                    </Button>
                                    {proc.pm2_env.status === 'online' ? (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleStopProcess(proc.pm_id)}
                                        title="Остановить"
                                      >
                                        ⏹
                                      </Button>
                                    ) : (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleStartProcess(proc.pm_id)}
                                        title="Запустить"
                                      >
                                        ▶
                                      </Button>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Checks History Tab */}
            {activeTab === 'checks' && (
              <div className="server-detail__checks">
                {checksLoading ? (
                  <Skeleton width="100%" height={200} variant="rectangular" />
                ) : checks.length === 0 ? (
                  <div className="server-detail__empty">Нет данных о проверках</div>
                ) : (
                  <div style={{ maxHeight: '400px', overflow: 'auto' }}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableHeaderCell>Время</TableHeaderCell>
                          <TableHeaderCell>Статус</TableHeaderCell>
                          <TableHeaderCell>Отклик</TableHeaderCell>
                          <TableHeaderCell>Код</TableHeaderCell>
                          <TableHeaderCell>Ошибка</TableHeaderCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {checks.map((check) => (
                          <TableRow key={check.id}>
                            <TableCell>{formatTime(check.checkedAt)}</TableCell>
                            <TableCell>
                              <Badge variant={getStatusVariant(check.status)}>
                                {getStatusLabel(check.status)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {check.responseTime ? `${check.responseTime}ms` : '-'}
                            </TableCell>
                            <TableCell>{check.statusCode || '-'}</TableCell>
                            <TableCell>
                              <span
                                style={{
                                  maxWidth: '150px',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  display: 'block',
                                }}
                                title={check.errorMessage}
                              >
                                {check.errorMessage || '-'}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}

            {/* Logs Tab */}
            {activeTab === 'logs' && (
              <div className="server-detail__logs">
                {!serverDetail.agentConnected ? (
                  <div className="server-detail__empty">
                    <p>Агент не подключен</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 'var(--space-sm)' }}>
                      Подключите агент для получения логов
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Logs view toggle */}
                    <div className="server-detail__logs-header">
                      <div className="server-detail__logs-toggle">
                        <button
                          type="button"
                          className={`server-detail__logs-toggle-btn ${logsView === 'realtime' ? 'server-detail__logs-toggle-btn--active' : ''}`}
                          onClick={() => setLogsView('realtime')}
                        >
                          Real-time
                        </button>
                        <button
                          type="button"
                          className={`server-detail__logs-toggle-btn ${logsView === 'pm2' ? 'server-detail__logs-toggle-btn--active' : ''}`}
                          onClick={() => setLogsView('pm2')}
                        >
                          PM2 История
                        </button>
                      </div>
                      {logsView === 'pm2' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleRequestLogs(selectedProcessId)}
                          loading={requestingLogs}
                        >
                          Обновить
                        </Button>
                      )}
                      {logsView === 'realtime' && realtimeLogs.length > 0 && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setRealtimeLogs([])}
                        >
                          Очистить
                        </Button>
                      )}
                    </div>

                    {/* Real-time logs view */}
                    {logsView === 'realtime' && (
                      <>
                        {realtimeLogs.length === 0 ? (
                          <div className="server-detail__empty">
                            <p>Ожидание логов...</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 'var(--space-sm)' }}>
                              Логи появятся автоматически при активности сервера
                            </p>
                          </div>
                        ) : (
                          <div className="server-detail__logs-list">
                            {realtimeLogs.map((log) => (
                              <div key={log.id} className="server-detail__log-item">
                                <div className="server-detail__log-header">
                                  <Badge variant={getLogLevelVariant(log.level)} size="sm">
                                    {log.level}
                                  </Badge>
                                  <span className="server-detail__log-time">
                                    {formatTime(log.timestamp)}
                                  </span>
                                  {log.source && (
                                    <span className="server-detail__log-source">{log.source}</span>
                                  )}
                                </div>
                                <div className="server-detail__log-message">{log.message}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}

                    {/* PM2 logs history view */}
                    {logsView === 'pm2' && (
                      <>
                        {/* Process selector */}
                        <div className="server-detail__process-selector">
                          <span className="server-detail__process-label">Процесс:</span>
                          <div className="server-detail__process-buttons">
                            <button
                              type="button"
                              className={`server-detail__process-btn ${selectedProcessId === null ? 'server-detail__process-btn--active' : ''}`}
                              onClick={() => setSelectedProcessId(null)}
                            >
                              Все
                            </button>
                            {processes.map((proc) => (
                              <button
                                key={proc.pm_id}
                                type="button"
                                className={`server-detail__process-btn ${selectedProcessId === proc.pm_id ? 'server-detail__process-btn--active' : ''}`}
                                onClick={() => setSelectedProcessId(proc.pm_id)}
                              >
                                {proc.name}
                              </button>
                            ))}
                          </div>
                        </div>

                        {pm2Logs.length === 0 ? (
                          <div className="server-detail__empty">
                            <p>Нет логов</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 'var(--space-sm)' }}>
                              {processes.length === 0
                                ? 'Сначала загрузите список процессов на вкладке "Процессы"'
                                : 'Выберите процесс или нажмите «Обновить»'}
                            </p>
                          </div>
                        ) : (
                          <div className="server-detail__pm2-logs">
                            {pm2Logs.map((log, index) => (
                              <div key={index} className="server-detail__pm2-log-line">
                                {log}
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Agent Tab */}
            {activeTab === 'agent' && (
              <div className="server-detail__agent">
                <Card>
                  <CardBody>
                    <div className="server-detail__agent-status">
                      <span>Статус агента:</span>
                      <Badge variant={serverDetail.agentConnected ? 'success' : 'default'}>
                        {serverDetail.agentConnected ? 'Подключен' : 'Отключен'}
                      </Badge>
                    </div>
                  </CardBody>
                </Card>

                <Card>
                  <CardBody>
                    <div className="server-detail__agent-token">
                      <label>Agent Token</label>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-sm)' }}>
                        Используйте этот токен для подключения агента к серверу
                      </p>
                      <div className="server-detail__token-field">
                        <code className="server-detail__token-value">
                          {serverDetail.agentToken || 'Токен не создан'}
                        </code>
                        {serverDetail.agentToken && (
                          <Button size="sm" variant="ghost" onClick={handleCopyToken}>
                            {tokenCopied ? 'Скопировано!' : 'Копировать'}
                          </Button>
                        )}
                      </div>
                      <div style={{ marginTop: 'var(--space-md)' }}>
                        <Button
                          variant="secondary"
                          onClick={handleRegenerateToken}
                          loading={regenerating}
                        >
                          {serverDetail.agentToken ? 'Перегенерировать токен' : 'Создать токен'}
                        </Button>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </div>
            )}
          </div>
        </ModalBody>
      )}
    </Modal>
  );
};

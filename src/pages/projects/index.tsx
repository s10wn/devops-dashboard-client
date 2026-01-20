import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client/react';
import { PROJECTS_QUERY } from '@entities/project';
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
} from '@shared/ui';
import { CreateProjectModal } from './ui/create-project-modal';
import './projects.css';

type ViewMode = 'table' | 'grid';

type Project = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  isActive: boolean;
  provider?: string;
  monthlyCost?: number;
  currency?: string;
  nextPaymentDate?: string;
  lastPaymentDate?: string;
  createdAt: string;
};

type ProjectsData = {
  projects: Project[];
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '\u20AC',
  RUB: '\u20BD',
  TJS: 'TJS',
};

export const ProjectsPage = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data, loading, refetch } = useQuery<ProjectsData>(PROJECTS_QUERY);

  const projects = data?.projects || [];

  const formatCurrency = (amount?: number, currency?: string) => {
    if (!amount) return '-';
    const formatted = amount.toLocaleString('ru-RU');
    if (currency === 'TJS') return `${formatted} сомони`;
    const symbol = CURRENCY_SYMBOLS[currency || 'USD'] || currency || '$';
    return `${symbol}${formatted}`;
  };

  const formatDate = (date?: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
    });
  };

  const getDaysUntilPayment = (nextPaymentDate?: string): number | null => {
    if (!nextPaymentDate) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const payment = new Date(nextPaymentDate);
    payment.setHours(0, 0, 0, 0);
    const diff = payment.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const formatDaysOrMonths = (days: number): string => {
    const absDays = Math.abs(days);

    if (absDays >= 60) {
      const months = Math.round(absDays / 30);
      return `${months} мес.`;
    }

    if (absDays >= 30) {
      const months = Math.round(absDays / 30);
      return `~${months} мес.`;
    }

    return `${absDays} дн.`;
  };

  const getPaymentStatus = (nextPaymentDate?: string) => {
    const days = getDaysUntilPayment(nextPaymentDate);
    if (days === null) return { label: '', variant: 'ok' as const };
    if (days < 0) return { label: `Просрочено на ${formatDaysOrMonths(days)}`, variant: 'overdue' as const };
    if (days === 0) return { label: 'Оплата сегодня', variant: 'soon' as const };
    if (days <= 7) return { label: `Через ${days} дн.`, variant: 'soon' as const };
    return { label: `Через ${formatDaysOrMonths(days)}`, variant: 'ok' as const };
  };

  const getProjectsCount = (count: number): string => {
    if (count === 0) return 'Нет проектов';
    if (count === 1) return '1 проект';
    if (count >= 2 && count <= 4) return `${count} проекта`;
    return `${count} проектов`;
  };

  return (
    <div className="projects">
      <div className="projects__header">
        <div className="projects__title">
          <h1>Проекты</h1>
          <span className="projects__subtitle">{getProjectsCount(projects.length)}</span>
        </div>

        <div className="projects__actions">
          <div className="projects__view-toggle">
            <button
              type="button"
              className={`projects__view-btn ${viewMode === 'grid' ? 'projects__view-btn--active' : ''}`}
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
              className={`projects__view-btn ${viewMode === 'table' ? 'projects__view-btn--active' : ''}`}
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
            + Создать проект
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="projects__grid">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} width="100%" height={200} variant="rectangular" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <Card>
          <CardBody>
            <div className="projects__empty">
              <p>Нет проектов</p>
              <Button
                variant="primary"
                onClick={() => setIsCreateModalOpen(true)}
                style={{ marginTop: 'var(--space-md)' }}
              >
                Создать первый проект
              </Button>
            </div>
          </CardBody>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="projects__grid">
          {projects.map((project) => {
            const paymentStatus = getPaymentStatus(project.nextPaymentDate);
            return (
              <div
                key={project.id}
                className="project-card"
                style={{ '--project-color': project.color || '#171717' } as React.CSSProperties}
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                <div className="project-card__header">
                  <div className="project-card__title">
                    <div className="project-card__name">{project.name}</div>
                    {project.description && (
                      <div className="project-card__description">{project.description}</div>
                    )}
                  </div>
                  <span
                    className={`project-card__status project-card__status--${project.isActive ? 'active' : 'archived'}`}
                  >
                    <span className="project-card__status-dot" />
                    {project.isActive ? 'Активен' : 'Архив'}
                  </span>
                </div>

                <div className="project-card__info">
                  {project.provider && (
                    <div className="project-card__info-item">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="3" width="20" height="14" rx="2" />
                        <path d="M8 21h8M12 17v4" />
                      </svg>
                      <span>{project.provider}</span>
                    </div>
                  )}
                </div>

                <div className="project-card__footer">
                  <div className="project-card__payment">
                    {project.nextPaymentDate ? (
                      <>
                        <span className="project-card__payment-date">
                          {formatDate(project.nextPaymentDate)}
                        </span>
                        <span
                          className={`project-card__payment-status project-card__payment-status--${paymentStatus.variant}`}
                        >
                          {paymentStatus.label}
                        </span>
                      </>
                    ) : (
                      <span className="project-card__payment-date">Дата не указана</span>
                    )}
                  </div>
                  <div className="project-card__cost">
                    <span className="project-card__cost-value">
                      {formatCurrency(project.monthlyCost, project.currency)}
                    </span>
                    <span className="project-card__cost-period">/мес</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Card>
          <div className="projects__table-wrap">
            <Table className="projects__table">
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Название</TableHeaderCell>
                  <TableHeaderCell>Провайдер</TableHeaderCell>
                  <TableHeaderCell>Стоимость</TableHeaderCell>
                  <TableHeaderCell>Следующая оплата</TableHeaderCell>
                  <TableHeaderCell>Статус</TableHeaderCell>
                  <TableHeaderCell></TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {projects.map((project) => {
                  const paymentStatus = getPaymentStatus(project.nextPaymentDate);
                  return (
                    <TableRow key={project.id} onClick={() => navigate(`/projects/${project.id}`)}>
                      <TableCell>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                          <span
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              background: project.color || '#171717',
                              flexShrink: 0,
                            }}
                          />
                          <strong>{project.name}</strong>
                        </div>
                      </TableCell>
                      <TableCell>{project.provider || '-'}</TableCell>
                      <TableCell>
                        <span style={{ fontFamily: 'var(--font-mono)' }}>
                          {formatCurrency(project.monthlyCost, project.currency)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span>{formatDate(project.nextPaymentDate)}</span>
                          {paymentStatus.label && (
                            <span
                              style={{
                                fontSize: '0.75rem',
                                color:
                                  paymentStatus.variant === 'overdue'
                                    ? 'var(--error)'
                                    : paymentStatus.variant === 'soon'
                                      ? 'var(--warning)'
                                      : 'var(--text-tertiary)',
                              }}
                            >
                              {paymentStatus.label}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={project.isActive ? 'success' : 'default'}>
                          {project.isActive ? 'Активен' : 'Архив'}
                        </Badge>
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          refetch();
        }}
      />
    </div>
  );
};

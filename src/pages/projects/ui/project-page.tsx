import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client/react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  PROJECT_QUERY,
  PROJECT_PAYMENT_HISTORY_QUERY,
  UPDATE_PROJECT_MUTATION,
  RECORD_PROJECT_PAYMENT_MUTATION,
  DELETE_PROJECT_MUTATION,
  ARCHIVE_PROJECT_MUTATION,
} from '@entities/project';
import {
  Input,
  Select,
  Button,
  Badge,
  Card,
  CardBody,
  Skeleton,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@shared/ui';

type Tab = 'overview' | 'billing' | 'payments';

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
  updatedAt?: string;
};

type ProjectDetailData = {
  project: Project;
};

type PaymentHistory = {
  id: string;
  amount: number;
  paymentDate: string;
  note?: string;
  monthsCovered: number;
  projectId: string;
  createdAt: string;
};

type PaymentHistoryData = {
  projectPaymentHistory: PaymentHistory[];
};

const PROJECT_COLORS = [
  '#171717',
  '#dc2626',
  '#ea580c',
  '#ca8a04',
  '#16a34a',
  '#0891b2',
  '#2563eb',
  '#7c3aed',
  '#c026d3',
  '#db2777',
];

const CURRENCIES = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'RUB', label: 'RUB (₽)' },
  { value: 'TJS', label: 'TJS' },
];

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  RUB: '₽',
  TJS: 'TJS',
};

const updateProjectSchema = yup.object({
  name: yup.string().min(2, 'Минимум 2 символа').required('Обязательное поле'),
  description: yup.string().optional(),
  color: yup.string().optional(),
  provider: yup.string().optional(),
  monthlyCost: yup
    .number()
    .min(0, 'Стоимость не может быть отрицательной')
    .optional()
    .nullable()
    .transform((value, original) => (original === '' ? null : value)),
  currency: yup.string().optional(),
  nextPaymentDate: yup.string().optional(),
});

type UpdateProjectFormData = yup.InferType<typeof updateProjectSchema>;

const recordPaymentSchema = yup.object({
  amount: yup.number().min(0.01, 'Сумма должна быть больше 0').required('Обязательное поле'),
  paymentDate: yup.string().required('Укажите дату оплаты'),
  note: yup.string().optional(),
});

type RecordPaymentFormData = yup.InferType<typeof recordPaymentSchema>;

export const ProjectPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { data, loading, refetch } = useQuery<ProjectDetailData>(PROJECT_QUERY, {
    variables: { id },
    skip: !id,
  });

  const { data: paymentsData, loading: paymentsLoading } = useQuery<PaymentHistoryData>(
    PROJECT_PAYMENT_HISTORY_QUERY,
    {
      variables: { projectId: id },
      skip: !id || activeTab !== 'payments',
    }
  );

  const project = data?.project;
  const payments = paymentsData?.projectPaymentHistory || [];

  const formatDateForInput = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toISOString().split('T')[0];
  };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<UpdateProjectFormData>({
    resolver: yupResolver(updateProjectSchema) as never,
    values: project
      ? {
          name: project.name,
          description: project.description || '',
          color: project.color || PROJECT_COLORS[0],
          provider: project.provider || '',
          monthlyCost: project.monthlyCost || null,
          currency: project.currency || 'USD',
          nextPaymentDate: formatDateForInput(project.nextPaymentDate),
        }
      : undefined,
  });

  const selectedColor = watch('color');

  const {
    register: registerPayment,
    handleSubmit: handleSubmitPayment,
    reset: resetPayment,
    formState: { errors: paymentErrors },
  } = useForm<RecordPaymentFormData>({
    resolver: yupResolver(recordPaymentSchema) as never,
    defaultValues: {
      amount: project?.monthlyCost || 0,
      paymentDate: new Date().toISOString().split('T')[0],
    },
  });

  const [updateProject, { loading: updating }] = useMutation(UPDATE_PROJECT_MUTATION, {
    onCompleted: () => {
      setIsEditing(false);
      refetch();
    },
  });

  const [recordPayment, { loading: recordingPayment }] = useMutation(
    RECORD_PROJECT_PAYMENT_MUTATION,
    {
      onCompleted: () => {
        setIsRecordingPayment(false);
        resetPayment();
        refetch();
      },
    }
  );

  const [deleteProject, { loading: deleting }] = useMutation(DELETE_PROJECT_MUTATION, {
    onCompleted: () => {
      navigate('/projects');
    },
  });

  const [archiveProject] = useMutation(ARCHIVE_PROJECT_MUTATION, {
    onCompleted: () => refetch(),
  });

  const onSubmit = (formData: UpdateProjectFormData) => {
    updateProject({
      variables: {
        input: {
          projectId: id,
          name: formData.name,
          description: formData.description || undefined,
          color: formData.color || undefined,
          provider: formData.provider || undefined,
          monthlyCost: formData.monthlyCost || undefined,
          currency: formData.currency || undefined,
          nextPaymentDate: formData.nextPaymentDate || undefined,
        },
      },
    });
  };

  const onSubmitPayment = (formData: RecordPaymentFormData) => {
    recordPayment({
      variables: {
        input: {
          projectId: id,
          amount: formData.amount,
          paymentDate: formData.paymentDate,
          note: formData.note || undefined,
        },
      },
    });
  };

  const handleDelete = () => {
    deleteProject({ variables: { projectId: id } });
  };

  const handleArchive = () => {
    archiveProject({ variables: { projectId: id } });
  };

  const formatDate = (date?: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount?: number, currency?: string) => {
    if (!amount) return '-';
    const formatted = amount.toLocaleString('ru-RU');
    if (currency === 'TJS') return `${formatted} сомони`;
    const symbol = CURRENCY_SYMBOLS[currency || 'USD'] || currency || '$';
    return `${symbol}${formatted}`;
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

  const formatDaysOrMonths = (days: number | null): string => {
    if (days === null) return '-';

    const absDays = Math.abs(days);
    const isOverdue = days < 0;

    if (absDays >= 60) {
      const months = Math.round(absDays / 30);
      const monthWord = months === 1 ? 'месяц' : months >= 2 && months <= 4 ? 'месяца' : 'месяцев';
      return isOverdue ? `Просрочено на ${months} ${monthWord}` : `${months} ${monthWord}`;
    }

    if (absDays >= 30) {
      const months = Math.round(absDays / 30);
      return isOverdue ? `Просрочено на ${months} мес.` : `~${months} мес.`;
    }

    const dayWord = absDays === 1 ? 'день' : absDays >= 2 && absDays <= 4 ? 'дня' : 'дней';
    return isOverdue ? `Просрочено на ${absDays} ${dayWord}` : `${absDays} ${dayWord}`;
  };

  const getPaymentStatusBadge = (nextPaymentDate?: string) => {
    const days = getDaysUntilPayment(nextPaymentDate);
    if (days === null) return null;
    if (days < 0) {
      return <Badge variant="error">{formatDaysOrMonths(days)}</Badge>;
    }
    if (days === 0) {
      return <Badge variant="warning">Оплата сегодня</Badge>;
    }
    if (days <= 7) {
      return <Badge variant="warning">Через {formatDaysOrMonths(days)}</Badge>;
    }
    return <Badge variant="success">Через {formatDaysOrMonths(days)}</Badge>;
  };

  if (loading) {
    return (
      <div className="project-page">
        <div className="project-page__header">
          <Skeleton width={200} height={32} />
        </div>
        <Skeleton width="100%" height={400} variant="rectangular" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="project-page">
        <div className="project-page__empty">
          <p>Проект не найден</p>
          <Button variant="secondary" onClick={() => navigate('/projects')}>
            Вернуться к проектам
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="project-page">
      <div className="project-page__header">
        <button className="project-page__back" onClick={() => navigate('/projects')}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 15l-5-5 5-5" />
          </svg>
          Проекты
        </button>
        <div className="project-page__title-row">
          <div className="project-page__title">
            <span
              className="project-page__color-indicator"
              style={{ background: project.color || '#171717' }}
            />
            <h1>{project.name}</h1>
          </div>
          <div className="project-page__status">
            <Badge variant={project.isActive ? 'success' : 'default'}>
              {project.isActive ? 'Активен' : 'Архивирован'}
            </Badge>
            {getPaymentStatusBadge(project.nextPaymentDate)}
          </div>
        </div>
      </div>

      {isEditing ? (
        <Card>
          <CardBody>
            <form onSubmit={handleSubmit(onSubmit)} className="project-page__form">
              <Input label="Название" error={errors.name?.message} {...register('name')} />

              <Input
                label="Описание"
                error={errors.description?.message}
                {...register('description')}
              />

              <div className="color-picker">
                <span className="color-picker__label">Цвет проекта</span>
                <div className="color-picker__options">
                  {PROJECT_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`color-picker__option ${selectedColor === color ? 'color-picker__option--selected' : ''}`}
                      style={{ background: color }}
                      onClick={() => setValue('color', color)}
                      aria-label={`Выбрать цвет ${color}`}
                    />
                  ))}
                </div>
              </div>

              <Input
                label="Провайдер"
                placeholder="Hetzner, DO, AWS..."
                error={errors.provider?.message}
                {...register('provider')}
              />

              <div className="project-page__form-row">
                <Input
                  label="Стоимость в месяц"
                  type="number"
                  step="0.01"
                  error={errors.monthlyCost?.message}
                  {...register('monthlyCost', { valueAsNumber: true })}
                />

                <Select
                  label="Валюта"
                  error={errors.currency?.message}
                  {...register('currency')}
                >
                  {CURRENCIES.map((curr) => (
                    <option key={curr.value} value={curr.value}>
                      {curr.label}
                    </option>
                  ))}
                </Select>
              </div>

              <Input
                label="Дата следующей оплаты"
                type="date"
                error={errors.nextPaymentDate?.message}
                {...register('nextPaymentDate')}
              />

              <div className="project-page__form-actions">
                <Button type="button" variant="secondary" onClick={() => setIsEditing(false)}>
                  Отмена
                </Button>
                <Button type="submit" variant="primary" loading={updating}>
                  Сохранить
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      ) : isRecordingPayment ? (
        <Card>
          <CardBody>
            <h2 className="project-page__section-title">Записать оплату</h2>
            <form onSubmit={handleSubmitPayment(onSubmitPayment)} className="project-page__form">
              <Input
                label="Сумма оплаты"
                type="number"
                step="0.01"
                error={paymentErrors.amount?.message}
                {...registerPayment('amount', { valueAsNumber: true })}
              />

              <Input
                label="Дата оплаты"
                type="date"
                error={paymentErrors.paymentDate?.message}
                {...registerPayment('paymentDate')}
              />

              <Input
                label="Примечание"
                placeholder="Комментарий к платежу"
                error={paymentErrors.note?.message}
                {...registerPayment('note')}
              />

              <div className="project-page__form-actions">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setIsRecordingPayment(false);
                    resetPayment();
                  }}
                >
                  Отмена
                </Button>
                <Button type="submit" variant="primary" loading={recordingPayment}>
                  Записать оплату
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      ) : (
        <>
          <div className="project-page__tabs">
            <button
              type="button"
              className={`project-page__tab ${activeTab === 'overview' ? 'project-page__tab--active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Обзор
            </button>
            <button
              type="button"
              className={`project-page__tab ${activeTab === 'billing' ? 'project-page__tab--active' : ''}`}
              onClick={() => setActiveTab('billing')}
            >
              Оплаты
            </button>
            <button
              type="button"
              className={`project-page__tab ${activeTab === 'payments' ? 'project-page__tab--active' : ''}`}
              onClick={() => setActiveTab('payments')}
            >
              История оплат
            </button>
          </div>

          {activeTab === 'overview' && (
            <div className="project-page__content">
              {project.description && (
                <Card>
                  <CardBody>
                    <div className="project-page__description">{project.description}</div>
                  </CardBody>
                </Card>
              )}

              <div className="project-page__info-grid">
                <Card>
                  <CardBody>
                    <div className="project-page__info-item">
                      <span className="project-page__info-label">Провайдер</span>
                      <span className="project-page__info-value">{project.provider || '-'}</span>
                    </div>
                  </CardBody>
                </Card>
                <Card>
                  <CardBody>
                    <div className="project-page__info-item">
                      <span className="project-page__info-label">Стоимость</span>
                      <span className="project-page__info-value project-page__info-value--mono">
                        {formatCurrency(project.monthlyCost, project.currency)}/мес
                      </span>
                    </div>
                  </CardBody>
                </Card>
                <Card>
                  <CardBody>
                    <div className="project-page__info-item">
                      <span className="project-page__info-label">Следующая оплата</span>
                      <span className="project-page__info-value">{formatDate(project.nextPaymentDate)}</span>
                    </div>
                  </CardBody>
                </Card>
                <Card>
                  <CardBody>
                    <div className="project-page__info-item">
                      <span className="project-page__info-label">Последняя оплата</span>
                      <span className="project-page__info-value">{formatDate(project.lastPaymentDate)}</span>
                    </div>
                  </CardBody>
                </Card>
                <Card>
                  <CardBody>
                    <div className="project-page__info-item">
                      <span className="project-page__info-label">Создан</span>
                      <span className="project-page__info-value">{formatDate(project.createdAt)}</span>
                    </div>
                  </CardBody>
                </Card>
                <Card>
                  <CardBody>
                    <div className="project-page__info-item">
                      <span className="project-page__info-label">Slug</span>
                      <span className="project-page__info-value project-page__info-value--mono">{project.slug}</span>
                    </div>
                  </CardBody>
                </Card>
              </div>

              <div className="project-page__actions">
                <Button variant="secondary" onClick={() => setIsEditing(true)}>
                  Редактировать
                </Button>
                <Button variant="secondary" onClick={handleArchive}>
                  {project.isActive ? 'Архивировать' : 'Восстановить'}
                </Button>
                <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
                  Удалить
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="project-page__content">
              <div className="project-page__billing-stats">
                <Card>
                  <CardBody>
                    <div className="project-page__stat">
                      <span className="project-page__stat-value">
                        {formatCurrency(project.monthlyCost, project.currency)}
                      </span>
                      <span className="project-page__stat-label">В месяц</span>
                    </div>
                  </CardBody>
                </Card>
                <Card>
                  <CardBody>
                    <div className="project-page__stat">
                      <span className="project-page__stat-value">
                        {formatCurrency((project.monthlyCost || 0) * 12, project.currency)}
                      </span>
                      <span className="project-page__stat-label">В год</span>
                    </div>
                  </CardBody>
                </Card>
                <Card>
                  <CardBody>
                    <div className="project-page__stat">
                      <span className="project-page__stat-value">
                        {formatDaysOrMonths(getDaysUntilPayment(project.nextPaymentDate))}
                      </span>
                      <span className="project-page__stat-label">До оплаты</span>
                    </div>
                  </CardBody>
                </Card>
              </div>

              <Card>
                <CardBody>
                  <div className="project-page__billing-action">
                    <div>
                      <div className="project-page__billing-action-title">Записать оплату</div>
                      <div className="project-page__billing-action-desc">
                        Отметьте произведенную оплату за проект
                      </div>
                    </div>
                    <Button variant="primary" onClick={() => setIsRecordingPayment(true)}>
                      Записать оплату
                    </Button>
                  </div>
                </CardBody>
              </Card>

              <div className="project-page__actions">
                <Button variant="secondary" onClick={() => setIsEditing(true)}>
                  Редактировать
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="project-page__content">
              {paymentsLoading ? (
                <Skeleton width="100%" height={200} variant="rectangular" />
              ) : payments.length === 0 ? (
                <Card>
                  <CardBody>
                    <div className="project-page__empty">
                      <p>Нет записей об оплатах</p>
                      <Button
                        variant="primary"
                        onClick={() => setIsRecordingPayment(true)}
                        style={{ marginTop: 'var(--space-md)' }}
                      >
                        Записать первую оплату
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              ) : (
                <>
                  <div className="project-page__payments">
                    {payments.map((payment) => (
                      <Card key={payment.id}>
                        <CardBody>
                          <div className="project-page__payment-item">
                            <div className="project-page__payment-info">
                              <span className="project-page__payment-amount">
                                {formatCurrency(payment.amount, project.currency)}
                              </span>
                              <span className="project-page__payment-date">
                                {formatDate(payment.paymentDate)}
                                {payment.monthsCovered > 1 && ` (${payment.monthsCovered} мес.)`}
                              </span>
                            </div>
                            {payment.note && (
                              <span className="project-page__payment-note">{payment.note}</span>
                            )}
                          </div>
                        </CardBody>
                      </Card>
                    ))}
                  </div>

                  <div className="project-page__actions">
                    <Button variant="primary" onClick={() => setIsRecordingPayment(true)}>
                      Записать оплату
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}

      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} size="sm">
        <ModalHeader onClose={() => setShowDeleteModal(false)}>Удалить проект?</ModalHeader>
        <ModalBody>
          <p>
            Вы уверены, что хотите удалить проект <strong>{project.name}</strong>?
            Это действие нельзя отменить.
          </p>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Отмена
          </Button>
          <Button variant="danger" onClick={handleDelete} loading={deleting}>
            Удалить
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

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
  '#171717', '#dc2626', '#ea580c', '#ca8a04', '#16a34a',
  '#0891b2', '#2563eb', '#7c3aed', '#c026d3', '#db2777',
];

const CURRENCIES = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'RUB', label: 'RUB (сомони)' },
  { value: 'TJS', label: 'TJS (сомони)' },
];

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  RUB: 'сомони',
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
  const [isEditing, setIsEditing] = useState(false);
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { data, loading, refetch } = useQuery<ProjectDetailData>(PROJECT_QUERY, {
    variables: { id },
    skip: !id,
  });

  const { data: paymentsData, loading: paymentsLoading, refetch: refetchPayments } = useQuery<PaymentHistoryData>(
    PROJECT_PAYMENT_HISTORY_QUERY,
    { variables: { projectId: id }, skip: !id }
  );

  const project = data?.project;
  const payments = paymentsData?.projectPaymentHistory || [];

  const formatDateForInput = (dateStr?: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toISOString().split('T')[0];
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
        refetchPayments();
      },
    }
  );

  const [deleteProject, { loading: deleting }] = useMutation(DELETE_PROJECT_MUTATION, {
    onCompleted: () => navigate('/projects'),
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

  const formatDate = (date?: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount?: number, currency?: string) => {
    if (!amount) return '-';
    const formatted = amount.toLocaleString('ru-RU');
    if (currency === 'TJS' || currency === 'RUB') return `${formatted} сомони`;
    const symbol = CURRENCY_SYMBOLS[currency || 'USD'] || currency || '$';
    return `${symbol}${formatted}`;
  };

  const getDaysUntilPayment = (nextPaymentDate?: string): number | null => {
    if (!nextPaymentDate) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const payment = new Date(nextPaymentDate);
    payment.setHours(0, 0, 0, 0);
    return Math.ceil((payment.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const formatDaysOrMonths = (days: number | null): string => {
    if (days === null) return '-';
    const absDays = Math.abs(days);
    if (absDays >= 60) return `${Math.round(absDays / 30)} мес.`;
    if (absDays >= 30) return `~1 мес.`;
    return `${absDays} дн.`;
  };

  const getPaymentStatusBadge = (nextPaymentDate?: string) => {
    const days = getDaysUntilPayment(nextPaymentDate);
    if (days === null) return null;
    if (days < 0) return <Badge variant="error">Просрочено на {formatDaysOrMonths(days)}</Badge>;
    if (days === 0) return <Badge variant="warning">Оплата сегодня</Badge>;
    if (days <= 7) return <Badge variant="warning">Через {formatDaysOrMonths(days)}</Badge>;
    return <Badge variant="success">Через {formatDaysOrMonths(days)}</Badge>;
  };

  if (loading) {
    return (
      <div className="project-page">
        <Skeleton width={200} height={32} />
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

  const daysUntil = getDaysUntilPayment(project.nextPaymentDate);

  return (
    <div className="project-page">
      {/* Header */}
      <div className="project-page__header">
        <button className="project-page__back" onClick={() => navigate('/projects')}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 15l-5-5 5-5" />
          </svg>
          Проекты
        </button>
        <div className="project-page__title-row">
          <div className="project-page__title">
            <span className="project-page__color-indicator" style={{ background: project.color || '#171717' }} />
            <h1>{project.name}</h1>
          </div>
          <div className="project-page__status">
            <Badge variant={project.isActive ? 'success' : 'default'}>
              {project.isActive ? 'Активен' : 'Архив'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="project-page__grid">
        {/* Left column - Project info & Payment */}
        <div className="project-page__main">
          {/* Payment card - most important */}
          <Card>
            <CardBody>
              <div className="project-page__payment-card">
                <div className="project-page__payment-header">
                  <div className="project-page__payment-title">Следующая оплата</div>
                  {getPaymentStatusBadge(project.nextPaymentDate)}
                </div>

                <div className="project-page__payment-info">
                  <div className="project-page__payment-date-block">
                    <span className="project-page__payment-date">{formatDate(project.nextPaymentDate)}</span>
                    {daysUntil !== null && (
                      <span className={`project-page__payment-days ${daysUntil < 0 ? 'project-page__payment-days--overdue' : daysUntil <= 7 ? 'project-page__payment-days--soon' : ''}`}>
                        {daysUntil < 0 ? `просрочено на ${Math.abs(daysUntil)} дн.` : daysUntil === 0 ? 'сегодня' : `через ${daysUntil} дн.`}
                      </span>
                    )}
                  </div>
                  <div className="project-page__payment-amount">
                    {formatCurrency(project.monthlyCost, project.currency)}
                    <span className="project-page__payment-period">/мес</span>
                  </div>
                </div>

                <Button variant="primary" onClick={() => setIsRecordingPayment(true)} style={{ width: '100%' }}>
                  Записать оплату
                </Button>
              </div>
            </CardBody>
          </Card>

          {/* Project details */}
          <Card>
            <CardBody>
              <div className="project-page__details">
                <div className="project-page__details-header">
                  <h3>Информация</h3>
                  <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                    Редактировать
                  </Button>
                </div>

                {project.description && (
                  <p className="project-page__description">{project.description}</p>
                )}

                <div className="project-page__details-grid">
                  <div className="project-page__detail-item">
                    <span className="project-page__detail-label">Провайдер</span>
                    <span className="project-page__detail-value">{project.provider || '-'}</span>
                  </div>
                  <div className="project-page__detail-item">
                    <span className="project-page__detail-label">Стоимость в год</span>
                    <span className="project-page__detail-value">
                      {formatCurrency((project.monthlyCost || 0) * 12, project.currency)}
                    </span>
                  </div>
                  <div className="project-page__detail-item">
                    <span className="project-page__detail-label">Последняя оплата</span>
                    <span className="project-page__detail-value">{formatDate(project.lastPaymentDate)}</span>
                  </div>
                  <div className="project-page__detail-item">
                    <span className="project-page__detail-label">Создан</span>
                    <span className="project-page__detail-value">{formatDate(project.createdAt)}</span>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Actions */}
          <div className="project-page__actions">
            <Button variant="secondary" onClick={() => archiveProject({ variables: { projectId: id } })}>
              {project.isActive ? 'Архивировать' : 'Восстановить'}
            </Button>
            <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
              Удалить
            </Button>
          </div>
        </div>

        {/* Right column - Payment history */}
        <div className="project-page__sidebar">
          <Card>
            <CardBody>
              <h3 className="project-page__sidebar-title">История оплат</h3>

              {paymentsLoading ? (
                <Skeleton width="100%" height={150} variant="rectangular" />
              ) : payments.length === 0 ? (
                <div className="project-page__no-payments">
                  <p>Нет записей об оплатах</p>
                </div>
              ) : (
                <div className="project-page__payments-list">
                  {payments.map((payment) => (
                    <div key={payment.id} className="project-page__payment-item">
                      <div className="project-page__payment-item-main">
                        <span className="project-page__payment-item-amount">
                          {formatCurrency(payment.amount, project.currency)}
                        </span>
                        <span className="project-page__payment-item-date">
                          {formatDate(payment.paymentDate)}
                        </span>
                      </div>
                      {payment.note && (
                        <span className="project-page__payment-item-note">{payment.note}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal isOpen={isEditing} onClose={() => setIsEditing(false)} size="md">
        <ModalHeader onClose={() => setIsEditing(false)}>Редактировать проект</ModalHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Input label="Название" error={errors.name?.message} {...register('name')} />
              <Input label="Описание" {...register('description')} />

              <div className="color-picker">
                <span className="color-picker__label">Цвет</span>
                <div className="color-picker__options">
                  {PROJECT_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`color-picker__option ${selectedColor === color ? 'color-picker__option--selected' : ''}`}
                      style={{ background: color }}
                      onClick={() => setValue('color', color)}
                    />
                  ))}
                </div>
              </div>

              <Input label="Провайдер" placeholder="Hetzner, DO, AWS..." {...register('provider')} />

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                <Input
                  label="Стоимость в месяц"
                  type="number"
                  step="0.01"
                  {...register('monthlyCost', { valueAsNumber: true })}
                />
                <Select label="Валюта" {...register('currency')}>
                  {CURRENCIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </Select>
              </div>

              <Input label="Дата следующей оплаты" type="date" {...register('nextPaymentDate')} />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="secondary" onClick={() => setIsEditing(false)}>Отмена</Button>
            <Button type="submit" variant="primary" loading={updating}>Сохранить</Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Record Payment Modal */}
      <Modal isOpen={isRecordingPayment} onClose={() => setIsRecordingPayment(false)} size="sm">
        <ModalHeader onClose={() => setIsRecordingPayment(false)}>Записать оплату</ModalHeader>
        <form onSubmit={handleSubmitPayment(onSubmitPayment)}>
          <ModalBody>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Input
                label="Сумма"
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
              <Input label="Примечание" placeholder="Комментарий" {...registerPayment('note')} />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="secondary" onClick={() => { setIsRecordingPayment(false); resetPayment(); }}>
              Отмена
            </Button>
            <Button type="submit" variant="primary" loading={recordingPayment}>Записать</Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} size="sm">
        <ModalHeader onClose={() => setShowDeleteModal(false)}>Удалить проект?</ModalHeader>
        <ModalBody>
          <p>Вы уверены, что хотите удалить проект <strong>{project.name}</strong>? Это действие нельзя отменить.</p>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Отмена</Button>
          <Button variant="danger" onClick={() => deleteProject({ variables: { projectId: id } })} loading={deleting}>
            Удалить
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

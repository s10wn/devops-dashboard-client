import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  PROJECT_QUERY,
  PROJECT_PAYMENT_HISTORY_QUERY,
  RECORD_PROJECT_PAYMENT_MUTATION,
} from '@entities/project';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Button,
  Badge,
  Skeleton,
} from '@shared/ui';

type UserInfo = {
  id: string;
  name: string;
  avatarUrl?: string;
};

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
  createdBy?: UserInfo;
};

type ProjectDetailData = {
  project: Project & {
    updatedAt?: string;
    updatedBy?: UserInfo;
  };
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

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  RUB: 'сомони',
  TJS: 'TJS',
};

const recordPaymentSchema = yup.object({
  amount: yup.number().min(0.01, 'Сумма должна быть больше 0').required('Обязательное поле'),
  paymentDate: yup.string().required('Укажите дату оплаты'),
  note: yup.string().optional(),
});

type RecordPaymentFormData = yup.InferType<typeof recordPaymentSchema>;

type ProjectDetailModalProps = {
  project: Project;
  onClose: () => void;
  onDelete: () => void;
  onArchive: () => void;
  onUpdate: () => void;
};

export const ProjectDetailModal = ({
  project,
  onClose,
  onDelete,
  onArchive,
  onUpdate,
}: ProjectDetailModalProps) => {
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);

  const { data, loading, refetch } = useQuery<ProjectDetailData>(PROJECT_QUERY, {
    variables: { id: project.id },
  });

  const { data: paymentsData, loading: paymentsLoading } = useQuery<PaymentHistoryData>(
    PROJECT_PAYMENT_HISTORY_QUERY,
    { variables: { projectId: project.id } }
  );

  const projectDetail = data?.project;
  const payments = paymentsData?.projectPaymentHistory || [];

  const {
    register: registerPayment,
    handleSubmit: handleSubmitPayment,
    reset: resetPayment,
    formState: { errors: paymentErrors },
  } = useForm<RecordPaymentFormData>({
    resolver: yupResolver(recordPaymentSchema) as never,
    defaultValues: {
      amount: projectDetail?.monthlyCost || 0,
      paymentDate: new Date().toISOString().split('T')[0],
    },
  });

  const [recordPayment, { loading: recordingPayment }] = useMutation(
    RECORD_PROJECT_PAYMENT_MUTATION,
    {
      onCompleted: () => {
        setIsRecordingPayment(false);
        resetPayment();
        onUpdate();
        refetch();
      },
    }
  );

  const onSubmitPayment = (formData: RecordPaymentFormData) => {
    recordPayment({
      variables: {
        input: {
          projectId: project.id,
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
    const diff = payment.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getPaymentStatusBadge = (nextPaymentDate?: string) => {
    const days = getDaysUntilPayment(nextPaymentDate);
    if (days === null) return null;
    if (days < 0) {
      return <Badge variant="error">Просрочено на {Math.abs(days)} дн.</Badge>;
    }
    if (days === 0) {
      return <Badge variant="warning">Оплата сегодня</Badge>;
    }
    if (days <= 7) {
      return <Badge variant="warning">Через {days} дн.</Badge>;
    }
    return <Badge variant="success">Через {days} дн.</Badge>;
  };

  if (loading || !projectDetail) {
    return (
      <Modal isOpen onClose={onClose} size="lg">
        <ModalHeader onClose={onClose}>{project.name}</ModalHeader>
        <ModalBody>
          <Skeleton width="100%" height={300} variant="rectangular" />
        </ModalBody>
      </Modal>
    );
  }

  // Record payment form
  if (isRecordingPayment) {
    return (
      <Modal isOpen onClose={onClose} size="md">
        <ModalHeader onClose={onClose}>Записать оплату</ModalHeader>
        <form onSubmit={handleSubmitPayment(onSubmitPayment)}>
          <ModalBody>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                {...registerPayment('note')}
              />
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
    );
  }

  // Main view - all in one
  return (
    <Modal isOpen onClose={onClose} size="lg">
      <ModalHeader onClose={onClose}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <span
            className="project-detail__color-indicator"
            style={{ background: projectDetail.color || '#171717' }}
          />
          {projectDetail.name}
        </div>
      </ModalHeader>

      <ModalBody>
        <div className="project-detail">
          {/* Status */}
          <div className="project-detail__header">
            <div className="project-detail__status">
              <Badge variant={projectDetail.isActive ? 'success' : 'default'}>
                {projectDetail.isActive ? 'Активен' : 'Архивирован'}
              </Badge>
              {getPaymentStatusBadge(projectDetail.nextPaymentDate)}
            </div>
          </div>

          {/* Description */}
          {projectDetail.description && (
            <div className="project-detail__description">{projectDetail.description}</div>
          )}

          {/* Info grid */}
          <div className="project-detail__info">
            <div className="project-detail__info-item">
              <span className="project-detail__info-label">Провайдер</span>
              <span className="project-detail__info-value">{projectDetail.provider || '-'}</span>
            </div>
            <div className="project-detail__info-item">
              <span className="project-detail__info-label">Стоимость</span>
              <span className="project-detail__info-value project-detail__info-value--mono">
                {formatCurrency(projectDetail.monthlyCost, projectDetail.currency)}/мес
              </span>
            </div>
            <div className="project-detail__info-item">
              <span className="project-detail__info-label">Следующая оплата</span>
              <span className="project-detail__info-value">{formatDate(projectDetail.nextPaymentDate)}</span>
            </div>
            <div className="project-detail__info-item">
              <span className="project-detail__info-label">Последняя оплата</span>
              <span className="project-detail__info-value">{formatDate(projectDetail.lastPaymentDate)}</span>
            </div>
          </div>

          {/* Audit info */}
          <div className="project-detail__audit">
            <div className="project-detail__audit-item">
              <span className="project-detail__audit-label">Создан</span>
              <span className="project-detail__audit-value">
                {projectDetail.createdBy?.name || 'Неизвестно'} • {formatDate(projectDetail.createdAt)}
              </span>
            </div>
            {projectDetail.updatedBy && (
              <div className="project-detail__audit-item">
                <span className="project-detail__audit-label">Изменён</span>
                <span className="project-detail__audit-value">
                  {projectDetail.updatedBy.name} • {formatDate(projectDetail.updatedAt)}
                </span>
              </div>
            )}
          </div>

          {/* Billing summary */}
          <div className="project-detail__billing">
            <div className="project-detail__billing-grid">
              <div className="project-detail__billing-item">
                <span className="project-detail__billing-value">
                  {formatCurrency(projectDetail.monthlyCost, projectDetail.currency)}
                </span>
                <span className="project-detail__billing-label">В месяц</span>
              </div>
              <div className="project-detail__billing-item">
                <span className="project-detail__billing-value">
                  {formatCurrency((projectDetail.monthlyCost || 0) * 12, projectDetail.currency)}
                </span>
                <span className="project-detail__billing-label">В год</span>
              </div>
              <div className="project-detail__billing-item">
                <span className="project-detail__billing-value">
                  {getDaysUntilPayment(projectDetail.nextPaymentDate) ?? '-'}
                </span>
                <span className="project-detail__billing-label">Дней до оплаты</span>
              </div>
            </div>
          </div>

          {/* Payment history */}
          {paymentsLoading ? (
            <Skeleton width="100%" height={100} variant="rectangular" />
          ) : payments.length > 0 ? (
            <div className="project-detail__section">
              <div className="project-detail__section-title">История оплат</div>
              <div className="project-detail__payments">
                {payments.slice(0, 5).map((payment) => (
                  <div key={payment.id} className="project-detail__payment-item">
                    <div className="project-detail__payment-info">
                      <span className="project-detail__payment-amount">
                        {formatCurrency(payment.amount, projectDetail.currency)}
                      </span>
                      <span className="project-detail__payment-date">{formatDate(payment.paymentDate)}</span>
                    </div>
                    {payment.note && (
                      <span className="project-detail__payment-note">{payment.note}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Actions */}
          <div className="project-detail__actions">
            <Button variant="primary" onClick={() => setIsRecordingPayment(true)}>
              Записать оплату
            </Button>
            <Button variant="secondary" onClick={onArchive}>
              {projectDetail.isActive ? 'Архивировать' : 'Восстановить'}
            </Button>
            <Button variant="danger" onClick={onDelete}>
              Удалить
            </Button>
          </div>
        </div>
      </ModalBody>
    </Modal>
  );
};

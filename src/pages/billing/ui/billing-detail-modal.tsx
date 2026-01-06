import { useQuery } from '@apollo/client/react';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Badge,
  Skeleton,
} from '@shared/ui';
import { PAYMENT_HISTORY_QUERY } from '@entities/billing';
import { PaymentStatus, BillingCycle } from '@shared/types/enums';

type Payment = {
  id: string;
  amount: number;
  currency: string;
  paymentDate: string;
  status: PaymentStatus;
  transactionId?: string;
  notes?: string;
  createdAt: string;
};

type PaymentHistoryData = {
  paymentHistory: Payment[];
};

type Server = {
  id: string;
  name: string;
  host: string;
};

type Billing = {
  id: string;
  amount: number;
  currency: string;
  billingCycle: BillingCycle;
  nextPaymentDate: string;
  paymentStatus: PaymentStatus;
  accountId?: string;
  notes?: string;
  remindDaysBefore?: number;
  server: Server;
};

type BillingDetailModalProps = {
  billing: Billing | null;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

const getCycleLabel = (cycle: BillingCycle) => {
  const labels: Record<BillingCycle, string> = {
    [BillingCycle.MONTHLY]: 'в месяц',
    [BillingCycle.QUARTERLY]: 'в квартал',
    [BillingCycle.YEARLY]: 'в год',
  };
  return labels[cycle];
};

const getStatusLabel = (status: PaymentStatus) => {
  const labels: Record<PaymentStatus, string> = {
    [PaymentStatus.PENDING]: 'Ожидает',
    [PaymentStatus.PAID]: 'Оплачен',
    [PaymentStatus.OVERDUE]: 'Просрочен',
    [PaymentStatus.CANCELLED]: 'Отменён',
  };
  return labels[status];
};

const getStatusVariant = (status: PaymentStatus): 'success' | 'error' | 'warning' | 'default' => {
  const variants: Record<PaymentStatus, 'success' | 'error' | 'warning' | 'default'> = {
    [PaymentStatus.PENDING]: 'warning',
    [PaymentStatus.PAID]: 'success',
    [PaymentStatus.OVERDUE]: 'error',
    [PaymentStatus.CANCELLED]: 'default',
  };
  return variants[status];
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
  }).format(amount);
};

export const BillingDetailModal = ({
  billing,
  onClose,
  onEdit,
  onDelete,
}: BillingDetailModalProps) => {
  const { data, loading } = useQuery<PaymentHistoryData>(PAYMENT_HISTORY_QUERY, {
    variables: { billingId: billing?.id },
    skip: !billing?.id,
  });

  const payments = data?.paymentHistory || [];

  if (!billing) return null;

  return (
    <Modal isOpen={!!billing} onClose={onClose} size="lg">
      <ModalHeader onClose={onClose}>
        Детали биллинга
      </ModalHeader>
      <ModalBody>
        <div className="billing-detail">
          <div className="billing-detail__header">
            <div className="billing-detail__server">
              <div className="billing-detail__server-name">{billing.server.name}</div>
              <div className="billing-detail__server-host">{billing.server.host}</div>
            </div>
            <div className="billing-detail__amount">
              <div className="billing-detail__amount-value">
                {formatCurrency(billing.amount, billing.currency)}
              </div>
              <div className="billing-detail__amount-cycle">
                {getCycleLabel(billing.billingCycle)}
              </div>
            </div>
          </div>

          <div className="billing-detail__info">
            <div className="billing-detail__info-item">
              <span className="billing-detail__info-label">Статус</span>
              <Badge variant={getStatusVariant(billing.paymentStatus)}>
                {getStatusLabel(billing.paymentStatus)}
              </Badge>
            </div>
            <div className="billing-detail__info-item">
              <span className="billing-detail__info-label">Следующая оплата</span>
              <span className="billing-detail__info-value">
                {formatDate(billing.nextPaymentDate)}
              </span>
            </div>
            {billing.remindDaysBefore && (
              <div className="billing-detail__info-item">
                <span className="billing-detail__info-label">Напоминание</span>
                <span className="billing-detail__info-value">
                  За {billing.remindDaysBefore} дней
                </span>
              </div>
            )}
          </div>

          {billing.notes && (
            <div className="billing-detail__notes">
              {billing.notes}
            </div>
          )}

          <div className="billing-detail__history">
            <h4 className="billing-detail__history-title">История платежей</h4>
            {loading ? (
              <>
                <Skeleton height={60} variant="rectangular" />
                <Skeleton height={60} variant="rectangular" />
              </>
            ) : payments.length === 0 ? (
              <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
                Нет записей о платежах
              </p>
            ) : (
              payments.map((payment) => (
                <div key={payment.id} className="billing-detail__history-item">
                  <div className="billing-detail__history-left">
                    <span className="billing-detail__history-date">
                      {formatDate(payment.paymentDate)}
                    </span>
                    {payment.notes && (
                      <span className="billing-detail__history-note">{payment.notes}</span>
                    )}
                  </div>
                  <div className="billing-detail__history-right">
                    <Badge variant={getStatusVariant(payment.status)} size="sm">
                      {getStatusLabel(payment.status)}
                    </Badge>
                    <span className="billing-detail__history-amount">
                      {formatCurrency(payment.amount, payment.currency)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </ModalBody>
      <ModalFooter align="between">
        <Button variant="danger" onClick={onDelete}>
          Удалить
        </Button>
        <Button variant="secondary" onClick={onEdit}>
          Редактировать
        </Button>
      </ModalFooter>
    </Modal>
  );
};

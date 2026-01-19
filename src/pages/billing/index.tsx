import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
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
import {
  BILLINGS_QUERY,
  BILLING_SUMMARY_QUERY,
  DELETE_BILLING_MUTATION,
} from '@entities/billing';
import { PaymentStatus, BillingCycle } from '@shared/types/enums';
import { CreateBillingModal } from './ui/create-billing-modal';
import { BillingDetailModal } from './ui/billing-detail-modal';
import './billing.css';

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

type BillingSummary = {
  totalMonthly: number;
  totalUpcoming: number;
  upcomingPaymentsCount: number;
  overdueCount: number;
  overdueAmount: number;
};

type BillingsData = {
  billings: Billing[];
};

type BillingSummaryData = {
  billingSummary: BillingSummary;
};

type StatusFilter = 'all' | PaymentStatus;

const getCycleLabel = (cycle: BillingCycle) => {
  const labels: Record<BillingCycle, string> = {
    [BillingCycle.MONTHLY]: 'мес.',
    [BillingCycle.QUARTERLY]: 'кв.',
    [BillingCycle.YEARLY]: 'год',
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

const formatCurrency = (amount: number, currency = 'USD') => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
  }).format(amount);
};

const getDaysUntil = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const formatNextPayment = (dateStr: string) => {
  const days = getDaysUntil(dateStr);
  const date = new Date(dateStr);
  const formatted = date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
  });

  if (days < 0) return { text: `${formatted} (${Math.abs(days)} дн. назад)`, className: 'billing__date--overdue' };
  if (days <= 7) return { text: `${formatted} (${days} дн.)`, className: 'billing__date--soon' };
  return { text: formatted, className: '' };
};

export const BillingPage = () => {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedBilling, setSelectedBilling] = useState<Billing | null>(null);
  const [billingToEdit, setBillingToEdit] = useState<Billing | null>(null);
  const [billingToDelete, setBillingToDelete] = useState<Billing | null>(null);

  const { data: billingsData, loading: billingsLoading, refetch } = useQuery<BillingsData>(BILLINGS_QUERY);

  const { data: summaryData, loading: summaryLoading, refetch: refetchSummary } = useQuery<BillingSummaryData>(BILLING_SUMMARY_QUERY);

  const [deleteBilling, { loading: deleting }] = useMutation(DELETE_BILLING_MUTATION, {
    onCompleted: () => {
      setBillingToDelete(null);
      refetch();
      refetchSummary();
    },
  });

  const billings = billingsData?.billings || [];
  const summary = summaryData?.billingSummary || null;

  const filteredBillings = statusFilter === 'all'
    ? billings
    : billings.filter((b) => b.paymentStatus === statusFilter);

  const handleDeleteBilling = () => {
    if (billingToDelete) {
      deleteBilling({ variables: { billingId: billingToDelete.id } });
    }
  };

  const handleRefetch = () => {
    refetch();
    refetchSummary();
  };

  return (
    <div className="billing">
      <div className="billing__header">
        <div className="billing__title">
          <h1>Биллинг</h1>
          <span className="billing__subtitle">
            {billings.length > 0
              ? `${billings.length} ${billings.length === 1 ? 'запись' : 'записей'}`
              : 'Нет записей'}
          </span>
        </div>
        <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
          + Добавить биллинг
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="billing__summary">
        {summaryLoading ? (
          <>
            <Skeleton height={100} variant="rectangular" />
            <Skeleton height={100} variant="rectangular" />
          </>
        ) : summary ? (
          <>
            <div className="billing__summary-card">
              <div className="billing__summary-label">В месяц</div>
              <div className="billing__summary-value">
                {formatCurrency(summary.totalMonthly)}
              </div>
            </div>
            <div className="billing__summary-card">
              <div className="billing__summary-label">Просрочено</div>
              <div className={`billing__summary-value ${summary.overdueCount > 0 ? 'billing__summary-value--error' : 'billing__summary-value--success'}`}>
                {summary.overdueCount > 0
                  ? `${summary.overdueCount} (${formatCurrency(summary.overdueAmount)})`
                  : 'Нет'}
              </div>
            </div>
          </>
        ) : null}
      </div>

      {/* Filters */}
      <div className="billing__filters">
        <button
          type="button"
          className={`billing__filter-btn ${statusFilter === 'all' ? 'billing__filter-btn--active' : ''}`}
          onClick={() => setStatusFilter('all')}
        >
          Все
        </button>
        <button
          type="button"
          className={`billing__filter-btn ${statusFilter === PaymentStatus.PENDING ? 'billing__filter-btn--active' : ''}`}
          onClick={() => setStatusFilter(PaymentStatus.PENDING)}
        >
          Ожидают
        </button>
        <button
          type="button"
          className={`billing__filter-btn ${statusFilter === PaymentStatus.OVERDUE ? 'billing__filter-btn--active' : ''}`}
          onClick={() => setStatusFilter(PaymentStatus.OVERDUE)}
        >
          Просрочены
        </button>
        <button
          type="button"
          className={`billing__filter-btn ${statusFilter === PaymentStatus.PAID ? 'billing__filter-btn--active' : ''}`}
          onClick={() => setStatusFilter(PaymentStatus.PAID)}
        >
          Оплачены
        </button>
      </div>

      {/* Billing Table */}
      {billingsLoading ? (
        <Card>
          <CardBody>
            <Skeleton height={200} variant="rectangular" />
          </CardBody>
        </Card>
      ) : filteredBillings.length === 0 ? (
        <Card>
          <CardBody>
            <div className="billing__empty">
              {statusFilter === 'all' ? (
                <>
                  <p>Нет записей о биллинге</p>
                  <Button
                    variant="primary"
                    onClick={() => setIsCreateModalOpen(true)}
                    style={{ marginTop: 'var(--space-md)' }}
                  >
                    Добавить первую запись
                  </Button>
                </>
              ) : (
                <p>Нет записей с выбранным статусом</p>
              )}
            </div>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <div className="billing__table-wrap">
            <Table className="billing__table">
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Сервер</TableHeaderCell>
                  <TableHeaderCell>Сумма</TableHeaderCell>
                  <TableHeaderCell>Статус</TableHeaderCell>
                  <TableHeaderCell>Следующая оплата</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredBillings.map((billing) => {
                  const nextPayment = formatNextPayment(billing.nextPaymentDate);
                  return (
                    <TableRow
                      key={billing.id}
                      className="billing__row"
                      onClick={() => setSelectedBilling(billing)}
                    >
                      <TableCell>
                        <div className="billing__server-name">{billing.server.name}</div>
                        <div className="billing__server-host">{billing.server.host}</div>
                      </TableCell>
                      <TableCell>
                        <span className="billing__amount">
                          {formatCurrency(billing.amount, billing.currency)}
                        </span>
                        <span className="billing__cycle">
                          /{getCycleLabel(billing.billingCycle)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(billing.paymentStatus)}>
                          {getStatusLabel(billing.paymentStatus)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={`billing__date ${nextPayment.className}`}>
                          {nextPayment.text}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Create/Edit Modal */}
      <CreateBillingModal
        isOpen={isCreateModalOpen || !!billingToEdit}
        onClose={() => {
          setIsCreateModalOpen(false);
          setBillingToEdit(null);
        }}
        billing={billingToEdit}
        onSuccess={handleRefetch}
      />

      {/* Detail Modal */}
      <BillingDetailModal
        billing={selectedBilling}
        onClose={() => setSelectedBilling(null)}
        onEdit={() => {
          setBillingToEdit(selectedBilling);
          setSelectedBilling(null);
        }}
        onDelete={() => {
          setBillingToDelete(selectedBilling);
          setSelectedBilling(null);
        }}
      />

      {/* Delete Confirmation */}
      <Modal isOpen={!!billingToDelete} onClose={() => setBillingToDelete(null)} size="sm">
        <ModalHeader onClose={() => setBillingToDelete(null)}>Удалить биллинг?</ModalHeader>
        <ModalBody>
          <p>
            Вы уверены, что хотите удалить запись биллинга для сервера{' '}
            <strong>{billingToDelete?.server.name}</strong>?
            Это действие нельзя отменить.
          </p>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setBillingToDelete(null)}>
            Отмена
          </Button>
          <Button variant="danger" onClick={handleDeleteBilling} loading={deleting}>
            Удалить
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

import { useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { useNavigate } from 'react-router-dom';
import { ALL_PAYMENT_HISTORY_QUERY, BILLING_SUMMARY_QUERY } from '@entities/project';
import { Card, CardBody, Skeleton } from '@shared/ui';
import './payments.css';

type Project = {
  id: string;
  name: string;
  color?: string;
  currency?: string;
};

type Payment = {
  id: string;
  amount: number;
  paymentDate: string;
  note?: string;
  monthsCovered: number;
  createdAt: string;
  project: Project;
};

type PaymentsData = {
  allPaymentHistory: Payment[];
};

type BillingSummary = {
  totalMonthly: number;
  totalUpcoming: number;
  upcomingPaymentsCount: number;
  overdueCount: number;
  overdueAmount: number;
};

type BillingSummaryData = {
  billingSummary: BillingSummary;
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  RUB: 'сомони',
  TJS: 'сомони',
};

export const PaymentsPage = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'month' | 'year'>('all');

  const { data, loading } = useQuery<PaymentsData>(ALL_PAYMENT_HISTORY_QUERY, {
    variables: { limit: 100 },
  });

  const { data: summaryData } = useQuery<BillingSummaryData>(BILLING_SUMMARY_QUERY);

  const payments = data?.allPaymentHistory || [];
  const summary = summaryData?.billingSummary;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number, currency?: string) => {
    const formatted = amount.toLocaleString('ru-RU');
    if (currency === 'TJS' || currency === 'RUB') return `${formatted} сомони`;
    const symbol = CURRENCY_SYMBOLS[currency || 'USD'] || currency || '$';
    return `${symbol}${formatted}`;
  };

  const getFilteredPayments = () => {
    if (filter === 'all') return payments;

    const now = new Date();
    const startDate = new Date();

    if (filter === 'month') {
      startDate.setMonth(now.getMonth() - 1);
    } else if (filter === 'year') {
      startDate.setFullYear(now.getFullYear() - 1);
    }

    return payments.filter((p) => new Date(p.paymentDate) >= startDate);
  };

  const filteredPayments = getFilteredPayments();

  const totalAmount = filteredPayments.reduce((sum, p) => sum + p.amount, 0);

  const groupPaymentsByMonth = (payments: Payment[]) => {
    const groups: Record<string, Payment[]> = {};

    payments.forEach((payment) => {
      const date = new Date(payment.paymentDate);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(payment);
    });

    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, payments]) => {
        const date = new Date(payments[0].paymentDate);
        return {
          key,
          label: date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' }),
          payments,
          total: payments.reduce((sum, p) => sum + p.amount, 0),
        };
      });
  };

  const groupedPayments = groupPaymentsByMonth(filteredPayments);

  const getPaymentsCountLabel = (count: number): string => {
    if (count === 0) return '0 оплат';
    if (count === 1) return '1 оплата';
    if (count >= 2 && count <= 4) return `${count} оплаты`;
    return `${count} оплат`;
  };

  return (
    <div className="payments-page">
      <div className="payments-page__header">
        <div className="payments-page__title">
          <h1>Оплаты</h1>
          <span className="payments-page__subtitle">{getPaymentsCountLabel(payments.length)}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="payments-page__stats">
        <Card>
          <CardBody>
            <div className="payments-page__stat">
              <span className="payments-page__stat-label">Всего за период</span>
              <span className="payments-page__stat-value">
                {formatCurrency(totalAmount, 'RUB')}
              </span>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="payments-page__stat">
              <span className="payments-page__stat-label">Ежемесячные расходы</span>
              <span className="payments-page__stat-value">
                {formatCurrency(summary?.totalMonthly || 0, 'RUB')}
              </span>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="payments-page__stat">
              <span className="payments-page__stat-label">Просрочено</span>
              <span className="payments-page__stat-value payments-page__stat-value--danger">
                {summary?.overdueCount || 0}
              </span>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Filter */}
      <div className="payments-page__filter">
        <button
          className={`payments-page__filter-btn ${filter === 'all' ? 'payments-page__filter-btn--active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Все время
        </button>
        <button
          className={`payments-page__filter-btn ${filter === 'year' ? 'payments-page__filter-btn--active' : ''}`}
          onClick={() => setFilter('year')}
        >
          За год
        </button>
        <button
          className={`payments-page__filter-btn ${filter === 'month' ? 'payments-page__filter-btn--active' : ''}`}
          onClick={() => setFilter('month')}
        >
          За месяц
        </button>
      </div>

      {/* Payments List */}
      {loading ? (
        <div className="payments-page__loading">
          <Skeleton width="100%" height={200} variant="rectangular" />
        </div>
      ) : filteredPayments.length === 0 ? (
        <Card>
          <CardBody>
            <div className="payments-page__empty">
              <p>Нет записей об оплатах</p>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="payments-page__list">
          {groupedPayments.map((group) => (
            <div key={group.key} className="payments-page__group">
              <div className="payments-page__group-header">
                <span className="payments-page__group-title">{group.label}</span>
                <span className="payments-page__group-total">
                  {formatCurrency(group.total, 'RUB')}
                </span>
              </div>

              <div className="payments-page__group-items">
                {group.payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="payments-page__item"
                    onClick={() => navigate(`/projects/${payment.project.id}`)}
                  >
                    <div className="payments-page__item-left">
                      <span
                        className="payments-page__item-dot"
                        style={{ backgroundColor: payment.project.color || '#737373' }}
                      />
                      <div className="payments-page__item-info">
                        <span className="payments-page__item-project">{payment.project.name}</span>
                        <span className="payments-page__item-date">{formatDate(payment.paymentDate)}</span>
                      </div>
                    </div>
                    <div className="payments-page__item-right">
                      <span className="payments-page__item-amount">
                        {formatCurrency(payment.amount, payment.project.currency)}
                      </span>
                      {payment.note && (
                        <span className="payments-page__item-note">{payment.note}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

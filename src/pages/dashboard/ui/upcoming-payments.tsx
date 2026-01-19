import { useQuery } from '@apollo/client/react';
import { Card, CardHeader, CardBody, Badge, Skeleton } from '@shared/ui';
import { BILLINGS_QUERY } from '../api';
import './upcoming-payments.css';

type Billing = {
  id: string;
  serviceName: string;
  amount: number;
  currency: string;
  nextPaymentDate: string;
  paymentStatus: string;
};

type BillingsData = {
  billings: Billing[];
};

const statusMap: Record<string, { variant: 'success' | 'error' | 'warning' | 'default'; label: string }> = {
  PAID: { variant: 'success', label: 'Оплачено' },
  PENDING: { variant: 'warning', label: 'Ожидает' },
  OVERDUE: { variant: 'error', label: 'Просрочен' },
  CANCELLED: { variant: 'default', label: 'Отменён' },
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
  });
};

export const UpcomingPayments = () => {
  const { data, loading } = useQuery<BillingsData>(BILLINGS_QUERY);

  const billings = data?.billings || [];
  const upcoming = billings
    .filter((b) => b.paymentStatus === 'PENDING' || b.paymentStatus === 'OVERDUE')
    .slice(0, 5);

  return (
    <Card padding="none">
      <CardHeader>
        <h3>Ближайшие платежи</h3>
      </CardHeader>
      <CardBody>
        {loading ? (
          <div className="upcoming-payments__loading">
            {[1, 2, 3].map((i) => (
              <div key={i} className="upcoming-payments__item">
                <Skeleton width={120} height={16} />
                <Skeleton width={80} height={20} />
              </div>
            ))}
          </div>
        ) : upcoming.length === 0 ? (
          <div className="upcoming-payments__empty">Нет предстоящих платежей</div>
        ) : (
          <div className="upcoming-payments__list">
            {upcoming.map((billing) => {
              const status = statusMap[billing.paymentStatus] || statusMap.PENDING;
              return (
                <div key={billing.id} className="upcoming-payments__item">
                  <div className="upcoming-payments__info">
                    <span className="upcoming-payments__name">{billing.serviceName}</span>
                    <span className="upcoming-payments__date">{formatDate(billing.nextPaymentDate)}</span>
                  </div>
                  <div className="upcoming-payments__right">
                    <span className="upcoming-payments__amount">
                      {billing.amount.toLocaleString()} {billing.currency === 'RUB' ? '₽' : billing.currency}
                    </span>
                    <Badge variant={status.variant} size="sm">
                      {status.label}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardBody>
    </Card>
  );
};

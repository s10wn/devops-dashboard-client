import { gql } from '@apollo/client';

export const SERVER_BILLING_QUERY = gql`
  query ServerBilling($serverId: ID!) {
    serverBilling(serverId: $serverId) {
      id
      amount
      currency
      billingCycle
      nextPaymentDate
      paymentStatus
      accountId
      notes
      remindDaysBefore
      server {
        id
        name
        host
      }
    }
  }
`;

export const BILLINGS_QUERY = gql`
  query Billings {
    billings {
      id
      amount
      currency
      billingCycle
      nextPaymentDate
      paymentStatus
      accountId
      notes
      remindDaysBefore
      server {
        id
        name
        host
      }
    }
  }
`;

export const BILLING_SUMMARY_QUERY = gql`
  query BillingSummary {
    billingSummary {
      totalMonthly
      totalUpcoming
      upcomingPaymentsCount
      overdueCount
      overdueAmount
    }
  }
`;

export const PAYMENT_HISTORY_QUERY = gql`
  query PaymentHistory($billingId: ID!) {
    paymentHistory(billingId: $billingId) {
      id
      amount
      currency
      paymentDate
      status
      transactionId
      notes
      createdAt
    }
  }
`;

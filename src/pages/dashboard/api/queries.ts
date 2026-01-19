import { gql } from '@apollo/client';

export const SERVERS_QUERY = gql`
  query Servers {
    servers {
      id
      name
      host
      status
      lastCheckAt
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

export const BILLINGS_QUERY = gql`
  query Billings {
    billings {
      id
      serviceName
      amount
      currency
      nextPaymentDate
      paymentStatus
    }
  }
`;

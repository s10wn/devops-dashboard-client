import { gql } from '@apollo/client';

export const TEAM_SERVERS_QUERY = gql`
  query TeamServers($teamId: ID!) {
    teamServers(teamId: $teamId) {
      id
      name
      host
      status
      lastCheckAt
    }
  }
`;

export const BILLING_SUMMARY_QUERY = gql`
  query BillingSummary($teamId: ID!) {
    billingSummary(teamId: $teamId) {
      totalMonthly
      totalUpcoming
      upcomingPaymentsCount
      overdueCount
      overdueAmount
    }
  }
`;

export const TEAM_BILLINGS_QUERY = gql`
  query TeamBillings($teamId: ID!) {
    teamBillings(teamId: $teamId) {
      id
      serviceName
      amount
      currency
      nextPaymentDate
      paymentStatus
    }
  }
`;

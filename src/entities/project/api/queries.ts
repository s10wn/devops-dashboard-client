import { gql } from '@apollo/client';

// Project queries
export const PROJECT_QUERY = gql`
  query GetProject($id: ID!) {
    project(id: $id) {
      id
      name
      slug
      description
      color
      isActive
      provider
      monthlyCost
      currency
      nextPaymentDate
      lastPaymentDate
      createdAt
      updatedAt
    }
  }
`;

export const PROJECTS_QUERY = gql`
  query Projects {
    projects {
      id
      name
      slug
      description
      color
      isActive
      provider
      monthlyCost
      currency
      nextPaymentDate
      lastPaymentDate
      createdAt
    }
  }
`;

// Billing queries
export const PROJECTS_WITH_BILLING_QUERY = gql`
  query ProjectsWithBilling {
    projectsWithBilling {
      id
      name
      provider
      monthlyCost
      currency
      nextPaymentDate
      lastPaymentDate
      daysUntilPayment
      isOverdue
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

export const PROJECT_PAYMENT_HISTORY_QUERY = gql`
  query ProjectPaymentHistory($projectId: ID!) {
    projectPaymentHistory(projectId: $projectId) {
      id
      amount
      paymentDate
      note
      monthsCovered
      projectId
      createdAt
    }
  }
`;

export const ALL_PAYMENT_HISTORY_QUERY = gql`
  query AllPaymentHistory($limit: Int) {
    allPaymentHistory(limit: $limit) {
      id
      amount
      paymentDate
      note
      monthsCovered
      createdAt
      project {
        id
        name
        color
      }
    }
  }
`;

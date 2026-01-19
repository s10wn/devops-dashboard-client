import { gql } from '@apollo/client';

// Project mutations
export const CREATE_PROJECT_MUTATION = gql`
  mutation CreateProject($input: CreateProjectInput!) {
    createProject(input: $input) {
      id
      name
      slug
      provider
      monthlyCost
      currency
      nextPaymentDate
    }
  }
`;

export const UPDATE_PROJECT_MUTATION = gql`
  mutation UpdateProject($input: UpdateProjectInput!) {
    updateProject(input: $input) {
      id
      name
      description
      provider
      monthlyCost
      currency
      nextPaymentDate
    }
  }
`;

export const DELETE_PROJECT_MUTATION = gql`
  mutation DeleteProject($projectId: ID!) {
    deleteProject(projectId: $projectId)
  }
`;

export const ARCHIVE_PROJECT_MUTATION = gql`
  mutation ArchiveProject($projectId: ID!) {
    archiveProject(projectId: $projectId) {
      id
      name
      isActive
    }
  }
`;

// Billing mutations
export const RECORD_PROJECT_PAYMENT_MUTATION = gql`
  mutation RecordProjectPayment($input: RecordProjectPaymentInput!) {
    recordProjectPayment(input: $input) {
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

export const UPDATE_PROJECT_BILLING_MUTATION = gql`
  mutation UpdateProjectBilling($input: UpdateProjectBillingInput!) {
    updateProjectBilling(input: $input) {
      id
      name
      provider
      monthlyCost
      currency
      nextPaymentDate
    }
  }
`;

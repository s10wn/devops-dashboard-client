import { gql } from '@apollo/client';

export const CREATE_BILLING_MUTATION = gql`
  mutation CreateBilling($input: CreateBillingInput!) {
    createBilling(input: $input) {
      id
      amount
      currency
      billingCycle
      nextPaymentDate
      paymentStatus
    }
  }
`;

export const UPDATE_BILLING_MUTATION = gql`
  mutation UpdateBilling($input: UpdateBillingInput!) {
    updateBilling(input: $input) {
      id
      amount
      currency
      billingCycle
      nextPaymentDate
      paymentStatus
    }
  }
`;

export const DELETE_BILLING_MUTATION = gql`
  mutation DeleteBilling($billingId: ID!) {
    deleteBilling(billingId: $billingId)
  }
`;

export const RECORD_PAYMENT_MUTATION = gql`
  mutation RecordPayment($input: RecordPaymentInput!) {
    recordPayment(input: $input) {
      id
      amount
      currency
      paymentDate
      status
      transactionId
      notes
    }
  }
`;

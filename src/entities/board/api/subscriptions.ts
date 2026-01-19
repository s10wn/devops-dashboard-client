import { gql } from '@apollo/client';

export const TASK_CREATED_SUBSCRIPTION = gql`
  subscription TaskCreated($boardId: ID!) {
    taskCreated(boardId: $boardId) {
      id
      title
      description
      priority
      position
      columnId
      assignee {
        id
        name
        avatarUrl
      }
      labels {
        id
        name
        color
      }
    }
  }
`;

export const TASK_UPDATED_SUBSCRIPTION = gql`
  subscription TaskUpdated($boardId: ID!) {
    taskUpdated(boardId: $boardId) {
      id
      title
      description
      priority
      dueDate
      estimatedHours
      assignee {
        id
        name
        avatarUrl
      }
      labels {
        id
        name
        color
      }
    }
  }
`;

export const TASK_MOVED_SUBSCRIPTION = gql`
  subscription TaskMoved($boardId: ID!) {
    taskMoved(boardId: $boardId) {
      id
      columnId
      position
    }
  }
`;

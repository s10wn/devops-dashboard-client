import { gql } from '@apollo/client';

// Column queries
export const MY_COLUMNS_QUERY = gql`
  query MyColumns {
    myColumns {
      id
      name
      color
      position
      wipLimit
      userId
    }
  }
`;

export const COLUMN_QUERY = gql`
  query GetColumn($id: ID!) {
    column(id: $id) {
      id
      name
      color
      position
    }
  }
`;

// Task queries
export const TASKS_QUERY = gql`
  query Tasks($filter: TasksFilterInput) {
    tasks(filter: $filter) {
      id
      title
      description
      priority
      position
      dueDate
      columnId
      projectId
      project {
        id
        name
        color
      }
      assigneeId
      createdById
      createdAt
    }
  }
`;

export const TASK_QUERY = gql`
  query GetTask($id: ID!) {
    task(id: $id) {
      id
      title
      description
      priority
      position
      dueDate
      columnId
      projectId
      project {
        id
        name
        color
      }
      labels {
        id
        name
        color
      }
      comments {
        id
        content
        author {
          id
          name
        }
        createdAt
      }
      createdAt
      updatedAt
    }
  }
`;

export const LABELS_QUERY = gql`
  query MyLabels {
    myLabels {
      id
      name
      color
    }
  }
`;

export const TASK_COMMENTS_QUERY = gql`
  query TaskComments($taskId: ID!) {
    taskComments(taskId: $taskId) {
      id
      content
      author {
        id
        name
        avatarUrl
      }
      createdAt
      updatedAt
    }
  }
`;

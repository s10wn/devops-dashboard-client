import { gql } from '@apollo/client';

export const TASK_CREATED_SUBSCRIPTION = gql`
  subscription OnTaskCreated {
    taskCreated {
      id
      title
      columnId
      projectId
    }
  }
`;

export const TASK_UPDATED_SUBSCRIPTION = gql`
  subscription OnTaskUpdated {
    taskUpdated {
      id
      title
      columnId
      projectId
    }
  }
`;

export const TASK_MOVED_SUBSCRIPTION = gql`
  subscription OnTaskMoved {
    taskMoved {
      id
      columnId
      position
      previousColumnId
    }
  }
`;

export const TASK_DELETED_SUBSCRIPTION = gql`
  subscription OnTaskDeleted {
    taskDeleted {
      id
      columnId
    }
  }
`;

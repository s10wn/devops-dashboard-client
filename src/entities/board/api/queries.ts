import { gql } from '@apollo/client';

export const BOARD_QUERY = gql`
  query Board($id: ID!) {
    board(id: $id) {
      id
      name
      slug
      description
      columns {
        id
        name
        color
        position
        wipLimit
        tasks {
          id
          title
          description
          priority
          position
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
    }
  }
`;

export const MY_BOARDS_QUERY = gql`
  query MyBoards {
    myBoards {
      id
      name
      slug
    }
  }
`;

export const TASK_QUERY = gql`
  query Task($id: ID!) {
    task(id: $id) {
      id
      title
      description
      priority
      position
      dueDate
      estimatedHours
      columnId
      assignee {
        id
        name
        email
        avatarUrl
      }
      labels {
        id
        name
        color
      }
      createdAt
      updatedAt
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

import { gql } from '@apollo/client';

export const BOARD_QUERY = gql`
  query Board($id: ID!) {
    board(id: $id) {
      id
      name
      slug
      description
      teamId
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

export const TEAM_BOARDS_QUERY = gql`
  query TeamBoards($teamId: ID!) {
    teamBoards(teamId: $teamId) {
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

export const TEAM_LABELS_QUERY = gql`
  query TeamLabels($teamId: ID!) {
    teamLabels(teamId: $teamId) {
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

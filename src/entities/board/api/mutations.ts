import { gql } from '@apollo/client';

// Column mutations
export const CREATE_COLUMN_MUTATION = gql`
  mutation CreateColumn($input: CreateColumnInput!) {
    createColumn(input: $input) {
      id
      name
      color
      position
    }
  }
`;

export const UPDATE_COLUMN_MUTATION = gql`
  mutation UpdateColumn($input: UpdateColumnInput!) {
    updateColumn(input: $input) {
      id
      name
      color
    }
  }
`;

export const MOVE_COLUMN_MUTATION = gql`
  mutation MoveColumn($input: MoveColumnInput!) {
    moveColumn(input: $input) {
      id
      position
    }
  }
`;

export const DELETE_COLUMN_MUTATION = gql`
  mutation DeleteColumn($columnId: ID!) {
    deleteColumn(columnId: $columnId)
  }
`;

// Task mutations
export const CREATE_TASK_MUTATION = gql`
  mutation CreateTask($input: CreateTaskInput!) {
    createTask(input: $input) {
      id
      title
      projectId
    }
  }
`;

export const UPDATE_TASK_MUTATION = gql`
  mutation UpdateTask($input: UpdateTaskInput!) {
    updateTask(input: $input) {
      id
      title
      projectId
    }
  }
`;

export const MOVE_TASK_MUTATION = gql`
  mutation MoveTask($taskId: ID!, $columnId: ID!, $position: Int!) {
    moveTask(taskId: $taskId, columnId: $columnId, position: $position) {
      id
      columnId
      position
    }
  }
`;

export const DELETE_TASK_MUTATION = gql`
  mutation DeleteTask($taskId: ID!) {
    deleteTask(taskId: $taskId)
  }
`;

// Label mutations
export const CREATE_LABEL_MUTATION = gql`
  mutation CreateLabel($input: CreateLabelInput!) {
    createLabel(input: $input) {
      id
      name
      color
    }
  }
`;

export const UPDATE_LABEL_MUTATION = gql`
  mutation UpdateLabel($input: UpdateLabelInput!) {
    updateLabel(input: $input) {
      id
      name
      color
    }
  }
`;

export const DELETE_LABEL_MUTATION = gql`
  mutation DeleteLabel($labelId: ID!) {
    deleteLabel(labelId: $labelId)
  }
`;

// Comment mutations
export const ADD_TASK_COMMENT_MUTATION = gql`
  mutation AddTaskComment($input: AddCommentInput!) {
    addTaskComment(input: $input) {
      id
      content
      author {
        id
        name
        avatarUrl
      }
      createdAt
    }
  }
`;

export const UPDATE_TASK_COMMENT_MUTATION = gql`
  mutation UpdateTaskComment($input: UpdateCommentInput!) {
    updateTaskComment(input: $input) {
      id
      content
      updatedAt
    }
  }
`;

export const DELETE_TASK_COMMENT_MUTATION = gql`
  mutation DeleteTaskComment($commentId: ID!) {
    deleteTaskComment(commentId: $commentId)
  }
`;

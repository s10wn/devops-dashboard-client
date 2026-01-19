import { gql } from '@apollo/client';

// Board mutations
export const CREATE_BOARD_MUTATION = gql`
  mutation CreateBoard($input: CreateBoardInput!) {
    createBoard(input: $input) {
      id
      name
      slug
    }
  }
`;

export const UPDATE_BOARD_MUTATION = gql`
  mutation UpdateBoard($input: UpdateBoardInput!) {
    updateBoard(input: $input) {
      id
      name
      description
    }
  }
`;

export const DELETE_BOARD_MUTATION = gql`
  mutation DeleteBoard($boardId: ID!) {
    deleteBoard(boardId: $boardId)
  }
`;

// Column mutations
export const CREATE_COLUMN_MUTATION = gql`
  mutation CreateColumn($input: CreateColumnInput!) {
    createColumn(input: $input) {
      id
      name
      color
      position
      wipLimit
    }
  }
`;

export const UPDATE_COLUMN_MUTATION = gql`
  mutation UpdateColumn($input: UpdateColumnInput!) {
    updateColumn(input: $input) {
      id
      name
      color
      wipLimit
    }
  }
`;

export const REORDER_COLUMNS_MUTATION = gql`
  mutation ReorderColumns($input: ReorderColumnsInput!) {
    reorderColumns(input: $input) {
      id
      columns {
        id
        position
      }
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
`;

export const UPDATE_TASK_MUTATION = gql`
  mutation UpdateTask($input: UpdateTaskInput!) {
    updateTask(input: $input) {
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

export const MOVE_TASK_MUTATION = gql`
  mutation MoveTask($input: MoveTaskInput!) {
    moveTask(input: $input) {
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

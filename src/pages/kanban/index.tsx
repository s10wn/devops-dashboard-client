import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import {
  BOARD_QUERY,
  BOARDS_QUERY,
  LABELS_QUERY,
  MOVE_TASK_MUTATION,
  TASK_CREATED_SUBSCRIPTION,
  TASK_UPDATED_SUBSCRIPTION,
  TASK_MOVED_SUBSCRIPTION,
} from '@entities/board';
import { Button, Dropdown, DropdownItem, DropdownDivider, Skeleton } from '@shared/ui';
import { CreateBoardModal } from './ui/create-board-modal';
import { CreateColumnModal } from './ui/create-column-modal';
import { TaskModal } from './ui/task-modal';
import './kanban.css';

type Label = {
  id: string;
  name: string;
  color: string;
};

type Assignee = {
  id: string;
  name: string;
  avatarUrl?: string;
};

type Task = {
  id: string;
  title: string;
  description?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  position: number;
  dueDate?: string;
  estimatedHours?: number;
  assignee?: Assignee;
  labels: Label[];
};

type Column = {
  id: string;
  name: string;
  color: string;
  position: number;
  wipLimit?: number;
  tasks: Task[];
};

type Board = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  columns: Column[];
};

type BoardListItem = {
  id: string;
  name: string;
  slug: string;
};

export const KanbanPage = () => {
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [isCreateBoardOpen, setIsCreateBoardOpen] = useState(false);
  const [isCreateColumnOpen, setIsCreateColumnOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedColumnId, setSelectedColumnId] = useState<string | null>(null);
  const [draggedTask, setDraggedTask] = useState<{ taskId: string; columnId: string } | null>(null);

  const { data: boardsData, loading: boardsLoading } = useQuery<{ boards: BoardListItem[] }>(
    BOARDS_QUERY
  );

  useEffect(() => {
    const boards = boardsData?.boards;
    if (boards && boards.length > 0 && !selectedBoardId) {
      setSelectedBoardId(boards[0].id);
    }
  }, [boardsData, selectedBoardId]);

  const { data: boardData, loading: boardLoading, refetch: refetchBoard, subscribeToMore } = useQuery<{ board: Board }>(
    BOARD_QUERY,
    {
      variables: { id: selectedBoardId },
      skip: !selectedBoardId,
    }
  );

  // Real-time subscriptions
  useEffect(() => {
    if (!selectedBoardId || !subscribeToMore) return;

    const unsubscribeCreated = subscribeToMore({
      document: TASK_CREATED_SUBSCRIPTION,
      variables: { boardId: selectedBoardId },
      updateQuery: () => {
        refetchBoard();
      },
    });

    const unsubscribeUpdated = subscribeToMore({
      document: TASK_UPDATED_SUBSCRIPTION,
      variables: { boardId: selectedBoardId },
      updateQuery: () => {
        refetchBoard();
      },
    });

    const unsubscribeMoved = subscribeToMore({
      document: TASK_MOVED_SUBSCRIPTION,
      variables: { boardId: selectedBoardId },
      updateQuery: () => {
        refetchBoard();
      },
    });

    return () => {
      unsubscribeCreated();
      unsubscribeUpdated();
      unsubscribeMoved();
    };
  }, [selectedBoardId, subscribeToMore, refetchBoard]);

  const { data: labelsData } = useQuery<{ labels: Label[] }>(LABELS_QUERY);

  const [moveTask] = useMutation(MOVE_TASK_MUTATION, {
    refetchQueries: selectedBoardId ? [{ query: BOARD_QUERY, variables: { id: selectedBoardId } }] : [],
  });

  const boards = (boardsData?.boards || []) as BoardListItem[];
  const board = boardData?.board as Board | undefined;
  const labels = (labelsData?.labels || []) as Label[];
  const selectedBoard = boards.find((b) => b.id === selectedBoardId);

  const handleDragStart = useCallback((e: React.DragEvent, taskId: string, columnId: string) => {
    setDraggedTask({ taskId, columnId });
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent, targetColumnId: string, position: number) => {
      e.preventDefault();
      if (!draggedTask) return;

      const { taskId, columnId: sourceColumnId } = draggedTask;

      if (sourceColumnId === targetColumnId) {
        setDraggedTask(null);
        return;
      }

      try {
        await moveTask({
          variables: {
            input: {
              taskId,
              targetColumnId,
              newPosition: position,
            },
          },
          refetchQueries: [{ query: BOARD_QUERY, variables: { id: selectedBoardId } }],
          awaitRefetchQueries: true,
        });
      } catch (error) {
        console.error('Failed to move task:', error);
      }

      setDraggedTask(null);
    },
    [draggedTask, moveTask, selectedBoardId]
  );

  const handleAddTask = (columnId: string) => {
    setSelectedColumnId(columnId);
    setSelectedTask(null);
  };

  const handleTaskClick = (task: Task, columnId: string) => {
    setSelectedTask(task);
    setSelectedColumnId(columnId);
  };

  const formatDueDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    const formatted = date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });

    if (diffDays < 0) return { text: formatted, status: 'overdue' };
    if (diffDays <= 2) return { text: formatted, status: 'soon' };
    return { text: formatted, status: 'normal' };
  };

  const getPriorityIcon = (priority: Task['priority']) => {
    const icons = {
      LOW: '○',
      MEDIUM: '◐',
      HIGH: '●',
      URGENT: '◉',
    };
    return icons[priority];
  };

  if (boardsLoading) {
    return (
      <div className="kanban__loading">
        <Skeleton width={300} height={400} variant="rectangular" />
      </div>
    );
  }

  return (
    <div className="kanban">
      <header className="kanban__header">
        <div className="kanban__header-left">
          <h1 className="kanban__title">Канбан</h1>
          {boards.length > 0 && (
            <Dropdown
              trigger={
                <button type="button" className="kanban__board-selector">
                  {selectedBoard?.name || 'Выберите доску'}
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M4 6l4 4 4-4" />
                  </svg>
                </button>
              }
            >
              {boards.map((b) => (
                <DropdownItem key={b.id} onClick={() => setSelectedBoardId(b.id)}>
                  {b.name}
                </DropdownItem>
              ))}
              <DropdownDivider />
              <DropdownItem onClick={() => setIsCreateBoardOpen(true)}>
                + Создать доску
              </DropdownItem>
            </Dropdown>
          )}
        </div>
        <div className="kanban__header-actions">
          <Button variant="primary" size="sm" onClick={() => setIsCreateBoardOpen(true)}>
            + Доска
          </Button>
        </div>
      </header>

      {boards.length === 0 ? (
        <div className="kanban__empty">
          <svg className="kanban__empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="7" height="18" rx="1" />
            <rect x="14" y="3" width="7" height="12" rx="1" />
          </svg>
          <h2 className="kanban__empty-title">Нет досок</h2>
          <p className="kanban__empty-text">Создайте первую доску для управления задачами</p>
          <Button variant="primary" onClick={() => setIsCreateBoardOpen(true)}>
            Создать доску
          </Button>
        </div>
      ) : boardLoading ? (
        <div className="kanban__board">
          {[1, 2, 3].map((i) => (
            <div key={i} className="kanban__column">
              <Skeleton width="100%" height={40} variant="rectangular" />
              <div style={{ padding: '8px' }}>
                <Skeleton width="100%" height={80} variant="rectangular" />
              </div>
            </div>
          ))}
        </div>
      ) : board ? (
        <div className="kanban__board">
          {board.columns
            .slice()
            .sort((a, b) => a.position - b.position)
            .map((column) => (
              <div key={column.id} className="kanban__column">
                <div className="kanban__column-header">
                  <div className="kanban__column-title">
                    <span className="kanban__column-dot" style={{ backgroundColor: column.color }} />
                    {column.name}
                    <span className="kanban__column-count">{column.tasks.length}</span>
                  </div>
                  <div className="kanban__column-actions">
                    <button type="button" className="kanban__column-btn" title="Настройки колонки">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="8" cy="3" r="1" />
                        <circle cx="8" cy="8" r="1" />
                        <circle cx="8" cy="13" r="1" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div
                  className={`kanban__column-tasks ${
                    column.tasks.length === 0 ? 'kanban__column-tasks--empty' : ''
                  }`}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, column.id, column.tasks.length)}
                >
                  {column.tasks.length === 0 ? (
                    <span>Нет задач</span>
                  ) : (
                    column.tasks
                      .slice()
                      .sort((a, b) => a.position - b.position)
                      .map((task) => (
                        <div
                          key={task.id}
                          className={`task-card ${draggedTask?.taskId === task.id ? 'task-card--dragging' : ''}`}
                          draggable
                          onDragStart={(e) => handleDragStart(e, task.id, column.id)}
                          onClick={() => handleTaskClick(task, column.id)}
                        >
                          {task.labels.length > 0 && (
                            <div className="task-card__labels">
                              {task.labels.map((label) => (
                                <span
                                  key={label.id}
                                  className="task-card__label"
                                  style={{
                                    backgroundColor: `${label.color}20`,
                                    color: label.color,
                                  }}
                                >
                                  {label.name}
                                </span>
                              ))}
                            </div>
                          )}
                          <div className="task-card__title">{task.title}</div>
                          <div className="task-card__meta">
                            <div className="task-card__info">
                              <span className={`task-card__priority task-card__priority--${task.priority.toLowerCase()}`}>
                                {getPriorityIcon(task.priority)}
                              </span>
                              {task.dueDate && (() => {
                                const due = formatDueDate(task.dueDate);
                                return (
                                  <span className={`task-card__due task-card__due--${due.status}`}>
                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                                      <circle cx="6" cy="6" r="4.5" />
                                      <path d="M6 4v2.5l1.5 1" />
                                    </svg>
                                    {due.text}
                                  </span>
                                );
                              })()}
                            </div>
                            {task.assignee && (
                              <div className="task-card__assignee">
                                {task.assignee.avatarUrl ? (
                                  <img src={task.assignee.avatarUrl} alt={task.assignee.name} />
                                ) : (
                                  task.assignee.name.charAt(0).toUpperCase()
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                  )}
                </div>

                <button
                  type="button"
                  className="kanban__add-task"
                  onClick={() => handleAddTask(column.id)}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M8 3v10M3 8h10" />
                  </svg>
                  Добавить задачу
                </button>
              </div>
            ))}

          <button
            type="button"
            className="kanban__add-column"
            onClick={() => setIsCreateColumnOpen(true)}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M10 4v12M4 10h12" />
            </svg>
            Добавить колонку
          </button>
        </div>
      ) : null}

      <CreateBoardModal
        isOpen={isCreateBoardOpen}
        onClose={() => setIsCreateBoardOpen(false)}
      />

      {selectedBoardId && (
        <CreateColumnModal
          isOpen={isCreateColumnOpen}
          onClose={() => setIsCreateColumnOpen(false)}
          boardId={selectedBoardId}
          position={board?.columns.length || 0}
        />
      )}

      {selectedColumnId && (
        <TaskModal
          isOpen={selectedColumnId !== null}
          onClose={() => {
            setSelectedTask(null);
            setSelectedColumnId(null);
          }}
          task={selectedTask}
          columnId={selectedColumnId}
          labels={labels}
          boardId={selectedBoardId!}
        />
      )}
    </div>
  );
};

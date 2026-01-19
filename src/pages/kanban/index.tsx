import { useState, useCallback, useEffect, useMemo } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import {
  MY_COLUMNS_QUERY,
  TASKS_QUERY,
  LABELS_QUERY,
  MOVE_TASK_MUTATION,
  TASK_CREATED_SUBSCRIPTION,
  TASK_UPDATED_SUBSCRIPTION,
  TASK_MOVED_SUBSCRIPTION,
  TASK_DELETED_SUBSCRIPTION,
} from '@entities/board';
import { MY_PROJECTS_QUERY } from '@entities/project';
import { Button, Dropdown, DropdownItem, Skeleton } from '@shared/ui';
import { CreateColumnModal } from './ui/create-column-modal';
import { TaskModal } from './ui/task-modal';
import './kanban.css';

type Label = {
  id: string;
  name: string;
  color: string;
};

type Project = {
  id: string;
  name: string;
  color: string;
};

type Task = {
  id: string;
  title: string;
  description?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  position: number;
  dueDate?: string;
  columnId: string;
  projectId?: string;
  project?: Project;
  assigneeId?: string;
  createdById?: string;
  createdAt: string;
};

type Column = {
  id: string;
  name: string;
  color: string;
  position: number;
  wipLimit?: number;
  userId: string;
};

type ProjectListItem = {
  id: string;
  name: string;
  color?: string;
};

type TasksFilter = {
  projectIds?: string[];
  columnId?: string;
  includeNoProject?: boolean;
};

export const KanbanPage = () => {
  const [isCreateColumnOpen, setIsCreateColumnOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedColumnId, setSelectedColumnId] = useState<string | null>(null);
  const [draggedTask, setDraggedTask] = useState<{ taskId: string; columnId: string } | null>(null);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);

  // Fetch columns
  const {
    data: columnsData,
    loading: columnsLoading,
    refetch: refetchColumns,
  } = useQuery<{ myColumns: Column[] }>(MY_COLUMNS_QUERY);

  // Fetch projects for filter
  const { data: projectsData } = useQuery<{ myProjects: ProjectListItem[] }>(MY_PROJECTS_QUERY);

  // Build filter for tasks
  const tasksFilter: TasksFilter = useMemo(() => {
    if (selectedProjectIds.length > 0) {
      return { projectIds: selectedProjectIds };
    }
    return {};
  }, [selectedProjectIds]);

  // Fetch tasks with filter
  const {
    data: tasksData,
    loading: tasksLoading,
    refetch: refetchTasks,
    subscribeToMore,
  } = useQuery<{ tasks: Task[] }>(TASKS_QUERY, {
    variables: { filter: tasksFilter },
  });

  // Real-time subscriptions
  useEffect(() => {
    if (!subscribeToMore) return;

    const unsubscribeCreated = subscribeToMore({
      document: TASK_CREATED_SUBSCRIPTION,
      updateQuery: () => {
        refetchTasks();
        return undefined as never;
      },
    });

    const unsubscribeUpdated = subscribeToMore({
      document: TASK_UPDATED_SUBSCRIPTION,
      updateQuery: () => {
        refetchTasks();
        return undefined as never;
      },
    });

    const unsubscribeMoved = subscribeToMore({
      document: TASK_MOVED_SUBSCRIPTION,
      updateQuery: () => {
        refetchTasks();
        return undefined as never;
      },
    });

    const unsubscribeDeleted = subscribeToMore({
      document: TASK_DELETED_SUBSCRIPTION,
      updateQuery: () => {
        refetchTasks();
        return undefined as never;
      },
    });

    return () => {
      unsubscribeCreated();
      unsubscribeUpdated();
      unsubscribeMoved();
      unsubscribeDeleted();
    };
  }, [subscribeToMore, refetchTasks]);

  const { data: labelsData } = useQuery<{ myLabels: Label[] }>(LABELS_QUERY);

  const [moveTask] = useMutation(MOVE_TASK_MUTATION, {
    onCompleted: () => {
      refetchTasks();
    },
  });

  const columns = (columnsData?.myColumns || []) as Column[];
  const tasks = (tasksData?.tasks || []) as Task[];
  const labels = (labelsData?.myLabels || []) as Label[];
  const projects = (projectsData?.myProjects || []) as ProjectListItem[];

  // Group tasks by columnId
  const tasksByColumn = useMemo(() => {
    const grouped: Record<string, Task[]> = {};
    columns.forEach((col) => {
      grouped[col.id] = [];
    });
    tasks.forEach((task) => {
      if (grouped[task.columnId]) {
        grouped[task.columnId].push(task);
      }
    });
    // Sort tasks by position within each column
    Object.keys(grouped).forEach((colId) => {
      grouped[colId].sort((a, b) => a.position - b.position);
    });
    return grouped;
  }, [columns, tasks]);

  const totalTasksCount = tasks.length;

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

      const { taskId } = draggedTask;

      try {
        await moveTask({
          variables: {
            taskId,
            columnId: targetColumnId,
            position,
          },
        });
      } catch (error) {
        // Error handling
      }

      setDraggedTask(null);
    },
    [draggedTask, moveTask]
  );

  const handleAddTask = (columnId: string) => {
    setSelectedColumnId(columnId);
    setSelectedTask(null);
  };

  const handleTaskClick = (task: Task, columnId: string) => {
    setSelectedTask(task);
    setSelectedColumnId(columnId);
  };

  const handleProjectFilterToggle = (projectId: string) => {
    setSelectedProjectIds((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId]
    );
  };

  const handleClearFilter = () => {
    setSelectedProjectIds([]);
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

  const getTasksCountLabel = (count: number): string => {
    if (count === 0) return '0 задач';
    if (count === 1) return '1 задача';
    if (count >= 2 && count <= 4) return `${count} задачи`;
    return `${count} задач`;
  };

  const loading = columnsLoading || tasksLoading;

  if (loading && columns.length === 0) {
    return (
      <div className="kanban__loading">
        <Skeleton width={300} height={400} variant="rectangular" />
      </div>
    );
  }

  return (
    <div className="kanban">
      <div className="kanban__header">
        <div className="kanban__title">
          <h1>Канбан</h1>
          <span className="kanban__subtitle">{getTasksCountLabel(totalTasksCount)}</span>
        </div>
        <div className="kanban__actions">
          {/* Project Filter */}
          {projects.length > 0 && (
            <Dropdown
              trigger={
                <button type="button" className={`kanban__filter-btn ${selectedProjectIds.length > 0 ? 'kanban__filter-btn--active' : ''}`}>
                  {selectedProjectIds.length > 0 ? (
                    <>
                      <div className="kanban__filter-dots">
                        {selectedProjectIds.slice(0, 3).map((id) => {
                          const project = projects.find(p => p.id === id);
                          return (
                            <span
                              key={id}
                              className="kanban__filter-dot-preview"
                              style={{ backgroundColor: project?.color || '#737373' }}
                            />
                          );
                        })}
                      </div>
                      {selectedProjectIds.length > 3 && (
                        <span className="kanban__filter-more">+{selectedProjectIds.length - 3}</span>
                      )}
                      <span className="kanban__filter-label">
                        {selectedProjectIds.length === 1
                          ? projects.find(p => p.id === selectedProjectIds[0])?.name
                          : `${selectedProjectIds.length} проекта`}
                      </span>
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="8" cy="8" r="3" />
                        <path d="M8 2v2M8 12v2M2 8h2M12 8h2" />
                      </svg>
                      <span>Все проекты</span>
                    </>
                  )}
                  <svg className="kanban__filter-chevron" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M3 5l3 3 3-3" />
                  </svg>
                </button>
              }
            >
              {selectedProjectIds.length > 0 && (
                <DropdownItem onClick={handleClearFilter}>
                  <div className="kanban__filter-item kanban__filter-item--reset">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M10 4L4 10M4 4l6 6" />
                    </svg>
                    <span>Сбросить фильтр</span>
                  </div>
                </DropdownItem>
              )}
              {projects.map((project) => (
                <DropdownItem
                  key={project.id}
                  onClick={() => handleProjectFilterToggle(project.id)}
                >
                  <div className="kanban__filter-item">
                    <span
                      className="kanban__filter-dot"
                      style={{ backgroundColor: project.color || '#737373' }}
                    />
                    <span>{project.name}</span>
                    {selectedProjectIds.includes(project.id) && (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4L5.5 9.5 3 7" />
                      </svg>
                    )}
                  </div>
                </DropdownItem>
              ))}
            </Dropdown>
          )}

          <button type="button" className="kanban__add-column-btn" onClick={() => setIsCreateColumnOpen(true)}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 2v10M2 7h10" />
            </svg>
            Колонка
          </button>
        </div>
      </div>

      {columns.length === 0 ? (
        <div className="kanban__empty">
          <svg className="kanban__empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="7" height="18" rx="1" />
            <rect x="14" y="3" width="7" height="12" rx="1" />
          </svg>
          <h2 className="kanban__empty-title">Нет колонок</h2>
          <p className="kanban__empty-text">Создайте первую колонку для управления задачами</p>
          <Button variant="primary" onClick={() => setIsCreateColumnOpen(true)}>
            Создать колонку
          </Button>
        </div>
      ) : (
        <div className="kanban__board">
          {columns
            .slice()
            .sort((a, b) => a.position - b.position)
            .map((column) => {
              const columnTasks = tasksByColumn[column.id] || [];
              return (
                <div key={column.id} className="kanban__column">
                  <div className="kanban__column-header">
                    <div className="kanban__column-title">
                      <span className="kanban__column-dot" style={{ backgroundColor: column.color }} />
                      {column.name}
                      <span className="kanban__column-count">{columnTasks.length}</span>
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
                      columnTasks.length === 0 ? 'kanban__column-tasks--empty' : ''
                    }`}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, column.id, columnTasks.length)}
                  >
                    {columnTasks.length === 0 ? (
                      <span>Нет задач</span>
                    ) : (
                      columnTasks.map((task) => (
                        <div
                          key={task.id}
                          className={`task-card ${draggedTask?.taskId === task.id ? 'task-card--dragging' : ''}`}
                          draggable
                          onDragStart={(e) => handleDragStart(e, task.id, column.id)}
                          onClick={() => handleTaskClick(task, column.id)}
                        >
                          {/* Project badge */}
                          {task.project && (
                            <div className="task-card__project">
                              <span
                                className="task-card__project-dot"
                                style={{ backgroundColor: task.project.color }}
                              />
                              <span className="task-card__project-name">{task.project.name}</span>
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
              );
            })}

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
      )}

      <CreateColumnModal
        isOpen={isCreateColumnOpen}
        onClose={() => setIsCreateColumnOpen(false)}
        position={columns.length}
        onSuccess={() => refetchColumns()}
      />

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
          projects={projects}
          onSuccess={() => refetchTasks()}
        />
      )}
    </div>
  );
};

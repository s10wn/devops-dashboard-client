import { useState, useEffect, useRef, useCallback } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import {
  CREATE_TASK_MUTATION,
  UPDATE_TASK_MUTATION,
  DELETE_TASK_MUTATION,
  TASKS_QUERY,
  TASK_COMMENTS_QUERY,
  ADD_TASK_COMMENT_MUTATION,
} from '@entities/board';
import { Modal, Button, RichTextEditor } from '@shared/ui';
import { attachmentsApi, type Attachment } from '@shared/api';
import './task-modal.css';

type Label = {
  id: string;
  name: string;
  color: string;
};

type Project = {
  id: string;
  name: string;
  color?: string;
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
};

type Comment = {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  createdAt: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  columnId: string;
  labels: Label[];
  projects: Project[];
  onSuccess?: () => void;
};

const PRIORITIES = [
  { value: 'LOW', label: 'Низкий', color: '#6b7280', icon: '↓' },
  { value: 'MEDIUM', label: 'Средний', color: '#3b82f6', icon: '→' },
  { value: 'HIGH', label: 'Высокий', color: '#f97316', icon: '↑' },
  { value: 'URGENT', label: 'Срочный', color: '#ef4444', icon: '⚡' },
];

export const TaskModal = ({ isOpen, onClose, task, columnId, labels, projects, onSuccess }: Props) => {
  const isEdit = !!task;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<string>('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [newComment, setNewComment] = useState('');
  const [showLabelPicker, setShowLabelPicker] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: commentsData, refetch: refetchComments } = useQuery<{ taskComments: Comment[] }>(
    TASK_COMMENTS_QUERY,
    {
      variables: { taskId: task?.id },
      skip: !task?.id,
    }
  );
  const comments = (commentsData?.taskComments || []) as Comment[];

  const [createTask, { loading: creating }] = useMutation(CREATE_TASK_MUTATION, {
    refetchQueries: [{ query: TASKS_QUERY }],
    onCompleted: () => {
      handleClose();
      onSuccess?.();
    },
  });

  const [updateTask, { loading: updating }] = useMutation(UPDATE_TASK_MUTATION, {
    refetchQueries: [{ query: TASKS_QUERY }],
    onCompleted: () => {
      handleClose();
      onSuccess?.();
    },
  });

  const [deleteTask, { loading: deleting }] = useMutation(DELETE_TASK_MUTATION, {
    refetchQueries: [{ query: TASKS_QUERY }],
    onCompleted: () => {
      handleClose();
      onSuccess?.();
    },
  });

  const [addComment, { loading: addingComment }] = useMutation(ADD_TASK_COMMENT_MUTATION, {
    onCompleted: () => {
      setNewComment('');
      refetchComments();
    },
  });

  const loadAttachments = useCallback(async () => {
    if (!task?.id) {
      setAttachments([]);
      return;
    }
    try {
      const data = await attachmentsApi.getTaskAttachments(task.id);
      setAttachments(data);
    } catch (error) {
      console.error('Failed to load attachments:', error);
    }
  }, [task?.id]);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setPriority(task.priority);
      setDueDate(task.dueDate ? task.dueDate.split('T')[0] : '');
      setSelectedProjectId(task.projectId || '');
      setSelectedLabelIds([]);
      loadAttachments();
    } else {
      setTitle('');
      setDescription('');
      setPriority('MEDIUM');
      setDueDate('');
      setSelectedProjectId('');
      setSelectedLabelIds([]);
      setAttachments([]);
    }
  }, [task, loadAttachments]);

  function handleClose() {
    setTitle('');
    setDescription('');
    setPriority('MEDIUM');
    setDueDate('');
    setSelectedProjectId('');
    setSelectedLabelIds([]);
    setNewComment('');
    setShowLabelPicker(false);
    setAttachments([]);
    setUploadError(null);
    onClose();
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !task?.id) return;

    setUploading(true);
    setUploadError(null);

    try {
      for (const file of Array.from(files)) {
        const attachment = await attachmentsApi.uploadFile(task.id, file);
        setAttachments((prev) => [attachment, ...prev]);
      }
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!confirm('Удалить файл?')) return;

    try {
      await attachmentsApi.deleteAttachment(attachmentId);
      setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Delete failed');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType === 'application/pdf') return '📄';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return '📊';
    if (mimeType.includes('document') || mimeType.includes('word')) return '📝';
    return '📎';
  };

  const handleSubmit = () => {
    if (!title.trim()) return;

    // Check if description has actual content (not just empty HTML tags)
    const hasContent = description && description.replace(/<[^>]*>/g, '').trim().length > 0;

    const input = {
      title: title.trim(),
      description: hasContent ? description : undefined,
      priority,
      dueDate: dueDate || undefined,
      labelIds: selectedLabelIds.length > 0 ? selectedLabelIds : undefined,
      projectId: selectedProjectId || undefined,
    };

    if (isEdit) {
      updateTask({
        variables: {
          input: { taskId: task.id, ...input },
        },
      });
    } else {
      createTask({
        variables: {
          input: { columnId, ...input },
        },
      });
    }
  };

  const handleDelete = () => {
    if (!task || !confirm('Удалить задачу?')) return;
    deleteTask({ variables: { taskId: task.id } });
  };

  const handleAddComment = () => {
    if (!task || !newComment.trim()) return;
    addComment({
      variables: {
        input: {
          taskId: task.id,
          content: newComment.trim(),
        },
      },
    });
  };

  const toggleLabel = (labelId: string) => {
    setSelectedLabelIds((prev) =>
      prev.includes(labelId) ? prev.filter((id) => id !== labelId) : [...prev, labelId]
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const loading = creating || updating;
  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="full">
      <div className="task-modal">
        {/* Header */}
        <div className="task-modal__header">
          <div className="task-modal__header-left">
            <span className="task-modal__type-badge">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M3 3h10v10H3V3zm1 1v8h8V4H4z"/>
              </svg>
              Задача
            </span>
          </div>
          <div className="task-modal__header-actions">
            {isEdit && (
              <button
                type="button"
                className="task-modal__action-btn task-modal__action-btn--danger"
                onClick={handleDelete}
                disabled={deleting}
                title="Удалить"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                </svg>
              </button>
            )}
            <button
              type="button"
              className="task-modal__close-btn"
              onClick={handleClose}
              title="Закрыть"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 5L5 15M5 5l10 10" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="task-modal__content">
          {/* Main Section */}
          <div className="task-modal__main">
            {/* Title */}
            <div className="task-modal__title-section">
              <input
                type="text"
                className="task-modal__title-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Название задачи"
                autoFocus
              />
            </div>

            {/* Description */}
            <div className="task-modal__section">
              <div className="task-modal__section-header">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 6h16M4 12h16M4 18h10"/>
                </svg>
                <span>Описание</span>
              </div>
              <RichTextEditor
                content={description}
                onChange={setDescription}
                placeholder="Добавьте описание задачи..."
              />
            </div>

            {/* Activity / Comments */}
            {isEdit && (
              <div className="task-modal__section">
                <div className="task-modal__section-header">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                  </svg>
                  <span>Активность</span>
                  <span className="task-modal__comment-count">{comments.length}</span>
                </div>

                {/* Add comment */}
                <div className="task-modal__add-comment">
                  <div className="task-modal__avatar task-modal__avatar--sm">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                  <div className="task-modal__comment-input-wrapper">
                    <textarea
                      className="task-modal__comment-input"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Напишите комментарий..."
                      rows={2}
                    />
                    {newComment.trim() && (
                      <div className="task-modal__comment-actions">
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={handleAddComment}
                          disabled={addingComment}
                        >
                          Отправить
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Comments list */}
                <div className="task-modal__comments">
                  {comments.length === 0 ? (
                    <div className="task-modal__no-activity">
                      Пока нет комментариев
                    </div>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="task-modal__comment">
                        <div className="task-modal__avatar task-modal__avatar--sm">
                          {comment.author.avatarUrl ? (
                            <img src={comment.author.avatarUrl} alt={comment.author.name} />
                          ) : (
                            <span>{comment.author.name.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <div className="task-modal__comment-body">
                          <div className="task-modal__comment-meta">
                            <span className="task-modal__comment-author">{comment.author.name}</span>
                            <span className="task-modal__comment-time">{formatDate(comment.createdAt)}</span>
                          </div>
                          <div className="task-modal__comment-text">{comment.content}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="task-modal__sidebar">
            {/* Project */}
            <div className="task-modal__detail">
              <div className="task-modal__detail-label">Проект</div>
              <div className="task-modal__detail-value">
                <select
                  className="task-modal__select task-modal__select--project"
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  style={selectedProject ? { borderColor: selectedProject.color } : undefined}
                >
                  <option value="">Без проекта</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Priority */}
            <div className="task-modal__detail">
              <div className="task-modal__detail-label">Приоритет</div>
              <div className="task-modal__detail-value">
                <select
                  className="task-modal__select"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  {PRIORITIES.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.icon} {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Due Date */}
            <div className="task-modal__detail">
              <div className="task-modal__detail-label">Срок</div>
              <div className="task-modal__detail-value">
                <input
                  type="date"
                  className="task-modal__date-input"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>

            {/* Labels */}
            <div className="task-modal__detail">
              <div className="task-modal__detail-label">Метки</div>
              <div className="task-modal__detail-value">
                <button
                  type="button"
                  className="task-modal__labels-trigger"
                  onClick={() => setShowLabelPicker(!showLabelPicker)}
                >
                  {selectedLabelIds.length > 0 ? (
                    <div className="task-modal__selected-labels">
                      {selectedLabelIds.map((id) => {
                        const label = labels.find((l) => l.id === id);
                        return label ? (
                          <span
                            key={id}
                            className="task-modal__label-tag"
                            style={{ background: label.color }}
                          >
                            {label.name}
                          </span>
                        ) : null;
                      })}
                    </div>
                  ) : (
                    <span className="task-modal__no-labels">+ Добавить метку</span>
                  )}
                </button>

                {showLabelPicker && (
                  <div className="task-modal__label-picker">
                    {labels.length === 0 ? (
                      <div className="task-modal__label-picker-empty">Нет доступных меток</div>
                    ) : (
                      labels.map((label) => (
                        <button
                          key={label.id}
                          type="button"
                          className={`task-modal__label-option ${selectedLabelIds.includes(label.id) ? 'task-modal__label-option--selected' : ''}`}
                          onClick={() => toggleLabel(label.id)}
                        >
                          <span
                            className="task-modal__label-color"
                            style={{ background: label.color }}
                          />
                          <span className="task-modal__label-name">{label.name}</span>
                          {selectedLabelIds.includes(label.id) && (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Attachments - only show for existing tasks */}
            {isEdit && (
              <div className="task-modal__detail task-modal__detail--attachments">
                <div className="task-modal__detail-label">
                  Файлы
                  <span className="task-modal__attachment-count">{attachments.length}</span>
                </div>
                <div className="task-modal__detail-value">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    multiple
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    className="task-modal__upload-btn"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="task-modal__upload-spinner">
                          <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12"/>
                        </svg>
                        Загрузка...
                      </>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
                        </svg>
                        Загрузить файл
                      </>
                    )}
                  </button>

                  {uploadError && (
                    <div className="task-modal__upload-error">{uploadError}</div>
                  )}

                  {attachments.length > 0 && (
                    <div className="task-modal__attachments-list">
                      {attachments.map((attachment) => (
                        <div key={attachment.id} className="task-modal__attachment">
                          <span className="task-modal__attachment-icon">
                            {getFileIcon(attachment.mimeType)}
                          </span>
                          <div className="task-modal__attachment-info">
                            <a
                              href={attachmentsApi.getDownloadUrl(attachment.id)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="task-modal__attachment-name"
                            >
                              {attachment.originalName}
                            </a>
                            <span className="task-modal__attachment-meta">
                              {formatFileSize(attachment.size)}
                              {attachment.uploadedBy && ` • ${attachment.uploadedBy.name}`}
                            </span>
                          </div>
                          <button
                            type="button"
                            className="task-modal__attachment-delete"
                            onClick={() => handleDeleteAttachment(attachment.id)}
                            title="Удалить"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M18 6L6 18M6 6l12 12"/>
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="task-modal__footer">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Отмена
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSubmit}
            disabled={loading || !title.trim()}
          >
            {loading ? 'Сохранение...' : isEdit ? 'Сохранить' : 'Создать задачу'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

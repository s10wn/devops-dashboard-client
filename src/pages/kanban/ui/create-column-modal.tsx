import { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { CREATE_COLUMN_MUTATION, MY_COLUMNS_QUERY } from '@entities/board';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Input } from '@shared/ui';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  position: number;
  onSuccess?: () => void;
};

const COLORS = [
  '#737373', // gray
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#14b8a6', // teal
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
];

export const CreateColumnModal = ({ isOpen, onClose, position, onSuccess }: Props) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [wipLimit, setWipLimit] = useState('');

  const [createColumn, { loading }] = useMutation(CREATE_COLUMN_MUTATION, {
    refetchQueries: [{ query: MY_COLUMNS_QUERY }],
    onCompleted: () => {
      setName('');
      setColor(COLORS[0]);
      setWipLimit('');
      onClose();
      onSuccess?.();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    createColumn({
      variables: {
        input: {
          name: name.trim(),
          color,
          position,
          wipLimit: wipLimit ? parseInt(wipLimit, 10) : undefined,
        },
      },
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <form onSubmit={handleSubmit}>
        <ModalHeader onClose={onClose}>Добавить колонку</ModalHeader>

        <ModalBody>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <Input
              label="Название"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Название колонки"
              required
              autoFocus
            />

            <div>
              <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                Цвет
              </label>
              <div style={{ display: 'flex', gap: 'var(--space-xs)', flexWrap: 'wrap' }}>
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: c,
                      border: color === c ? '2px solid var(--text-primary)' : '2px solid transparent',
                      cursor: 'pointer',
                      transition: 'transform 0.1s',
                    }}
                  />
                ))}
              </div>
            </div>

            <Input
              label="WIP лимит"
              type="number"
              min="1"
              value={wipLimit}
              onChange={(e) => setWipLimit(e.target.value)}
              placeholder="Максимум задач (необязательно)"
            />
          </div>
        </ModalBody>

        <ModalFooter>
          <Button type="button" variant="secondary" onClick={onClose}>
            Отмена
          </Button>
          <Button type="submit" variant="primary" disabled={loading || !name.trim()}>
            {loading ? 'Создание...' : 'Создать'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

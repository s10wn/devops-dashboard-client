import { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { CREATE_BOARD_MUTATION, BOARDS_QUERY } from '@entities/board';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Input } from '@shared/ui';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export const CreateBoardModal = ({ isOpen, onClose }: Props) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const [createBoard, { loading }] = useMutation(CREATE_BOARD_MUTATION, {
    refetchQueries: [{ query: BOARDS_QUERY }],
    onCompleted: () => {
      setName('');
      setDescription('');
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    createBoard({
      variables: {
        input: {
          name: name.trim(),
          description: description.trim() || undefined,
        },
      },
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <form onSubmit={handleSubmit}>
        <ModalHeader onClose={onClose}>Создать доску</ModalHeader>

        <ModalBody>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <Input
              label="Название"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Название доски"
              required
              autoFocus
            />
            <Input
              label="Описание"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Описание (необязательно)"
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

import { useMutation } from '@apollo/client/react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { CREATE_TEAM_MUTATION, MY_TEAMS_QUERY, useTeamStore } from '@entities/team';
import { Modal, ModalHeader, ModalBody, ModalFooter, Input, Button } from '@shared/ui';

type CreateTeamFormData = {
  name: string;
  slug: string;
};

type CreateTeamModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

type Team = {
  id: string;
  name: string;
  slug: string;
};

type CreateTeamData = {
  createTeam: Team;
};

const createTeamSchema = yup.object({
  name: yup
    .string()
    .min(2, 'Минимум 2 символа')
    .required('Название обязательно'),
  slug: yup
    .string()
    .matches(/^[a-z0-9-]+$/, 'Только латиница, цифры и дефис')
    .min(2, 'Минимум 2 символа')
    .required('Slug обязателен'),
});

export const CreateTeamModal = ({ isOpen, onClose }: CreateTeamModalProps) => {
  const setCurrentTeam = useTeamStore((s) => s.setCurrentTeam);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateTeamFormData>({
    resolver: yupResolver(createTeamSchema),
  });

  const [createTeam, { loading, error }] = useMutation<CreateTeamData>(CREATE_TEAM_MUTATION, {
    refetchQueries: [{ query: MY_TEAMS_QUERY }],
    onCompleted: (data) => {
      setCurrentTeam(data.createTeam);
      reset();
      onClose();
    },
  });

  const onSubmit = (data: CreateTeamFormData) => {
    createTeam({ variables: { input: data } });
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="sm">
      <ModalHeader onClose={handleClose}>Создать команду</ModalHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <ModalBody>
          {error && <div className="form-error">{error.message}</div>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Input
              label="Название"
              placeholder="Моя команда"
              error={errors.name?.message}
              {...register('name')}
            />

            <Input
              label="Slug (URL)"
              placeholder="my-team"
              hint="Используется в URL: /team/my-team"
              error={errors.slug?.message}
              {...register('slug')}
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button type="button" variant="secondary" onClick={handleClose}>
            Отмена
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            Создать
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

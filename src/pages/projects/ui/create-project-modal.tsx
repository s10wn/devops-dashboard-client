import { useMutation } from '@apollo/client/react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { CREATE_PROJECT_MUTATION, UPDATE_PROJECT_MUTATION } from '@entities/project';
import { Modal, ModalHeader, ModalBody, ModalFooter, Input, Select, Button } from '@shared/ui';

const PROJECT_COLORS = [
  '#171717', // black
  '#dc2626', // red
  '#ea580c', // orange
  '#ca8a04', // yellow
  '#16a34a', // green
  '#0891b2', // cyan
  '#2563eb', // blue
  '#7c3aed', // violet
  '#c026d3', // fuchsia
  '#db2777', // pink
];

const CURRENCIES = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (\u20AC)' },
  { value: 'RUB', label: 'RUB (\u20BD)' },
  { value: 'TJS', label: 'TJS' },
];

const createProjectSchema = yup.object({
  name: yup.string().min(2, 'Минимум 2 символа').required('Обязательное поле'),
  description: yup.string().optional(),
  color: yup.string().optional(),
  provider: yup.string().optional(),
  monthlyCost: yup
    .number()
    .min(0, 'Стоимость не может быть отрицательной')
    .optional()
    .nullable()
    .transform((value, original) => (original === '' ? null : value)),
  currency: yup.string().optional(),
  nextPaymentDate: yup.string().optional(),
});

type CreateProjectFormData = yup.InferType<typeof createProjectSchema>;

type Project = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  isActive: boolean;
  provider?: string;
  monthlyCost?: number;
  currency?: string;
  nextPaymentDate?: string;
  lastPaymentDate?: string;
  createdAt: string;
};

type CreateProjectModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editProject?: Project | null;
};

export const CreateProjectModal = ({
  isOpen,
  onClose,
  onSuccess,
  editProject,
}: CreateProjectModalProps) => {
  const isEditing = !!editProject;

  const formatDateForInput = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toISOString().split('T')[0];
  };

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateProjectFormData>({
    resolver: yupResolver(createProjectSchema) as never,
    defaultValues: editProject
      ? {
          name: editProject.name,
          description: editProject.description || '',
          color: editProject.color || PROJECT_COLORS[0],
          provider: editProject.provider || '',
          monthlyCost: editProject.monthlyCost || null,
          currency: editProject.currency || 'USD',
          nextPaymentDate: formatDateForInput(editProject.nextPaymentDate),
        }
      : {
          color: PROJECT_COLORS[0],
          currency: 'USD',
        },
  });

  const selectedColor = watch('color');

  const [createProject, { loading: creating, error: createError }] = useMutation(
    CREATE_PROJECT_MUTATION,
    {
      onCompleted: () => {
        reset();
        onSuccess();
      },
    }
  );

  const [updateProject, { loading: updating, error: updateError }] = useMutation(
    UPDATE_PROJECT_MUTATION,
    {
      onCompleted: () => {
        reset();
        onSuccess();
      },
    }
  );

  const loading = creating || updating;
  const error = createError || updateError;

  const onSubmit = (data: CreateProjectFormData) => {
    const input = {
      name: data.name,
      description: data.description || undefined,
      color: data.color || undefined,
      provider: data.provider || undefined,
      monthlyCost: data.monthlyCost || undefined,
      currency: data.currency || undefined,
      nextPaymentDate: data.nextPaymentDate || undefined,
    };

    if (isEditing) {
      updateProject({
        variables: {
          input: {
            projectId: editProject.id,
            ...input,
          },
        },
      });
    } else {
      createProject({
        variables: { input },
      });
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <ModalHeader onClose={handleClose}>
        {isEditing ? 'Редактировать проект' : 'Создать проект'}
      </ModalHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <ModalBody>
          {error && <div className="form-error">{error.message}</div>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Input
              label="Название"
              placeholder="Мой проект"
              error={errors.name?.message}
              {...register('name')}
            />

            <Input
              label="Описание"
              placeholder="Краткое описание проекта"
              error={errors.description?.message}
              {...register('description')}
            />

            {/* Color Picker */}
            <div className="color-picker">
              <span className="color-picker__label">Цвет проекта</span>
              <div className="color-picker__options">
                {PROJECT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`color-picker__option ${selectedColor === color ? 'color-picker__option--selected' : ''}`}
                    style={{ background: color }}
                    onClick={() => setValue('color', color)}
                    aria-label={`Выбрать цвет ${color}`}
                  />
                ))}
              </div>
            </div>

            <Input
              label="Провайдер"
              placeholder="Hetzner, DO, AWS, Timeweb..."
              hint="Хостинг-провайдер или сервис"
              error={errors.provider?.message}
              {...register('provider')}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
              <Input
                label="Стоимость в месяц"
                type="number"
                step="0.01"
                placeholder="29.99"
                error={errors.monthlyCost?.message}
                {...register('monthlyCost', { valueAsNumber: true })}
              />

              <Select
                label="Валюта"
                error={errors.currency?.message}
                {...register('currency')}
              >
                {CURRENCIES.map((curr) => (
                  <option key={curr.value} value={curr.value}>
                    {curr.label}
                  </option>
                ))}
              </Select>
            </div>

            <Input
              label="Дата следующей оплаты"
              type="date"
              error={errors.nextPaymentDate?.message}
              {...register('nextPaymentDate')}
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button type="button" variant="secondary" onClick={handleClose}>
            Отмена
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            {isEditing ? 'Сохранить' : 'Создать'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};
